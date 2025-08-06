/**
 * @fileoverview 無人機命令事件處理器
 * 
 * 專門處理無人機命令相關的 WebSocket 事件：
 * - 命令發送和執行
 * - 命令回應處理
 * - 命令相關的權限驗證
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { WebSocketService, DRONE_EVENTS, AuthenticatedSocket, DroneCommandRequest } from '../configs/websocket/index.js';
import { WebSocketAuthMiddleware } from '../middlewares/WebSocketAuthMiddleware.js';
import { DroneCommandService } from '../services/drone/DroneCommandService.js';
import { DroneEventHandler } from './interfaces/EventHandlerFactory.js';

/**
 * 無人機命令事件處理器
 * 
 * 負責處理所有與無人機命令相關的 WebSocket 事件，包括：
 * - 命令發送和執行
 * - 命令結果回應
 * - 命令執行權限驗證
 */
export class DroneCommandEventHandler implements DroneEventHandler {
  /**
   * WebSocket 服務實例
   * @private
   */
  private wsService: WebSocketService;

  /**
   * 認證中間件實例
   * @private
   */
  private authMiddleware: WebSocketAuthMiddleware;

  /**
   * 無人機命令服務
   * @private
   */
  private droneCommandService: DroneCommandService;

  /**
   * 命令執行計數器
   * @private
   */
  private commandExecutionCount = 0;

  /**
   * 建構函式
   * 
   * @param {WebSocketService} wsService - WebSocket 服務實例
   * @param {WebSocketAuthMiddleware} authMiddleware - 認證中間件實例
   */
  constructor(wsService: WebSocketService, authMiddleware: WebSocketAuthMiddleware) {
    this.wsService = wsService;
    this.authMiddleware = authMiddleware;
    this.droneCommandService = new DroneCommandService();
  }

  /**
   * 處理無人機命令發送
   * 
   * ===== 從 DroneEventHandler 路由過來的第二步 =====
   * 流程：FE emit 'drone_command_send' → DroneEventHandler → 這裡
   * 作用：處理前端發送的無人機控制命令（起飛、降落、移動等）
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {DroneCommandRequest} data - 命令數據 { droneId: '001', command: 'takeoff', parameters?: {...} }
   */
  public async handleCommandSend(
    socket: AuthenticatedSocket, 
    data: DroneCommandRequest
  ): Promise<void> {
    try {
      // 🔒 第一步：驗證命令權限（比訂閱權限更嚴格）
      // → 調用 validateDroneCommandAccess() 檢查此用戶是否有權限控制此無人機
      if (!this.validateDroneCommandAccess(socket, data.droneId)) {
        // ❌ 權限不足：直接回傳錯誤給前端
        socket.emit(DRONE_EVENTS.ERROR, {
          error: 'COMMAND_ACCESS_DENIED',
          message: `Command access denied for drone: ${data.droneId}`
        });
        return;
      }

      // ✅ 第二步：驗證命令格式
      // → 調用 validateCommandFormat() 檢查命令格式是否正確
      if (!this.validateCommandFormat(data)) {
        // ❌ 格式錯誤：直接回傳錯誤給前端
        socket.emit(DRONE_EVENTS.ERROR, {
          error: 'INVALID_COMMAND_FORMAT',
          message: 'Invalid command format or missing required parameters'
        });
        return;
      }

      // 🚁 第三步：執行無人機命令
      // → 調用 executeCommand() 處理實際的命令執行邏輯
      const commandResult = await this.executeCommand(data);
      this.commandExecutionCount++;

      // 📤 第四步：發送命令執行結果回前端
      // → 調用 wsService.sendCommandResponse() 回傳結果給發送命令的前端
      this.wsService.sendCommandResponse(socket.id, {
        commandId: commandResult.commandId,
        droneId: data.droneId,
        success: commandResult.success,
        message: commandResult.message,
        timestamp: new Date().toISOString()
      });

      console.log(`🎮 Command executed:`, {
        socketId: socket.id,
        droneId: data.droneId,
        command: data.command,
        user: socket.user?.username,
        success: commandResult.success,
        totalCommands: this.commandExecutionCount
      });

    } catch (error) {
      // ❌ 發生錯誤：回傳錯誤訊息給前端
      console.error('Command execution error:', error);
      socket.emit(DRONE_EVENTS.ERROR, {
        error: 'COMMAND_EXECUTION_FAILED',
        message: 'Failed to execute drone command'
      });
    }
  }

  /**
   * 執行無人機命令
   * 
   * ===== 從 handleCommandSend 呼叫的第三步 =====
   * 流程：FE emit → DroneEventHandler → handleCommandSend() → 這裡
   * 作用：根據命令類型執行對應的無人機控制邏輯
   * 
   * @param {DroneCommandRequest} commandRequest - 命令請求
   * @returns {Promise<any>} 命令執行結果
   * @private
   */
  private async executeCommand(commandRequest: DroneCommandRequest): Promise<any> {
    // 📝 第一步：生成唯一命令 ID 用於追蹤
    // → 格式：cmd_時間戳_隨機字串
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // 🤖 第二步：根據命令類型處理不同的無人機操作
    // TODO: 實際的命令執行邏輯會調用 droneCommandService.executeCommand()
    // → 未來會整合真實的無人機 API 或硬體控制邏輯
    switch (commandRequest.command.toLowerCase()) {
      case 'takeoff':
        // 🛫 起飛命令：啟動無人機馬達並起飛到預設高度
        return {
          commandId,
          success: true,
          message: 'Takeoff command queued for execution'
        };
      
      case 'land':
        // 🛬 降落命令：讓無人機安全降落到地面
        return {
          commandId,
          success: true,
          message: 'Land command queued for execution'
        };
      
      case 'move':
        // 🎯 移動命令：根據參數移動無人機到指定位置
        // → 參數通常包含：{ x: 10, y: 20, z: 30, speed: 5 }
        return {
          commandId,
          success: true,
          message: 'Move command queued for execution'
        };
      
      default:
        // ❌ 未知命令：回傳失敗狀態
        return {
          commandId,
          success: false,
          message: 'Unknown command type'
        };
    }
  }

  /**
   * 驗證命令格式
   * 
   * @param {DroneCommandRequest} data - 命令數據
   * @returns {boolean} 格式是否正確
   * @private
   */
  private validateCommandFormat(data: DroneCommandRequest): boolean {
    if (!data.droneId || !data.command) {
      return false;
    }

    // 驗證無人機 ID 格式
    if (typeof data.droneId !== 'string' || data.droneId.trim().length === 0) {
      return false;
    }

    // 驗證命令格式
    if (typeof data.command !== 'string' || data.command.trim().length === 0) {
      return false;
    }

    // 驗證優先級格式（如果提供）
    if (data.priority && !['low', 'normal', 'high', 'urgent'].includes(data.priority)) {
      return false;
    }

    return true;
  }

  /**
   * 廣播命令執行狀態更新
   * 
   * @param {string} droneId - 無人機 ID
   * @param {any} commandUpdate - 命令狀態更新數據
   */
  public broadcastCommandUpdate(droneId: string, commandUpdate: any): void {
    try {
      // 廣播命令狀態更新給所有訂閱該無人機的客戶端
      // 注意：命令狀態更新通常是透過特定房間廣播
      const namespace = this.wsService.getIO().of('/drone');
      namespace.emit(DRONE_EVENTS.DRONE_COMMAND_STATUS, {
        droneId,
        data: commandUpdate,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Command update broadcast error:', error);
    }
  }

  /**
   * 驗證無人機命令權限
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} droneId - 無人機 ID
   * @returns {boolean} 是否有權限
   * @private
   */
  private validateDroneCommandAccess(socket: AuthenticatedSocket, droneId: string): boolean {
    if (!socket.isAuthenticated || !socket.user) {
      return false;
    }

    // 管理員可以控制所有無人機
    if (socket.user.roles.includes('admin')) {
      return true;
    }

    // 檢查無人機控制權限
    return this.authMiddleware.hasPermission(socket, 'drone:control') ||
           this.authMiddleware.hasPermission(socket, `drone:${droneId}:control`) ||
           this.authMiddleware.hasPermission(socket, 'drone:command:send');
  }

  /**
   * 統一的事件處理入口 (實現 DroneEventHandler 接口)
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {any} data - 事件數據
   */
  public async handle(socket: AuthenticatedSocket, data: any): Promise<void> {
    // 命令處理器直接處理命令發送
    await this.handleCommandSend(socket, data);
  }

  /**
   * 獲取處理器統計信息 (實現 DroneEventHandler 接口)
   * 
   * @returns {object} 處理器統計資訊
   */
  public getHandlerStats(): object {
    return {
      handlerType: 'DroneCommandEventHandler',
      commandExecutions: this.commandExecutionCount,
      lastActivity: new Date().toISOString()
    };
  }

  /**
   * 獲取命令執行統計 (保持向後兼容)
   * 
   * @returns {object} 命令執行統計資訊
   */
  public getCommandExecutionStats(): object {
    return {
      commandExecutions: this.commandExecutionCount
    };
  }
}