/**
 * ProgressTypes - 進度追蹤相關的型別定義
 * ==========================================
 * 定義進度追蹤系統的所有介面和型別，包含任務狀態、進度資訊和事件類型。
 * 
 * 主要功能：
 * - 定義任務執行狀態的標準格式
 * - 提供進度更新的結構化資料
 * - 支援不同階段的進度追蹤
 * - 統一錯誤處理格式
 */

/**
 * 任務執行狀態枚舉
 */
export enum TaskStatus {
  /** 任務已啟動，準備執行 */
  STARTED = 'started',
  /** 任務執行中 */
  RUNNING = 'running',
  /** 任務已完成 */
  COMPLETED = 'completed',
  /** 任務執行失敗 */
  FAILED = 'failed',
  /** 任務已取消 */
  CANCELLED = 'cancelled'
}

/**
 * 任務執行階段枚舉
 */
export enum TaskStage {
  /** 初始化階段 */
  INITIALIZING = 'initializing',
  /** 生成 RTK 資料 */
  GENERATING_RTK = 'generating_rtk',
  /** 插入 RTK 資料 */
  INSERTING_RTK = 'inserting_rtk',
  /** 生成使用者資料 */
  GENERATING_USERS = 'generating_users',
  /** 插入使用者資料 */
  INSERTING_USERS = 'inserting_users',
  /** 建立關聯關係 */
  CREATING_RELATIONSHIPS = 'creating_relationships',
  /** 完成階段 */
  FINALIZING = 'finalizing'
}

/**
 * 進度資訊介面
 * 描述任務當前的執行狀態和進度
 */
export interface ProgressInfo {
  /** 任務唯一識別碼 */
  taskId: string;
  /** 任務狀態 */
  status: TaskStatus;
  /** 當前執行階段 */
  stage: TaskStage;
  /** 整體進度百分比 (0-100) */
  percentage: number;
  /** 當前已完成的工作量 */
  current: number;
  /** 總工作量 */
  total: number;
  /** 進度描述訊息 */
  message: string;
  /** 任務開始時間 */
  startTime: Date;
  /** 最後更新時間 */
  lastUpdated: Date;
  /** 預估完成時間（可選） */
  estimatedCompletion?: Date;
  /** 錯誤訊息（失敗時提供） */
  error?: string;
  /** 詳細結果資料（完成時提供） */
  result?: any;
}

/**
 * 進度更新事件介面
 * 用於 SSE 推送的事件資料格式
 */
export interface ProgressEvent {
  /** 事件類型 */
  type: 'progress' | 'completed' | 'error';
  /** 時間戳記 */
  timestamp: number;
  /** 進度資訊 */
  data: ProgressInfo;
}

/**
 * 任務啟動回應介面
 */
export interface TaskStartResponse {
  /** 操作成功標記 */
  ok: boolean;
  /** 任務唯一識別碼 */
  taskId: string;
  /** 任務狀態 */
  status: TaskStatus;
  /** 回應訊息 */
  message: string;
  /** 進度追蹤端點 URL */
  progressUrl: string;
}

/**
 * 階段權重配置介面
 * 定義各階段在整體進度中的權重比例
 */
export interface StageWeights {
  [TaskStage.INITIALIZING]: number;
  [TaskStage.GENERATING_RTK]: number;
  [TaskStage.INSERTING_RTK]: number;
  [TaskStage.GENERATING_USERS]: number;
  [TaskStage.INSERTING_USERS]: number;
  [TaskStage.CREATING_RELATIONSHIPS]: number;
  [TaskStage.FINALIZING]: number;
}

/**
 * 預設階段權重配置
 * 根據各階段的預估執行時間分配權重
 */
export const DEFAULT_STAGE_WEIGHTS: StageWeights = {
  [TaskStage.INITIALIZING]: 0.05,           // 5% - 初始化
  [TaskStage.GENERATING_RTK]: 0.15,         // 15% - 生成 RTK 資料
  [TaskStage.INSERTING_RTK]: 0.25,          // 25% - 插入 RTK 資料
  [TaskStage.GENERATING_USERS]: 0.10,       // 10% - 生成使用者資料
  [TaskStage.INSERTING_USERS]: 0.30,        // 30% - 插入使用者資料
  [TaskStage.CREATING_RELATIONSHIPS]: 0.10, // 10% - 建立關聯關係
  [TaskStage.FINALIZING]: 0.05              // 5% - 完成處理
};

/**
 * 進度回調函數類型
 * 用於在任務執行過程中回報進度
 */
export type ProgressCallback = (progress: ProgressInfo) => void;

/**
 * 任務執行選項介面
 */
export interface TaskExecutionOptions {
  /** 批次大小 */
  batchSize?: number;
  /** 是否並行執行 */
  parallel?: boolean;
  /** 進度回調函數 */
  onProgress?: ProgressCallback;
  /** 任務超時時間（毫秒） */
  timeout?: number;
}