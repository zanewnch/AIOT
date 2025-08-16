/**
 * @fileoverview AI 聊天頁面組件
 *
 * 此檔案提供一個完整的 AI 聊天介面，包含：
 * - 聊天訊息顯示
 * - 用戶輸入區域
 * - 聊天設定面板
 * - RAG 文檔上傳功能
 * - 對話記憶管理
 *
 * @author AIOT Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createLogger } from '../configs/loggerConfig';
import { useLLMHealthStatus, useGenerateText, useTestConnection } from '../hooks/useChatQuery';
import type { ChatMessage as ChatMessageType, ChatRequest } from '../types/chat';
import { MessageType } from '../types/chat';
import styles from '../styles/ChatPage.module.scss';

// 創建 ChatPage 專用的 logger 實例
const logger = createLogger('ChatPage');

// 使用從 types/chat.ts 導入的 ChatMessage 類型

/**
 * 聊天頁面組件
 */
export const ChatPage: React.FC = () => {
  // React Query hooks
  const { data: healthStatus, isLoading: healthLoading } = useLLMHealthStatus();
  const { data: isConnected } = useTestConnection();
  const generateTextMutation = useGenerateText();

  // 狀態管理
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      type: MessageType.SYSTEM,
      content: '歡迎使用 AI 聊天助手！我可以回答您的問題並協助您完成各種任務。',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [useRag, setUseRag] = useState(false);
  const [useConversation, setUseConversation] = useState(true);
  
  // 從 mutation 狀態獲取載入狀態
  const isLoading = generateTextMutation.isPending;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 自動滾動到最新訊息
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 處理發送訊息
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: inputValue,
      timestamp: new Date()
    };

    const currentInput = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    logger.info('User sent message', { content: currentInput.substring(0, 100) });

    // 準備請求資料
    const chatRequest: ChatRequest = {
      prompt: currentInput,
      useRag,
      useConversation
    };

    try {
      // 使用 React Query mutation 發送請求
      const response = await generateTextMutation.mutateAsync(chatRequest);
      
      if (response.success && response.response) {
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          type: MessageType.ASSISTANT,
          content: response.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        logger.info('AI response received successfully');
      } else {
        // 處理 API 錯誤回應
        const errorMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          type: MessageType.ERROR,
          content: `❌ AI 回應錯誤：${response.error || '未知錯誤'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        
        logger.error('AI response error', { error: response.error });
      }
    } catch (error: any) {
      // 處理請求失敗
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: MessageType.ERROR,
        content: `❌ 請求失敗：${error.message || '網路連接錯誤'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      logger.error('Chat request failed', { error: error.message });
    }
  };

  /**
   * 處理按鍵事件
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 清除聊天記錄
   */
  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      type: MessageType.SYSTEM,
      content: '聊天記錄已清除。',
      timestamp: new Date()
    }]);
    logger.info('Chat history cleared');
  };

  /**
   * 渲染聊天訊息
   */
  const renderMessage = (message: ChatMessageType) => {
    const messageTypeClass = message.type.toLowerCase();
    const messageClass = `${styles.message} ${styles[`message--${messageTypeClass}`]}`;
    
    return (
      <div key={message.id} className={messageClass}>
        <div className={styles.messageContent}>
          <div className={styles.messageText}>{message.content}</div>
          <div className={styles.messageTime}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.chatPage}>
      {/* 聊天標題 */}
      <div className={styles.chatHeader}>
        <h1 className={styles.chatTitle}>
          🤖 AI 聊天助手
        </h1>
        <div className={styles.chatActions}>
          <button
            className={styles.clearButton}
            onClick={clearChat}
            title="清除聊天記錄"
          >
            🗑️ 清除
          </button>
        </div>
      </div>

      {/* 聊天設定面板 */}
      <div className={styles.chatSettings}>
        <div className={styles.settingsGroup}>
          <label className={styles.settingItem}>
            <input
              type="checkbox"
              checked={useRag}
              onChange={(e) => setUseRag(e.target.checked)}
            />
            <span>使用 RAG 檢索增強</span>
          </label>
          <label className={styles.settingItem}>
            <input
              type="checkbox"
              checked={useConversation}
              onChange={(e) => setUseConversation(e.target.checked)}
            />
            <span>對話記憶模式</span>
          </label>
        </div>
      </div>

      {/* 聊天訊息區域 */}
      <div className={styles.chatMessages}>
        {messages.map(renderMessage)}
        {isLoading && (
          <div className={`${styles.message} ${styles['message--assistant']}`}>
            <div className={styles.messageContent}>
              <div className={styles.loadingIndicator}>
                <span>AI 正在思考中</span>
                <div className={styles.loadingDots}>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 */}
      <div className={styles.chatInput}>
        <div className={styles.inputContainer}>
          <textarea
            ref={inputRef}
            className={styles.inputField}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="輸入您的問題..."
            rows={3}
            disabled={isLoading}
          />
          <button
            className={styles.sendButton}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            title="發送訊息 (Enter)"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        <div className={styles.inputHint}>
          按 Enter 發送，Shift + Enter 換行
        </div>
      </div>

      {/* 功能狀態指示器 */}
      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={`${styles.statusDot} ${isConnected ? styles['statusDot--connected'] : styles['statusDot--disconnected']}`}></span>
          <span>{isConnected ? '已連接' : '連接中斷'}</span>
        </div>
        {healthStatus && (
          <div className={styles.statusItem}>
            <span>🤖 {healthStatus.model || 'AI 模型'}</span>
          </div>
        )}
        {useRag && (
          <div className={styles.statusItem}>
            <span>🔍 RAG 已啟用</span>
          </div>
        )}
        {useConversation && (
          <div className={styles.statusItem}>
            <span>🧠 記憶模式</span>
          </div>
        )}
        {healthLoading && (
          <div className={styles.statusItem}>
            <span>⏳ 檢查狀態中</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;