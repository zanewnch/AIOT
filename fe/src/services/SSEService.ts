/**
 * SSE (Server-Sent Events) 服務
 * 用於接收後端的即時進度更新
 */

export interface ProgressInfo {
  taskId: string;
  status: 'started' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  percentage: number;
  current: number;
  total: number;
  message: string;
  startTime: string;
  lastUpdated: string;
  estimatedCompletion?: string;
  error?: string;
  result?: any;
}

export interface ProgressEvent {
  type: 'progress' | 'completed' | 'error';
  timestamp: number;
  data: ProgressInfo;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export class SSEService {
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, ProgressCallback> = new Map();

  /**
   * 連接到指定任務的 SSE 端點
   * @param taskId 任務 ID
   * @param callback 進度回調函數
   */
  connectToTask(taskId: string, callback: ProgressCallback): void {
    // 關閉現有連接
    this.disconnect();

    // 建立新連接
    const url = `http://localhost:8010/api/progress/${taskId}/stream`;
    this.eventSource = new EventSource(url);

    // 儲存回調函數
    this.callbacks.set(taskId, callback);

    // 監聽進度事件
    this.eventSource.addEventListener('progress', (event) => {
      try {
        const progressEvent: ProgressEvent = JSON.parse(event.data);
        callback(progressEvent);
      } catch (error) {
        console.error('Failed to parse progress event:', error);
      }
    });

    // 監聽完成事件
    this.eventSource.addEventListener('completed', (event) => {
      try {
        const progressEvent: ProgressEvent = JSON.parse(event.data);
        callback(progressEvent);
        // 任務完成後自動斷開連接
        this.disconnect();
      } catch (error) {
        console.error('Failed to parse completed event:', error);
      }
    });

    // 監聽錯誤事件
    this.eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      
      // 嘗試解析錯誤訊息
      try {
        if (event.data) {
          const errorEvent: ProgressEvent = JSON.parse(event.data);
          callback(errorEvent);
        }
      } catch (parseError) {
        // 如果無法解析錯誤訊息，創建一個通用錯誤事件
        const errorEvent: ProgressEvent = {
          type: 'error',
          timestamp: Date.now(),
          data: {
            taskId,
            status: 'failed',
            stage: 'unknown',
            percentage: 0,
            current: 0,
            total: 0,
            message: 'SSE connection error',
            startTime: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            error: 'Connection failed'
          }
        };
        callback(errorEvent);
      }
      
      // 連接錯誤時自動斷開
      this.disconnect();
    });

    // 監聽連接打開事件
    this.eventSource.onopen = () => {
      console.log(`SSE connection opened for task ${taskId}`);
    };

    // 監聽連接錯誤事件
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };
  }

  /**
   * 斷開 SSE 連接
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.callbacks.clear();
  }

  /**
   * 檢查是否已連接
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * 獲取連接狀態
   */
  getConnectionState(): number {
    return this.eventSource ? this.eventSource.readyState : EventSource.CLOSED;
  }
}

// 單例模式
export const sseService = new SSEService();