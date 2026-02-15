import { useState, useCallback } from 'react';
import { addToQueue, getQueue } from './storage';

interface QueueActionParams {
  type: string;
  payload: any;
  execute: () => Promise<void>;
}

// Hook for queuing offline actions
// When online: executes immediately and queues as backup
// When offline: queues for later sync
export function useOfflineQueue() {
  const [isProcessing, setIsProcessing] = useState(false);

  const queueAction = useCallback(async ({ type, payload, execute }: QueueActionParams) => {
    setIsProcessing(true);
    
    try {
      // Try to execute immediately
      await execute();
      // If successful, no need to queue (already synced)
    } catch (error: any) {
      // If failed, add to queue for retry
      console.log('Action failed, queuing for retry:', type);
      addToQueue({ type, payload });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getPendingCount = useCallback(() => {
    return getQueue().length;
  }, []);

  return {
    queueAction,
    getPendingCount,
    isProcessing,
  };
}
