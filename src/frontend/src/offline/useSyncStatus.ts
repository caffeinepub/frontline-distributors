import { useState, useEffect, useCallback, useRef } from 'react';
import { getQueue, removeFromQueue } from './storage';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';

// Hook for tracking sync status and processing queued actions
export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const processingRef = useRef(false);

  // Update pending count
  const updatePendingCount = useCallback(() => {
    try {
      const queue = getQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  }, []);

  // Process queued actions
  const processQueue = useCallback(async () => {
    if (!actor || !isOnline || isSyncing || processingRef.current) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    processingRef.current = true;
    setIsSyncing(true);
    setLastError(null);

    for (const action of queue) {
      try {
        // Execute queued action based on type
        switch (action.type) {
          case 'createProduct':
            await actor.createProduct(action.payload);
            break;
          case 'updateProduct':
            await actor.updateProduct(action.payload);
            break;
          case 'deleteProduct':
            await actor.deleteProduct(action.payload);
            break;
          case 'createCustomer':
            await actor.createCustomer(action.payload);
            break;
          case 'updateCustomer':
            await actor.updateCustomer(action.payload);
            break;
          case 'deleteCustomer':
            await actor.deleteCustomer(action.payload);
            break;
          case 'createBill':
            await actor.createBill(action.payload);
            break;
          case 'deleteBill':
            await actor.deleteBill(action.payload);
            break;
          case 'createExpense':
            await actor.createExpense(action.payload);
            break;
          case 'deleteExpense':
            await actor.deleteExpense(action.payload);
            break;
          default:
            console.warn('Unknown action type:', action.type);
        }

        // Remove from queue on success
        removeFromQueue(action.id);
      } catch (error: any) {
        console.error('Sync error for action:', action.type, error);
        setLastError(`Failed to sync ${action.type}`);
        break; // Stop processing on first error
      }
    }

    // Invalidate all queries to refresh data
    queryClient.invalidateQueries();
    updatePendingCount();
    setIsSyncing(false);
    processingRef.current = false;
  }, [actor, isOnline, isSyncing, queryClient, updatePendingCount]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && actor && !processingRef.current) {
      const timer = setTimeout(() => {
        processQueue();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, actor, processQueue]);

  // Update pending count periodically
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const retry = useCallback(() => {
    setLastError(null);
    if (!processingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  return {
    isOnline,
    pendingCount,
    lastError,
    isSyncing,
    retry,
  };
}
