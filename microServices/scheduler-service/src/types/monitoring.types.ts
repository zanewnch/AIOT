/**
 * @fileoverview 監控相關類型定義
 * 
 * 定義監控和通知系統之間共用的類型
 */

export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'task_failure' | 'queue_size';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}