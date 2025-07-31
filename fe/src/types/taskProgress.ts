/**
 * 進度追蹤相關接口
 */
export interface TaskProgress {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  startTime: string;
  estimatedEndTime?: string;
  actualEndTime?: string;
  message?: string;
  error?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressStreamEvent {
  type: 'progress' | 'status' | 'error' | 'completed';
  taskId: string;
  data: Partial<TaskProgress>;
  timestamp: string;
}