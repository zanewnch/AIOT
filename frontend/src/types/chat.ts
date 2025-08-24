/**
 * @fileoverview 聊天功能相關的 TypeScript 類型定義
 *
 * 此檔案定義了聊天系統中使用的所有介面和類型，包含：
 * - 聊天訊息格式
 * - API 請求/回應格式
 * - 聊天狀態管理
 * - RAG 相關配置
 *
 * @author AIOT Team
 * @version 1.0.0
 */

/**
 * 聊天訊息類型枚舉
 */
export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  ERROR = 'error'
}

/**
 * 聊天訊息介面
 */
export interface ChatMessage {
  /** 訊息唯一識別碼 */
  id: string;
  /** 訊息類型 */
  type: MessageType;
  /** 訊息內容 */
  content: string;
  /** 訊息時間戳 */
  timestamp: Date;
  /** 是否正在載入中 */
  isLoading?: boolean;
  /** 錯誤訊息（如果有） */
  error?: string;
  /** RAG 來源文件（如果有） */
  sources?: string[];
  /** 使用的模型名稱 */
  model?: string;
}

/**
 * 聊天請求參數介面
 */
export interface ChatRequest {
  /** 用戶輸入的提示 */
  prompt: string;
  /** 是否使用 RAG 功能 */
  useRag?: boolean;
  /** 圖片 URL（用於視覺問答） */
  imageUrl?: string;
  /** 是否使用對話記憶 */
  useConversation?: boolean;
}

/**
 * 聊天回應介面
 */
export interface ChatResponse {
  /** 請求是否成功 */
  success: boolean;
  /** AI 生成的回應內容 */
  response?: string;
  /** RAG 檢索的來源文件 */
  sources?: string[];
  /** 使用的模型名稱 */
  model?: string;
  /** 錯誤訊息（如果有） */
  error?: string;
}

/**
 * 文檔上傳請求介面
 */
export interface DocumentUploadRequest {
  /** 要上傳的文檔列表 */
  documents: string[];
}

/**
 * 文檔上傳回應介面
 */
export interface DocumentUploadResponse {
  /** 上傳是否成功 */
  success: boolean;
  /** 狀態訊息 */
  message?: string;
  /** 上傳的文檔數量 */
  documentsAdded?: number;
  /** 錯誤訊息（如果有） */
  error?: string;
}

/**
 * LLM 服務健康狀態介面
 */
export interface LLMHealthStatus {
  /** 模型名稱 */
  model: string;
  /** 模型是否可用 */
  available: boolean;
  /** 服務主機 */
  host: string;
  /** 健康狀態 */
  status: 'healthy' | 'unhealthy';
}

/**
 * 聊天設定介面
 */
export interface ChatSettings {
  /** 是否啟用 RAG */
  ragEnabled: boolean;
  /** 是否啟用對話記憶 */
  conversationMode: boolean;
  /** 是否啟用串流回應 */
  streamEnabled: boolean;
  /** 最大訊息歷史數量 */
  maxMessageHistory: number;
  /** 自動儲存設定 */
  autoSave: boolean;
}

/**
 * 聊天狀態介面
 */
export interface ChatState {
  /** 聊天訊息列表 */
  messages: ChatMessage[];
  /** 是否正在發送訊息 */
  isLoading: boolean;
  /** 是否已連接到服務 */
  isConnected: boolean;
  /** 聊天設定 */
  settings: ChatSettings;
  /** 目前的錯誤狀態 */
  error: string | null;
  /** 服務健康狀態 */
  healthStatus: LLMHealthStatus | null;
}

/**
 * 串流回應事件介面
 */
export interface StreamEvent {
  /** 事件類型 */
  type: 'data' | 'error' | 'end';
  /** 事件資料 */
  data?: string;
  /** 錯誤訊息（如果有） */
  error?: string;
}

/**
 * 聊天統計資訊介面
 */
export interface ChatStatistics {
  /** 總訊息數量 */
  totalMessages: number;
  /** 用戶訊息數量 */
  userMessages: number;
  /** 助手回應數量 */
  assistantMessages: number;
  /** 平均回應時間（毫秒） */
  averageResponseTime: number;
  /** 使用 RAG 的次數 */
  ragUsageCount: number;
}

/**
 * 預設聊天設定
 */
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  ragEnabled: false,
  conversationMode: true,
  streamEnabled: false,
  maxMessageHistory: 50,
  autoSave: true
};

/**
 * API 端點常數 - FastAPI 直接端點
 */
export const CHAT_API_ENDPOINTS = {
  GENERATE: '/generate',
  CONVERSATION: '/conversational',
  STREAM: '/stream',
  DOCUMENTS: '/documents',
  HEALTH: '/health'
} as const;

/**
 * 聊天常數
 */
export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_DOCUMENTS_PER_UPLOAD: 10,
  TYPING_INDICATOR_DELAY: 500,
  AUTO_SAVE_INTERVAL: 30000, // 30 秒
  CONNECTION_TIMEOUT: 10000, // 10 秒
  RETRY_ATTEMPTS: 3
} as const;