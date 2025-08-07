/**
 * @fileoverview 無人機狀態事件處理器
 * 
 * 專門處理無人機狀態相關的 WebSocket 事件：
 * - 狀態數據訂閱管理
 * - 狀態數據推送邏輯
 * - 狀態相關的權限驗證
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/container/dependency-injection.js';
import { WebSocketService, DRONE_EVENTS, AuthenticatedSocket, DroneSubscriptionRequest } from '../configs/websocket/index.js';
import { WebSocketAuthMiddleware } from '../middlewares/WebSocketAuthMiddleware.js';
import { DroneRealTimeStatusQueriesSvc } from '../services/queries/DroneRealTimeStatusQueriesSvc.js';
import { DroneRealTimeStatusCommandsSvc } from '../services/commands/DroneRealTimeStatusCommandsSvc.js';
import type { IDroneEventHandler } from '../types/container/websocket-interfaces.js';

/**
 * 無人機狀態事件處理器
 * 
 * 負責處理所有與無人機狀態相關的 WebSocket 事件，包括：
 * - 狀態數據訂閱/取消訂閱
 * - 實時狀態數據推送
 * - 狀態存取權限驗證
 */
@injectable()
export class DroneStatusEventHandler implements IDroneEventHandler {
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
   * 無人機狀態查詢服務
   * @private
   */
  private droneStatusQueriesService: DroneRealTimeStatusQueriesSvc;

  /**
   * 無人機狀態命令服務
   * @private
   */
  private droneStatusCommandsService: DroneRealTimeStatusCommandsSvc;

  /**
   * 狀態訂閱計數器
   * @private
   */
  private statusSubscriptionCount = 0;

  /**
   * 建構函式 - 使用依賴注入
   * 
   * @param {WebSocketService} wsService - WebSocket 服務實例
   * @param {WebSocketAuthMiddleware} authMiddleware - 認證中間件實例
   * @param {DroneRealTimeStatusQueriesSvc} droneStatusQueriesService - 注入的狀態查詢服務實例
   * @param {DroneRealTimeStatusCommandsSvc} droneStatusCommandsService - 注入的狀態命令服務實例
   */
  constructor(
    @inject(TYPES.WebSocketService) wsService: WebSocketService, 
    @inject(TYPES.WebSocketAuthMiddleware) authMiddleware: WebSocketAuthMiddleware,
    @inject(TYPES.DroneStatusQueriesService) droneStatusQueriesService: DroneRealTimeStatusQueriesSvc,
    @inject(TYPES.DroneStatusCommandsService) droneStatusCommandsService: DroneRealTimeStatusCommandsSvc
  ) {
    this.wsService = wsService;
    this.authMiddleware = authMiddleware;
    this.droneStatusQueriesService = droneStatusQueriesService; // 使用注入的查詢服務實例
    this.droneStatusCommandsService = droneStatusCommandsService; // 使用注入的命令服務實例
  }

  /**
   * 處理無人機狀態訂閱
   * 
   * ===== 從 DroneEventHandler 路由過來的第二步 =====
   * 流程：FE emit 'drone_status_subscribe' → DroneEventHandler → 這裡
   * 作用：處理前端想要訂閱特定無人機狀態數據的請求（電量、信號強度等）
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {DroneSubscriptionRequest} data - 訂閱請求數據 { droneId: '001' }
   */
  public async handleStatusSubscription(
    socket: AuthenticatedSocket, 
    data: DroneSubscriptionRequest
  ): Promise<void> {
    try {
      // 🔒 第一步：驗證用戶權限
      // → 調用 validateDroneAccess() 檢查此用戶是否有權限訂閱此無人機狀態
      if (!this.validateDroneAccess(socket, data.droneId)) {
        // ❌ 權限不足：直接回傳錯誤給前端
        socket.emit(DRONE_EVENTS.ERROR, {
          error: 'ACCESS_DENIED',
          message: `Access denied for drone: ${data.droneId}`
        });
        return;
      }

      // ✅ 第二步：權限通過，開始訂閱
      // → 調用 wsService.subscribeToDrone() 將此 socket 加入無人機狀態房間
      this.wsService.subscribeToDrone(socket.id, data.droneId, 'status');
      this.statusSubscriptionCount++;

      // 📡 第三步：發送當前狀態數據給前端 (暫時跳過實現)
      // TODO: 實現獲取特定無人機最新狀態的方法
      // → 未來會調用 droneStatusService.getLatestStatus(droneId)
      // → 然後 socket.emit('drone_status_update', { battery: 85%, signal: 4/5 })

      console.log(`🔋 Status subscription added:`, {
        socketId: socket.id,
        droneId: data.droneId,
        user: socket.user?.username,
        totalSubscriptions: this.statusSubscriptionCount
      });

    } catch (error) {
      // ❌ 發生錯誤：回傳錯誤訊息給前端
      console.error('Status subscription error:', error);
      socket.emit(DRONE_EVENTS.ERROR, {
        error: 'SUBSCRIPTION_FAILED',
        message: 'Failed to subscribe to drone status'
      });
    }
  }

  /**
   * 處理無人機狀態取消訂閱
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {DroneSubscriptionRequest} data - 取消訂閱請求數據
   */
  public handleStatusUnsubscription(
    socket: AuthenticatedSocket, 
    data: DroneSubscriptionRequest
  ): void {
    try {
      this.wsService.unsubscribeFromDrone(socket.id, data.droneId, 'status');
      this.statusSubscriptionCount = Math.max(0, this.statusSubscriptionCount - 1);

      console.log(`🔋 Status unsubscription:`, {
        socketId: socket.id,
        droneId: data.droneId,
        user: socket.user?.username,
        totalSubscriptions: this.statusSubscriptionCount
      });

    } catch (error) {
      console.error('Status unsubscription error:', error);
    }
  }

  /**
   * 推送狀態數據到訂閱的客戶端
   * 
   * @param {string} droneId - 無人機 ID
   * @param {any} statusData - 狀態數據
   */
  public broadcastStatusUpdate(droneId: string, statusData: any): void {
    try {
      // 使用 WebSocket 服務廣播狀態更新
      this.wsService.broadcastDroneStatus(droneId, statusData);

    } catch (error) {
      console.error('Status broadcast error:', error);
    }
  }

  /**
   * 驗證無人機狀態存取權限
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {string} droneId - 無人機 ID
   * @returns {boolean} 是否有權限
   * @private
   */
  private validateDroneAccess(socket: AuthenticatedSocket, droneId: string): boolean {
    if (!socket.isAuthenticated || !socket.user) {
      return false;
    }

    // 管理員可以存取所有無人機
    if (socket.user.roles.includes('admin')) {
      return true;
    }

    // 檢查無人機狀態存取權限
    return this.authMiddleware.hasPermission(socket, 'drone:read') ||
           this.authMiddleware.hasPermission(socket, `drone:${droneId}:read`) ||
           this.authMiddleware.hasPermission(socket, 'drone:status:read');
  }

  /**
   * 統一的事件處理入口 (實現 DroneEventHandler 接口)
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {any} data - 事件數據
   */
  public async handle(socket: AuthenticatedSocket, data: any): Promise<void> {
    // 根據 data 中的事件類型進行處理
    if (data.action === 'subscribe') {
      await this.handleStatusSubscription(socket, data);
    } else if (data.action === 'unsubscribe') {
      this.handleStatusUnsubscription(socket, data);
    } else {
      socket.emit(DRONE_EVENTS.ERROR, {
        error: 'UNKNOWN_ACTION',
        message: 'Unknown status action type'
      });
    }
  }

  /**
   * 獲取處理器統計信息 (實現 DroneEventHandler 接口)
   * 
   * @returns {object} 處理器統計資訊
   */
  public getHandlerStats(): object {
    return {
      handlerType: 'DroneStatusEventHandler',
      statusSubscriptions: this.statusSubscriptionCount,
      lastActivity: new Date().toISOString()
    };
  }

  /**
   * 獲取狀態訂閱統計 (保持向後兼容)
   * 
   * @returns {object} 狀態訂閱統計資訊
   */
  public getStatusSubscriptionStats(): object {
    return {
      statusSubscriptions: this.statusSubscriptionCount
    };
  }
}