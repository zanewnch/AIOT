/**
 * @fileoverview 整合無人機狀態事件處理器
 * 
 * 與新的服務層架構整合的 WebSocket 事件處理器：
 * - 使用 IoC 容器管理依賴注入
 * - 整合 CQRS 模式的服務層
 * - 提供實時狀態更新和廣播
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Socket } from 'socket.io';
import { TYPES } from '@/container';
import type { 
    IDroneRealTimeStatusQueriesSvc,
    IDroneRealTimeStatusCommandsSvc
} from '@/interfaces/services';
import { createLogger } from '@/configs/loggerConfig.js';
import type { IDroneEventHandler } from '@/types/websocket-interfaces.js';

const logger = createLogger('IntegratedDroneStatusEventHandler');

/**
 * 無人機狀態 WebSocket 事件處理器
 * 
 * 整合新的服務層架構，提供：
 * - 實時狀態訂閱/取消訂閱
 * - 狀態變更廣播
 * - 與業務邏輯層的完整整合
 */
@injectable()
export class IntegratedDroneStatusEventHandler implements IDroneEventHandler {
    private statusSubscriptionCount = 0;

    constructor(
        @inject(TYPES.IDroneRealTimeStatusQueriesSvc) 
        private readonly droneStatusQueriesService: IDroneRealTimeStatusQueriesSvc,
        @inject(TYPES.IDroneRealTimeStatusCommandsSvc) 
        private readonly droneStatusCommandsService: IDroneRealTimeStatusCommandsSvc
    ) {}

    /**
     * 處理狀態訂閱請求
     */
    async handleStatusSubscription(socket: Socket, data: { droneId: string }): Promise<void> {
        try {
            logger.info('Processing status subscription', {
                socketId: socket.id,
                droneId: data.droneId
            });

            // 檢查無人機是否存在和在線 - 先轉換為數字 ID
            const droneIdNum = parseInt(data.droneId, 10);
            if (isNaN(droneIdNum)) {
                socket.emit('subscription_error', {
                    error: 'INVALID_DRONE_ID',
                    message: `Invalid drone ID: ${data.droneId}`,
                    droneId: data.droneId
                });
                return;
            }

            const droneStatus = await this.droneStatusQueriesService.getDroneHealthSummary(droneIdNum);
            
            if (!droneStatus) {
                socket.emit('subscription_error', {
                    error: 'DRONE_NOT_FOUND',
                    message: `Drone ${data.droneId} not found`,
                    droneId: data.droneId
                });
                return;
            }

            // 成功訂閱：加入房間
            const roomName = `drone_status_${data.droneId}`;
            await socket.join(roomName);
            this.statusSubscriptionCount++;

            // 發送當前狀態作為初始數據
            socket.emit('drone_status_subscribed', {
                droneId: data.droneId,
                currentStatus: droneStatus,
                timestamp: new Date().toISOString()
            });

            // 發送最新的即時狀態
            const realtimeStatus = await this.droneStatusQueriesService.getRealTimeStatusByDroneId(droneIdNum);
            if (realtimeStatus) {
                socket.emit('drone_status_update', {
                    droneId: data.droneId,
                    status: realtimeStatus,
                    timestamp: new Date().toISOString()
                });
            }

            logger.info('Status subscription successful', {
                socketId: socket.id,
                droneId: data.droneId,
                totalSubscriptions: this.statusSubscriptionCount
            });

        } catch (error) {
            logger.error('Status subscription failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                socketId: socket.id,
                droneId: data.droneId
            });

            socket.emit('subscription_error', {
                error: 'SUBSCRIPTION_FAILED',
                message: 'Failed to subscribe to drone status',
                droneId: data.droneId
            });
        }
    }

    /**
     * 處理狀態取消訂閱
     */
    async handleStatusUnsubscription(socket: Socket, data: { droneId: string }): Promise<void> {
        try {
            const roomName = `drone_status_${data.droneId}`;
            await socket.leave(roomName);
            this.statusSubscriptionCount = Math.max(0, this.statusSubscriptionCount - 1);

            socket.emit('drone_status_unsubscribed', {
                droneId: data.droneId,
                timestamp: new Date().toISOString()
            });

            logger.info('Status unsubscription successful', {
                socketId: socket.id,
                droneId: data.droneId,
                totalSubscriptions: this.statusSubscriptionCount
            });

        } catch (error) {
            logger.error('Status unsubscription failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                socketId: socket.id,
                droneId: data.droneId
            });
        }
    }

    /**
     * 處理狀態更新請求 (來自無人機或系統)
     */
    async handleStatusUpdate(socket: Socket, data: {
        droneId: string;
        statusData: {
            batteryLevel?: number;
            signalStrength?: number;
            isConnected?: boolean;
            lastHeartbeat?: string;
            [key: string]: any;
        }
    }): Promise<void> {
        try {
            logger.info('Processing status update', {
                socketId: socket.id,
                droneId: data.droneId,
                statusData: data.statusData
            });

            // 轉換 droneId 為數字
            const droneIdNum = parseInt(data.droneId, 10);
            if (isNaN(droneIdNum)) {
                socket.emit('status_update_error', {
                    droneId: data.droneId,
                    error: 'INVALID_DRONE_ID',
                    message: 'Invalid drone ID format'
                });
                return;
            }

            // 轉換和映射狀態數據到正確的格式
            const updateData: any = {};
            if (data.statusData.batteryLevel !== undefined) {
                updateData.current_battery_level = data.statusData.batteryLevel;
            }
            if (data.statusData.signalStrength !== undefined) {
                updateData.signal_strength = data.statusData.signalStrength;
            }
            if (data.statusData.isConnected !== undefined) {
                updateData.current_status = data.statusData.isConnected ? 'online' : 'offline';
            }
            if (data.statusData.lastHeartbeat !== undefined) {
                updateData.last_heartbeat = new Date(data.statusData.lastHeartbeat);
            }

            // 使用服務層更新狀態
            const updateResult = await this.droneStatusCommandsService.updateRealTimeStatusByDroneId(
                droneIdNum,
                updateData
            );

            if (updateResult) {
                // 廣播狀態更新到所有訂閱者
                await this.broadcastStatusUpdate(data.droneId, updateResult);

                socket.emit('status_update_confirmed', {
                    droneId: data.droneId,
                    timestamp: new Date().toISOString(),
                    success: true,
                    updatedData: updateResult
                });

                logger.info('Status update successful', {
                    droneId: data.droneId,
                    updatedFields: Object.keys(data.statusData)
                });
            } else {
                socket.emit('status_update_error', {
                    droneId: data.droneId,
                    error: 'UPDATE_FAILED',
                    message: 'Failed to update drone status - drone not found or update failed'
                });
            }

        } catch (error) {
            logger.error('Status update failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                socketId: socket.id,
                droneId: data.droneId
            });

            socket.emit('status_update_error', {
                droneId: data.droneId,
                error: 'UPDATE_FAILED',
                message: 'Internal error during status update'
            });
        }
    }

    /**
     * 廣播狀態更新到房間內所有用戶
     */
    async broadcastStatusUpdate(droneId: string, statusData: any): Promise<void> {
        try {
            const roomName = `drone_status_${droneId}`;
            const io = this.getSocketIOInstance();
            
            if (io) {
                io.to(roomName).emit('drone_status_update', {
                    droneId,
                    status: statusData,
                    timestamp: new Date().toISOString(),
                    broadcast: true
                });

                logger.debug('Status update broadcasted', {
                    droneId,
                    roomName,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            logger.error('Status broadcast failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                droneId
            });
        }
    }

    /**
     * 統一事件處理入口
     */
    async handleEvent(socket: Socket, eventType: string, data: any): Promise<void> {
        try {
            switch (eventType) {
                case 'drone_status_subscribe':
                    await this.handleStatusSubscription(socket, data);
                    break;

                case 'drone_status_unsubscribe':
                    await this.handleStatusUnsubscription(socket, data);
                    break;

                case 'drone_status_update':
                    await this.handleStatusUpdate(socket, data);
                    break;

                case 'get_drone_health_summary':
                    await this.handleHealthSummaryRequest(socket, data);
                    break;

                case 'get_online_drones':
                    await this.handleOnlineDronesRequest(socket);
                    break;

                default:
                    socket.emit('event_error', {
                        error: 'UNKNOWN_EVENT',
                        message: `Unknown event type: ${eventType}`,
                        eventType
                    });
                    break;
            }

        } catch (error) {
            logger.error('Event handling failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                eventType,
                socketId: socket.id
            });

            socket.emit('event_error', {
                error: 'HANDLER_ERROR',
                message: 'Internal error during event processing',
                eventType
            });
        }
    }

    /**
     * 處理健康狀態摘要請求
     */
    private async handleHealthSummaryRequest(socket: Socket, data: { droneId: string }): Promise<void> {
        try {
            const droneIdNum = parseInt(data.droneId, 10);
            if (isNaN(droneIdNum)) {
                socket.emit('health_summary_error', {
                    droneId: data.droneId,
                    error: 'INVALID_DRONE_ID',
                    message: 'Invalid drone ID format'
                });
                return;
            }

            const healthSummary = await this.droneStatusQueriesService.getDroneHealthSummary(droneIdNum);
            
            socket.emit('drone_health_summary', {
                droneId: data.droneId,
                healthSummary,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            socket.emit('health_summary_error', {
                droneId: data.droneId,
                error: 'FETCH_FAILED',
                message: 'Failed to fetch drone health summary'
            });
        }
    }

    /**
     * 處理在線無人機查詢請求
     */
    private async handleOnlineDronesRequest(socket: Socket): Promise<void> {
        try {
            const onlineDrones = await this.droneStatusQueriesService.getOnlineDroneStatuses();
            
            socket.emit('online_drones_list', {
                drones: onlineDrones,
                count: onlineDrones?.length || 0,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            socket.emit('online_drones_error', {
                error: 'FETCH_FAILED',
                message: 'Failed to fetch online drones list'
            });
        }
    }

    /**
     * 獲取處理器統計資訊
     */
    getHandlerStats(): object {
        return {
            handlerType: 'IntegratedDroneStatusEventHandler',
            statusSubscriptions: this.statusSubscriptionCount,
            lastActivity: new Date().toISOString(),
            capabilities: [
                'Status Subscription/Unsubscription',
                'Real-time Status Updates',
                'Health Summary Queries',
                'Online Drones Listing',
                'Status Broadcasting'
            ]
        };
    }

    /**
     * 獲取 Socket.IO 實例 (需要從外部注入或設置)
     */
    private getSocketIOInstance(): any {
        return this.io;
    }

    /**
     * 設置 Socket.IO 實例 (外部調用)
     */
    setSocketIOInstance(io: any): void {
        (this as any).io = io;
    }

    /**
     * 獲取 Socket.IO 實例的 getter
     */
    private get io(): any {
        return (this as any)._io;
    }

    /**
     * 設置 Socket.IO 實例的 setter
     */
    private set io(ioInstance: any) {
        (this as any)._io = ioInstance;
    }
}