/**
 * @fileoverview 聊天功能相關的 React Query Hooks
 * 
 * 處理與 LLM 服務的 API 通信：
 * - 文字生成請求
 * - 對話記憶管理
 * - RAG 文檔上傳
 * - 健康狀態檢查
 * 
 * @author AIOT Development Team
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger } from '../configs/loggerConfig';
import type { 
  ChatMessage,
  ChatRequest,
  ChatResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  LLMHealthStatus
} from '../types/chat';

// 創建服務專用的日誌記錄器
const logger = createLogger('ChatQuery');

/**
 * ChatQuery - 聊天查詢服務類
 * 
 * 使用 class 封裝所有與聊天功能相關的 React Query 操作
 */
export class ChatQuery {
  public CHAT_QUERY_KEYS: {
    readonly ALL: readonly ['chat'];
    readonly HEALTH: readonly ['chat', 'health'];
    readonly MESSAGES: readonly ['chat', 'messages'];
    readonly CONVERSATION: readonly ['chat', 'conversation'];
  };

  // LLM 服務基礎 URL
  private readonly LLM_SERVICE_URL: string;

  constructor() {
    this.CHAT_QUERY_KEYS = {
      ALL: ['chat'] as const,
      HEALTH: ['chat', 'health'] as const,
      MESSAGES: ['chat', 'messages'] as const,
      CONVERSATION: ['chat', 'conversation'] as const,
    } as const;

    // 從環境變數獲取 LLM 服務 URL，預設為本地開發環境
    this.LLM_SERVICE_URL = process.env.REACT_APP_LLM_SERVICE_URL || 'http://localhost:8022';
  }

  /**
   * LLM 服務健康狀態查詢 Hook
   */
  useLLMHealthStatus() {
    return useQuery({
      queryKey: this.CHAT_QUERY_KEYS.HEALTH,
      queryFn: async (): Promise<LLMHealthStatus> => {
        try {
          logger.debug('Checking LLM service health status');
          
          const result = await apiClient.getWithResult<LLMHealthStatus>(
            `${this.LLM_SERVICE_URL}/api/transformers/health/`
          );
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info('LLM service health check completed', { status: result.data?.status });
          return result.data || {
            model: 'unknown',
            available: false,
            host: this.LLM_SERVICE_URL,
            status: 'unhealthy'
          };
        } catch (error: any) {
          logger.error('LLM service health check failed:', error);
          
          // 返回預設的不健康狀態
          return {
            model: 'unknown',
            available: false,
            host: this.LLM_SERVICE_URL,
            status: 'unhealthy'
          };
        }
      },
      staleTime: 30 * 1000, // 30秒
      gcTime: 60 * 1000, // 1分鐘
      retry: 2,
      refetchInterval: 60 * 1000, // 每分鐘重新檢查
    });
  }

  /**
   * 文字生成 Mutation
   */
  useGenerateText() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (request: ChatRequest): Promise<ChatResponse> => {
        try {
          logger.debug('Sending text generation request', { 
            prompt: request.prompt.substring(0, 100),
            useRag: request.useRag,
            useConversation: request.useConversation
          });

          // 根據是否使用對話模式選擇不同的端點
          const endpoint = request.useConversation 
            ? '/api/transformers/conversation/'
            : '/api/transformers/generate/';
          
          const result = await apiClient.postWithResult<ChatResponse>(
            `${this.LLM_SERVICE_URL}${endpoint}`,
            {
              prompt: request.prompt,
              use_rag: request.useRag || false,
              image_url: request.imageUrl
            }
          );
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info('Text generation completed successfully');
          return result.data || {
            success: false,
            error: 'No response data received'
          };
        } catch (error: any) {
          logger.error('Text generation failed:', error);
          
          const errorMessage = error.response?.data?.message || error.message || 'Text generation failed';
          return {
            success: false,
            error: errorMessage
          };
        }
      },
      onSuccess: (data) => {
        // 成功後可以更新相關的查詢緩存
        if (data.success) {
          queryClient.invalidateQueries({ queryKey: this.CHAT_QUERY_KEYS.CONVERSATION });
        }
      },
      retry: 1,
    });
  }

  /**
   * 文檔上傳 Mutation
   */
  useUploadDocuments() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (request: DocumentUploadRequest): Promise<DocumentUploadResponse> => {
        try {
          logger.debug('Uploading documents', { count: request.documents.length });
          
          const result = await apiClient.postWithResult<DocumentUploadResponse>(
            `${this.LLM_SERVICE_URL}/api/transformers/documents/`,
            {
              documents: request.documents
            }
          );
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info('Documents uploaded successfully', { 
            count: result.data?.documentsAdded || request.documents.length 
          });
          return result.data || {
            success: false,
            error: 'No response data received'
          };
        } catch (error: any) {
          logger.error('Document upload failed:', error);
          
          const errorMessage = error.response?.data?.message || error.message || 'Document upload failed';
          return {
            success: false,
            error: errorMessage
          };
        }
      },
      onSuccess: (data) => {
        // 成功上傳文檔後，RAG 功能可能會受到影響，清除相關緩存
        if (data.success) {
          logger.info('Documents uploaded, clearing related caches');
          queryClient.invalidateQueries({ queryKey: this.CHAT_QUERY_KEYS.ALL });
        }
      },
      retry: 1,
    });
  }

  /**
   * 檢查服務連接性
   */
  useTestConnection() {
    return useQuery({
      queryKey: [...this.CHAT_QUERY_KEYS.HEALTH, 'connection'],
      queryFn: async (): Promise<boolean> => {
        try {
          logger.debug('Testing LLM service connection');
          
          const result = await apiClient.getWithResult<any>(
            `${this.LLM_SERVICE_URL}/health/`
          );
          
          const isConnected = result.isSuccess() && result.data?.status === 'healthy';
          logger.info('Connection test completed', { connected: isConnected });
          
          return isConnected;
        } catch (error: any) {
          logger.error('Connection test failed:', error);
          return false;
        }
      },
      staleTime: 10 * 1000, // 10秒
      gcTime: 30 * 1000, // 30秒
      retry: 1,
      refetchInterval: 30 * 1000, // 每30秒檢查一次連接
    });
  }

  /**
   * 清除聊天相關的所有緩存
   */
  useClearChatCache() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (): Promise<void> => {
        logger.info('Clearing all chat-related cache');
        await queryClient.invalidateQueries({ queryKey: this.CHAT_QUERY_KEYS.ALL });
        await queryClient.removeQueries({ queryKey: this.CHAT_QUERY_KEYS.ALL });
      },
      onSuccess: () => {
        logger.info('Chat cache cleared successfully');
      }
    });
  }

  /**
   * 批量重試請求 - 工具方法
   */
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn(`Request attempt ${attempt} failed`, { 
          error: lastError.message,
          attempt,
          maxRetries 
        });
        
        if (attempt < maxRetries) {
          // 指數退避延遲
          const delay = delayMs * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }
}

// 創建並導出 ChatQuery 實例
const chatQuery = new ChatQuery();

/**
 * 便捷的 Hook 導出
 */
export const useLLMHealthStatus = () => chatQuery.useLLMHealthStatus();
export const useGenerateText = () => chatQuery.useGenerateText();
export const useUploadDocuments = () => chatQuery.useUploadDocuments();
export const useTestConnection = () => chatQuery.useTestConnection();
export const useClearChatCache = () => chatQuery.useClearChatCache();

// 導出 ChatQuery 類別供進階使用
export { chatQuery };
export default ChatQuery;