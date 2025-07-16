import { useState, useEffect, useCallback } from 'react';
import { sseService, ProgressEvent, ProgressInfo } from '../services/SSEService';

export interface ProgressState {
  isTracking: boolean;
  progress: ProgressInfo | null;
  error: string | null;
}

export const useProgressTracking = () => {
  const [progressState, setProgressState] = useState<ProgressState>({
    isTracking: false,
    progress: null,
    error: null
  });

  const startTracking = useCallback((taskId: string) => {
    console.log(`Starting progress tracking for task: ${taskId}`);
    
    setProgressState({
      isTracking: true,
      progress: null,
      error: null
    });

    const handleProgressEvent = (event: ProgressEvent) => {
      console.log('Progress event received:', event);
      
      if (event.type === 'error') {
        setProgressState(prev => ({
          ...prev,
          isTracking: false,
          error: event.data.error || 'Unknown error occurred'
        }));
      } else {
        setProgressState(prev => ({
          ...prev,
          progress: event.data,
          isTracking: event.type !== 'completed'
        }));
      }
    };

    sseService.connectToTask(taskId, handleProgressEvent);
  }, []);

  const stopTracking = useCallback(() => {
    console.log('Stopping progress tracking');
    sseService.disconnect();
    setProgressState({
      isTracking: false,
      progress: null,
      error: null
    });
  }, []);

  // 清理函數
  useEffect(() => {
    return () => {
      sseService.disconnect();
    };
  }, []);

  return {
    ...progressState,
    startTracking,
    stopTracking
  };
};