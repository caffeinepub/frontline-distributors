// Local storage abstraction for offline-first data persistence
// Stores cached entities and queued mutations with timestamps

const STORAGE_PREFIX = 'frontline_';

export interface CachedEntity<T> {
  data: T;
  timestamp: number;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Get item from localStorage
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return null;
    return JSON.parse(item);
  } catch (error) {
    console.error('Storage get error:', error);
    return null;
  }
}

// Set item in localStorage
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage set error:', error);
  }
}

// Remove item from localStorage
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error('Storage remove error:', error);
  }
}

// Cache entity with timestamp
export function cacheEntity<T>(key: string, data: T): void {
  const cached: CachedEntity<T> = {
    data,
    timestamp: Date.now(),
  };
  setStorageItem(key, cached);
}

// Get cached entity
export function getCachedEntity<T>(key: string): T | null {
  const cached = getStorageItem<CachedEntity<T>>(key);
  if (!cached) return null;
  return cached.data;
}

// Queue management
export function getQueue(): QueuedAction[] {
  return getStorageItem<QueuedAction[]>('queue') || [];
}

export function setQueue(queue: QueuedAction[]): void {
  setStorageItem('queue', queue);
}

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };
  queue.push(newAction);
  setQueue(queue);
}

export function removeFromQueue(actionId: string): void {
  const queue = getQueue();
  setQueue(queue.filter(a => a.id !== actionId));
}

export function incrementRetryCount(actionId: string): void {
  const queue = getQueue();
  const action = queue.find(a => a.id === actionId);
  if (action) {
    action.retryCount++;
    setQueue(queue);
  }
}
