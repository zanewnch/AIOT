/**
 * @fileoverview 無人機位置事件處理器
 * 
 * 專門處理無人機位置相關的 WebSocket 事件：
 * - 位置數據訂閱管理
 * - 位置數據推送邏輯
 * - 位置相關的權限驗證
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/dependency-injection.js';
import { WebSocketService, DRONE_EVENTS, AuthenticatedSocket, DroneSubscriptionRequest } from '../configs/websocket/index.js';
import { WebSocketAuthMiddleware } from '../../../../packages/WebSocketAuthMiddleware.js';
import { DronePositionQueriesSvc } from '../services/queries/DronePositionQueriesSvc.js';
import type { IDroneEventHandler } from '../types/websocket-interfaces.js';

/**
 * 無人機位置事件處理器
 * 
 * 負責處理所有與無人機位置相關的 WebSocket 事件，包括：
 * - 位置數據訂閱/取消訂閱
 * - 實時位置數據推送
 * - 位置存取權限驗證
 */
@injectable()
export class DronePositionEventHandler implements IDroneEventHandler {
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
   * 無人機位置查詢服務
   * @private
   */
  private dronePositionQueriesSvc: DronePositionQueriesSvc;

  /**
   * 位置訂閱計數器
   * @private
   */
  private positionSubscriptionCount = 0;

  /**
   * 建構函式 - 使用依賴注入
   * 
   * @param {WebSocketService} wsService - WebSocket 服務實例
   * @param {WebSocketAuthMiddleware} authMiddleware - 認證中間件實例
   * @param {DronePositionQueriesSvc} dronePositionQueriesSvc - 注入的位置查詢服務實例
   */
  constructor(
    @inject(TYPES.WebSocketService) wsService: WebSocketService, 
    @inject(TYPES.WebSocketAuthMiddleware) authMiddleware: WebSocketAuthMiddleware,
    @inject(TYPES.DronePositionQueriesSvc) dronePositionQueriesSvc: DronePositionQueriesSvc
  ) {
    this.wsService = wsService;
    this.authMiddleware = authMiddleware;
    this.dronePositionQueriesSvc = dronePositionQueriesSvc; // 使用注入的查詢服務實例
  }

  /**
   * 處理無人機位置訂閱
   * 
   * ===== 從 DroneEventHandler 路由過來的第二步 =====
   * 流程：FE emit → DroneEventHandler.setupDroneNamespaceHandlers() → 這裡
   * 作用：處理前端想要訂閱特定無人機位置數據的請求
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {DroneSubscriptionRequest} data - 訂閱請求數據 { droneId: '001' }
   */
  public async handlePositionSubscription(
    socket: AuthenticatedSocket, 
    data: DroneSubscriptionRequest
  ): Promise<void> {
    try {
      // 🔒 第一步：驗證用戶權限
      // → 調用 validateDroneAccess() 檢查此用戶是否有權限訂閱此無人機
      if (!this.validateDroneAccess(socket, data.droneId)) {
        // ❌ 權限不足：直接回傳錯誤給前端
        socket.emit(DRONE_EVENTS.ERROR, {
          error: 'ACCESS_DENIED',
          message: `Access denied for drone: ${data.droneId}`
        });
        return;
      }

      // ✅ 第二步：權限通過，開始訂閱
      // → 調用 wsService.subscribeToDrone() 將此 socket 加入無人機位置房間
      this.wsService.subscribeToDrone(socket.id, data.droneId, 'position');
      this.positionSubscriptionCount++;

      // 📡 第三步：發送當前位置數據給前端
      // 調用查詢服務取得最新位置
      const currentPosition = await this.dronePositionQueriesSvc.getLatestDronePosition(parseInt(data.droneId));
      if (currentPosition) {
        socket.emit('drone_position_update', currentPosition);
      }

      console.log(`📍 Position subscription added:`, {
        socketId: socket.id,
        droneId: data.droneId,
        user: socket.user?.username,
        totalSubscriptions: this.positionSubscriptionCount
      });

    } catch (error) {
      // ❌ 發生錯誤：回傳錯誤訊息給前端
      console.error('Position subscription error:', error);
      socket.emit(DRONE_EVENTS.ERROR, {
        error: 'SUBSCRIPTION_FAILED',
        message: 'Failed to subscribe to drone position'
      });
    }
  }

  /**
   * 處理無人機位置取消訂閱
   * 
   * @param {AuthenticatedSocket} socket - Socket 連線實例
   * @param {DroneSubscriptionRequest} data - 取消訂閱請求數據
   */
  public handlePositionUnsubscription(
    socket: AuthenticatedSocket, 
    data: DroneSubscriptionRequest
  ): void {
    try {
      this.wsService.unsubscribeFromDrone(socket.id, data.droneId, 'position');
      this.positionSubscriptionCount = Math.max(0, this.positionSubscriptionCount - 1);

      console.log(`📍 Position unsubscription:`, {
        socketId: socket.id,
        droneId: data.droneId,
        user: socket.user?.username,
        totalSubscriptions: this.positionSubscriptionCount
      });

    } catch (error) {
      console.error('Position unsubscription error:', error);
    }
  }

  /**
   * 推送位置數據到訂閱的客戶端
   * 
   * @param {string} droneId - 無人機 ID
   * @param {any} positionData - 位置數據
   */
  public broadcastPositionUpdate(droneId: string, positionData: any): void {
    try {
      // 使用 WebSocket 服務廣播位置更新
      this.wsService.broadcastDronePosition(droneId, positionData);

    } catch (error) {
      console.error('Position broadcast error:', error);
    }
  }

  /**
   * 驗證無人機位置存取權限
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

    // 檢查無人機位置存取權限
    return this.authMiddleware.hasPermission(socket, 'drone:read') ||
           this.authMiddleware.hasPermission(socket, `drone:${droneId}:read`) ||
           this.authMiddleware.hasPermission(socket, 'drone:position:read');
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
      await this.handlePositionSubscription(socket, data);
    } else if (data.action === 'unsubscribe') {
      this.handlePositionUnsubscription(socket, data);
    } else {
      socket.emit(DRONE_EVENTS.ERROR, {
        error: 'UNKNOWN_ACTION',
        message: 'Unknown position action type'
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
      handlerType: 'DronePositionEventHandler',
      positionSubscriptions: this.positionSubscriptionCount,
      lastActivity: new Date().toISOString()
    };
  }

  /**
   * 獲取位置訂閱統計 (保持向後兼容)
   * 
   * @returns {object} 位置訂閱統計資訊
   */
  public getPositionSubscriptionStats(): object {
    return {
      positionSubscriptions: this.positionSubscriptionCount
    };
  }
}