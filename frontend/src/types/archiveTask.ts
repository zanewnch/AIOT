/**
 * @fileoverview 歸檔任務相關的 TypeScript 類型定義
 * 
 * 此文件定義了歸檔任務系統的所有相關類型，
 * 包括任務模型、請求/響應類型、統計資訊等。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

/**
 * 歸檔任務類型枚舉
 */
export enum ArchiveJobType {
  POSITIONS = 'positions',
  COMMANDS = 'commands',
  STATUS = 'status'
}

/**
 * 歸檔任務狀態枚舉
 */
export enum ArchiveTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 歸檔任務基本資料介面
 */
export interface ArchiveTask {
  /** 任務 ID */
  id: number;
  /** 任務類型 */
  job_type: ArchiveJobType;
  /** 目標資料表名稱 */
  table_name: string;
  /** 歸檔表名稱 */
  archive_table_name: string;
  /** 歸檔資料起始時間 */
  date_range_start: string;
  /** 歸檔資料結束時間 */
  date_range_end: string;
  /** 批次 ID */
  batch_id: string;
  /** 總記錄數 */
  total_records: number;
  /** 已歸檔記錄數 */
  archived_records: number;
  /** 任務狀態 */
  status: ArchiveTaskStatus;
  /** 開始時間 */
  started_at: string | null;
  /** 完成時間 */
  completed_at: string | null;
  /** 錯誤訊息 */
  error_message: string | null;
  /** 創建者 */
  created_by: string;
  /** 建立時間 */
  createdAt: string;
  /** 更新時間 */
  updatedAt: string;
}

/**
 * 創建歸檔任務請求介面
 */
export interface CreateArchiveTaskRequest {
  /** 任務類型 */
  jobType: ArchiveJobType;
  /** 目標資料表名稱 */
  tableName: string;
  /** 歸檔表名稱 */
  archiveTableName: string;
  /** 歸檔資料起始時間 */
  dateRangeStart: Date | string;
  /** 歸檔資料結束時間 */
  dateRangeEnd: Date | string;
  /** 創建者 */
  createdBy: string;
  /** 批次ID（可選，系統會自動生成） */
  batchId?: string;
}

/**
 * 歸檔任務執行結果介面
 */
export interface ArchiveTaskExecutionResult {
  /** 任務ID */
  taskId: number;
  /** 執行狀態 */
  status: ArchiveTaskStatus;
  /** 總記錄數 */
  totalRecords: number;
  /** 已歸檔記錄數 */
  archivedRecords: number;
  /** 執行時間（毫秒） */
  executionTime: number;
  /** 錯誤訊息（如果有） */
  errorMessage?: string;
}

/**
 * 歸檔任務統計資訊介面
 */
export interface ArchiveTaskStatistics {
  /** 總任務數 */
  totalTasks: number;
  /** 待執行任務數 */
  pendingTasks: number;
  /** 執行中任務數 */
  runningTasks: number;
  /** 已完成任務數 */
  completedTasks: number;
  /** 失敗任務數 */
  failedTasks: number;
  /** 各類型任務統計 */
  tasksByType: Record<ArchiveJobType, number>;
  /** 今日任務數 */
  todayTasks: number;
  /** 本週任務數 */
  weekTasks: number;
  /** 本月任務數 */
  monthTasks: number;
}

/**
 * 批次歸檔操作結果介面
 */
export interface BatchArchiveResult {
  /** 批次ID */
  batchId: string;
  /** 創建的任務列表 */
  tasks: ArchiveTask[];
  /** 成功創建的任務數 */
  successCount: number;
  /** 失敗的任務數 */
  failureCount: number;
  /** 錯誤訊息列表 */
  errors: string[];
}

/**
 * 歸檔任務查詢選項介面
 */
export interface ArchiveTaskQueryOptions {
  /** 任務類型篩選 */
  jobType?: ArchiveJobType;
  /** 任務狀態篩選 */
  status?: ArchiveTaskStatus;
  /** 批次ID篩選 */
  batchId?: string;
  /** 創建者篩選 */
  createdBy?: string;
  /** 開始日期範圍 */
  dateRangeStart?: Date | string;
  /** 結束日期範圍 */
  dateRangeEnd?: Date | string;
  /** 排序欄位 */
  sortBy?: keyof ArchiveTask;
  /** 排序順序 */
  sortOrder?: 'asc' | 'desc';
  /** 分頁限制 */
  limit?: number;
  /** 分頁偏移 */
  offset?: number;
}

/**
 * 歸檔任務取消請求介面
 */
export interface CancelArchiveTaskRequest {
  /** 取消原因 */
  reason: string;
}

/**
 * 歸檔任務清理請求介面
 */
export interface CleanupArchiveTasksRequest {
  /** 保留天數 */
  daysOld: number;
  /** 要清理的任務狀態（可選） */
  status?: ArchiveTaskStatus;
}

/**
 * API 響應包裝介面
 */
export interface ApiResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 響應資料 */
  data: T;
  /** 響應訊息 */
  message: string;
}

/**
 * 歸檔任務進度資訊介面
 */
export interface ArchiveTaskProgress {
  /** 任務ID */
  taskId: number;
  /** 總記錄數 */
  totalRecords: number;
  /** 已處理記錄數 */
  processedRecords: number;
  /** 進度百分比 */
  progressPercentage: number;
  /** 預估剩餘時間（毫秒） */
  estimatedTimeRemaining?: number;
  /** 處理速度（記錄/秒） */
  processingRate?: number;
}

/**
 * 歸檔任務詳細資訊介面（包含計算屬性）
 */
export interface ArchiveTaskDetail extends ArchiveTask {
  /** 進度百分比 */
  progressPercentage: number;
  /** 執行時間（毫秒） */
  executionTime: number | null;
  /** 是否已完成 */
  isCompleted: boolean;
  /** 是否成功 */
  isSuccessful: boolean;
  /** 任務摘要 */
  summary: string;
}

/**
 * 歸檔任務類型顯示名稱映射
 */
export const ArchiveJobTypeDisplayNames: Record<ArchiveJobType, string> = {
  [ArchiveJobType.POSITIONS]: '位置資料',
  [ArchiveJobType.COMMANDS]: '指令資料',
  [ArchiveJobType.STATUS]: '狀態資料'
};

/**
 * 歸檔任務狀態顯示名稱映射
 */
export const ArchiveTaskStatusDisplayNames: Record<ArchiveTaskStatus, string> = {
  [ArchiveTaskStatus.PENDING]: '待執行',
  [ArchiveTaskStatus.RUNNING]: '執行中',
  [ArchiveTaskStatus.COMPLETED]: '已完成',
  [ArchiveTaskStatus.FAILED]: '執行失敗'
};

/**
 * 歸檔任務狀態顏色映射
 */
export const ArchiveTaskStatusColors: Record<ArchiveTaskStatus, string> = {
  [ArchiveTaskStatus.PENDING]: '#fbbf24', // yellow
  [ArchiveTaskStatus.RUNNING]: '#3b82f6', // blue
  [ArchiveTaskStatus.COMPLETED]: '#10b981', // green
  [ArchiveTaskStatus.FAILED]: '#ef4444' // red
};

/**
 * 計算進度百分比
 */
export const calculateProgressPercentage = (archived: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((archived / total) * 100);
};

/**
 * 計算執行時間
 */
export const calculateExecutionTime = (startedAt: string | null, completedAt: string | null): number | null => {
  if (!startedAt) return null;
  const endTime = completedAt ? new Date(completedAt) : new Date();
  return endTime.getTime() - new Date(startedAt).getTime();
};

/**
 * 檢查任務是否已完成
 */
export const isTaskCompleted = (status: ArchiveTaskStatus): boolean => {
  return status === ArchiveTaskStatus.COMPLETED || status === ArchiveTaskStatus.FAILED;
};

/**
 * 檢查任務是否成功
 */
export const isTaskSuccessful = (status: ArchiveTaskStatus): boolean => {
  return status === ArchiveTaskStatus.COMPLETED;
};

/**
 * 格式化執行時間為人類可讀格式
 */
export const formatExecutionTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小時${minutes % 60}分鐘`;
  } else if (minutes > 0) {
    return `${minutes}分鐘${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

/**
 * 生成任務摘要
 */
export const generateTaskSummary = (task: ArchiveTask): string => {
  const typeDisplayName = ArchiveJobTypeDisplayNames[task.job_type];
  const statusDisplayName = ArchiveTaskStatusDisplayNames[task.status];
  
  let summary = `${typeDisplayName}歸檔任務 - ${statusDisplayName}`;
  
  if (task.status === ArchiveTaskStatus.RUNNING || task.status === ArchiveTaskStatus.COMPLETED) {
    const progress = calculateProgressPercentage(task.archived_records, task.total_records);
    summary += ` (進度: ${progress}% - ${task.archived_records}/${task.total_records})`;
  }
  
  const executionTime = calculateExecutionTime(task.started_at, task.completed_at);
  if (executionTime && isTaskCompleted(task.status)) {
    summary += ` (耗時: ${formatExecutionTime(executionTime)})`;
  }
  
  if (task.error_message) {
    summary += ` - 錯誤: ${task.error_message}`;
  }
  
  return summary;
};