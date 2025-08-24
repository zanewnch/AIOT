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
import { useLLMHealthStatus, useGenerateText, useTestConnection, useMCPQuery, useMCPStatus } from '../hooks/useChatQuery';
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
  const mcpQueryMutation = useMCPQuery();
  const { data: mcpStatus } = useMCPStatus();


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
  const [useMCP, setUseMCP] = useState(false);  // 新增 MCP 模式
  const [useWebSocket, setUseWebSocket] = useState(true);  // WebSocket 模式
  
  // WebSocket 狀態管理
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  
  // 從 mutation 狀態獲取載入狀態
  const isLoading = generateTextMutation.isPending || mcpQueryMutation.isPending;

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
   * WebSocket 連接管理
   */
  const connectWebSocket = () => {
    if (ws || wsConnecting) return;
    
    setWsConnecting(true);
    logger.info('Connecting to WebSocket...');
    
    // 連接到 Gateway WebSocket
    const wsUrl = 'ws://localhost:8000/ws?user_id=frontend_user';
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      setWsConnected(true);
      setWsConnecting(false);
      setWs(websocket);
      logger.info('✅ WebSocket connected to Gateway');
      
      // 添加連接成功的系統消息
      const systemMessage: ChatMessageType = {
        id: Date.now().toString(),
        type: MessageType.SYSTEM,
        content: '🔗 WebSocket 即時連接已建立！現在支援串流對話。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
    };
    
    websocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        handleWebSocketResponse(response);
      } catch (error) {
        logger.error('WebSocket message parse error:', error);
      }
    };
    
    websocket.onclose = (event) => {
      setWsConnected(false);
      setWsConnecting(false);
      setWs(null);
      logger.info(`WebSocket disconnected (code: ${event.code})`);
      
      // 添加斷線系統消息
      if (useWebSocket) {
        const systemMessage: ChatMessageType = {
          id: Date.now().toString(),
          type: MessageType.SYSTEM,
          content: '❌ WebSocket 連接已斷開，將使用 HTTP 模式。',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    };
    
    websocket.onerror = (error) => {
      setWsConnecting(false);
      logger.error('WebSocket error:', error);
      
      // 添加錯誤系統消息
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        type: MessageType.ERROR,
        content: '❌ WebSocket 連接失敗，請檢查網路連接或使用 HTTP 模式。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    };
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setWsConnected(false);
      logger.info('WebSocket manually disconnected');
    }
  };

  /**
   * 處理 WebSocket 回應
   */
  const handleWebSocketResponse = (response: any) => {
    logger.info('WebSocket response received:', { type: response.type, success: response.success });
    
    switch (response.type) {
      case 'response':
      case 'mcp_response':
        if (response.success && response.data?.response) {
          const assistantMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: MessageType.ASSISTANT,
            content: response.data.response,
            timestamp: new Date(),
            sources: response.data.tool_used ? [`🔧 使用工具: ${response.data.tool_used}`] : undefined
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: MessageType.ERROR,
            content: `❌ ${response.error || '處理失敗'}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;
        
      case 'stream_start':
        // 開始串流，創建一個佔位消息
        const streamMessage: ChatMessageType = {
          id: `stream_${response.message_id}`,
          type: MessageType.ASSISTANT,
          content: '正在生成回應...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, streamMessage]);
        break;
        
      case 'stream_chunk':
        // 更新串流消息內容
        if (response.data?.full_response) {
          setMessages(prev => prev.map(msg => 
            msg.id === `stream_${response.message_id}` 
              ? { ...msg, content: response.data.full_response }
              : msg
          ));
        }
        break;
        
      case 'stream_end':
        // 串流結束，確保最終內容正確
        if (response.data?.full_response) {
          setMessages(prev => prev.map(msg => 
            msg.id === `stream_${response.message_id}` 
              ? { ...msg, content: response.data.full_response }
              : msg
          ));
        }
        break;
        
      case 'status':
        // 系統狀態消息
        if (response.message) {
          const statusMessage: ChatMessageType = {
            id: Date.now().toString(),
            type: MessageType.SYSTEM,
            content: `ℹ️ ${response.message}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, statusMessage]);
        }
        break;
        
      case 'error':
        const errorMessage: ChatMessageType = {
          id: Date.now().toString(),
          type: MessageType.ERROR,
          content: `❌ ${response.error || '未知錯誤'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        break;
    }
  };

  // WebSocket 自動連接
  useEffect(() => {
    if (useWebSocket && !ws && !wsConnecting) {
      connectWebSocket();
    } else if (!useWebSocket && ws) {
      disconnectWebSocket();
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [useWebSocket]);

  /**
   * 處理發送訊息
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || (isLoading && !useWebSocket)) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: inputValue,
      timestamp: new Date()
    };

    const currentInput = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    logger.info('User sent message', { 
      content: currentInput.substring(0, 100), 
      useMCP, 
      useWebSocket, 
      wsConnected 
    });

    // 如果使用 WebSocket 且已連接，則透過 WebSocket 發送
    if (useWebSocket && wsConnected && ws) {
      try {
        const messageData = {
          type: useMCP && mcpStatus?.mcp_enabled ? 'mcp_query' : 'conversational',
          data: useMCP && mcpStatus?.mcp_enabled 
            ? {
                query: currentInput,
                use_conversation: useConversation
              }
            : {
                prompt: currentInput,
                use_rag: useRag
              },
          message_id: `msg_${Date.now()}`,
          user_id: 'frontend_user',
          conversation_id: 'frontend_conversation'
        };

        ws.send(JSON.stringify(messageData));
        logger.info('Message sent via WebSocket', { type: messageData.type });
        
        return; // WebSocket 發送完成，不執行 HTTP 請求
      } catch (error: any) {
        logger.error('WebSocket send error:', error);
        
        // WebSocket 發送失敗，顯示錯誤並回到 HTTP 模式
        const errorMessage: ChatMessageType = {
          id: Date.now().toString(),
          type: MessageType.ERROR,
          content: '❌ WebSocket 發送失敗，嘗試使用 HTTP 模式...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        
        // 自動切換到 HTTP 模式
        setUseWebSocket(false);
      }
    }

    // HTTP 模式或 WebSocket 失敗時的處理
    try {
      let response: any;
      
      if (useMCP && mcpStatus?.mcp_enabled) {
        // 使用 MCP 自然語言查詢
        logger.info('Using MCP natural language query mode (HTTP)');
        response = await mcpQueryMutation.mutateAsync({
          query: currentInput,
          use_conversation: useConversation
        });
      } else {
        // 使用傳統 LLM 生成
        logger.info('Using traditional LLM generation mode (HTTP)');
        const chatRequest: ChatRequest = {
          prompt: currentInput,
          useRag,
          useConversation
        };
        response = await generateTextMutation.mutateAsync(chatRequest);
      }
      
      if (response.success && response.response) {
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          type: MessageType.ASSISTANT,
          content: response.response,
          timestamp: new Date(),
          // 如果是 MCP 模式，顯示使用的工具
          ...(useMCP && response.tool_used && {
            sources: [`🔧 使用工具: ${response.tool_used}`]
          })
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        logger.info('Response received successfully (HTTP)', { 
          mode: useMCP ? 'MCP' : 'LLM',
          tool_used: response.tool_used 
        });
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
              checked={useWebSocket}
              onChange={(e) => setUseWebSocket(e.target.checked)}
            />
            <span>⚡ WebSocket 即時模式</span>
            {wsConnected && <small style={{ color: '#28a745', marginLeft: '8px' }}>(已連接)</small>}
            {wsConnecting && <small style={{ color: '#ffc107', marginLeft: '8px' }}>(連接中...)</small>}
            {useWebSocket && !wsConnected && !wsConnecting && (
              <small style={{ color: '#dc3545', marginLeft: '8px' }}>(斷線)</small>
            )}
          </label>
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
          <label className={styles.settingItem}>
            <input
              type="checkbox"
              checked={useMCP}
              onChange={(e) => setUseMCP(e.target.checked)}
              disabled={!mcpStatus?.mcp_enabled}
            />
            <span>🛠️ MCP 數據庫操作模式</span>
            {!mcpStatus?.mcp_enabled && (
              <small style={{ color: '#999', marginLeft: '8px' }}>(未啟用)</small>
            )}
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
          {useMCP && mcpStatus?.mcp_enabled && (
            <div style={{ color: '#007bff', fontSize: '12px', marginTop: '4px' }}>
              💡 MCP 模式：您可以用自然語言操作資料庫，例如「給我看用戶 admin 的偏好設定」
            </div>
          )}
        </div>
      </div>

      {/* 功能狀態指示器 */}
      <div className={styles.statusBar}>
        {/* WebSocket 連接狀態 */}
        <div className={styles.statusItem}>
          <span className={`${styles.statusDot} ${
            useWebSocket 
              ? (wsConnected ? styles['statusDot--connected'] : styles['statusDot--disconnected'])
              : styles['statusDot--neutral']
          }`}></span>
          <span>
            {useWebSocket 
              ? (wsConnected ? '⚡ WebSocket' : (wsConnecting ? '🔄 連接中' : '❌ WebSocket 斷線'))
              : '📡 HTTP 模式'
            }
          </span>
        </div>
        
        {/* HTTP 連接狀態 */}
        {!useWebSocket && (
          <div className={styles.statusItem}>
            <span className={`${styles.statusDot} ${isConnected ? styles['statusDot--connected'] : styles['statusDot--disconnected']}`}></span>
            <span>{isConnected ? 'HTTP 已連接' : 'HTTP 連接中斷'}</span>
          </div>
        )}
        
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
        {useMCP && mcpStatus?.mcp_enabled && (
          <div className={styles.statusItem}>
            <span>🛠️ MCP 模式 ({mcpStatus.total_tools} 工具)</span>
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