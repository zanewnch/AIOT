/**
 * @fileoverview 無人機指令佇列命令 Service 實現
 *
 * 此文件實作了無人機指令佇列命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneCommandQueueCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import type {
    DroneCommandQueueAttributes,
    DroneCommandQueueCreationAttributes
} from '../../types/services/IDroneCommandQueueService.js';
import { DroneCommandQueueStatus } from '../../models/DroneCommandQueueModel.js';
import { DroneCommandQueueQueriesSvc } from '../queries/DroneCommandQueueQueriesSvc.js';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneCommandQueueCommandsSvc');

/**
 * 指令佇列執行結果介面
 */
export interface QueueExecutionResult {
    success: boolean;
    queue: DroneCommandQueueAttributes;
    message: string;
    error?: string;
}

/**
 * 無人機指令佇列命令 Service 實現類別
 *
 * 專門處理無人機指令佇列相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneCommandQueueCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueueCommandsSvc {
    private queryService: DroneCommandQueueQueriesSvc;
    private static idCounter = 3; // 模擬 ID 計數器，從 3 開始因為查詢服務有 1,2

    constructor() {
        this.queryService = new DroneCommandQueueQueriesSvc();
        // TODO: 注入 Repository 依賴當 Repository 創建後
    }

    /**
     * 創建新的無人機指令佇列
     */
    createDroneCommandQueue = async (data: DroneCommandQueueCreationAttributes): Promise<DroneCommandQueueAttributes> => {
        try {
            logger.info('Creating new drone command queue', { data });

            // 驗證必要欄位
            if (!data.name || typeof data.name !== 'string') {
                throw new Error('佇列名稱為必填項且必須是字串');
            }

            if (typeof data.auto_execute !== 'boolean') {
                throw new Error('自動執行設定為必填項');
            }

            // 驗證狀態是否有效
            const validStatuses = ['pending', 'running', 'paused', 'completed', 'failed'];
            if (data.status && !validStatuses.includes(data.status)) {
                throw new Error('無效的狀態');
            }

            // TODO: 實作資料庫插入邏輯
            // 暫時創建模擬資料
            const newQueue: DroneCommandQueueAttributes = {
                id: DroneCommandQueueCommandsSvc.idCounter++,
                name: data.name,
                status: data.status || DroneCommandQueueStatus.PENDING,
                drone_id: data.drone_id,
                priority: data.priority || 5,
                command_type: data.command_type || 'default',
                current_index: data.current_index || 0,
                auto_execute: data.auto_execute,
                execution_conditions: data.execution_conditions || null,
                loop_count: data.loop_count || null,
                max_loops: data.max_loops || null,
                created_by: data.created_by,
                started_at: data.started_at || null,
                completed_at: data.completed_at || null,
                error_message: data.error_message || null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            logger.info('Command queue created successfully', { id: newQueue.id });
            return newQueue;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新無人機指令佇列資料
     */
    updateDroneCommandQueue = async (id: number, data: Partial<DroneCommandQueueCreationAttributes>): Promise<DroneCommandQueueAttributes | null> => {
        try {
            logger.info('Updating drone command queue', { id, data });

            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查佇列是否存在
            const existingQueue = await this.queryService.getDroneCommandQueueById(id);
            if (!existingQueue) {
                logger.warn('Command queue not found for update', { id });
                return null;
            }

            // 驗證狀態變更是否有效
            if (data.status) {
                const validStatuses = ['pending', 'running', 'paused', 'completed', 'failed'];
                if (!validStatuses.includes(data.status)) {
                    throw new Error('無效的佇列狀態');
                }
            }

            // TODO: 實作資料庫更新邏輯
            // 暫時創建更新後的模擬資料
            const updatedQueue: DroneCommandQueueAttributes = {
                ...existingQueue,
                ...data,
                updatedAt: new Date()
            };

            logger.info('Command queue updated successfully', { id });
            return updatedQueue;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除無人機指令佇列資料
     */
    deleteDroneCommandQueue = async (id: number): Promise<number> => {
        try {
            logger.info('Deleting drone command queue', { id });

            if (!id || id <= 0) {
                throw new Error('ID 必須是正整數');
            }

            // 檢查佇列是否存在
            const existingQueue = await this.queryService.getDroneCommandQueueById(id);
            if (!existingQueue) {
                logger.warn('Command queue not found for deletion', { id });
                return 0;
            }

            // 檢查佇列狀態，運行中的佇列不能刪除
            if (existingQueue.status === DroneCommandQueueStatus.RUNNING) {
                throw new Error('運行中的指令佇列無法刪除');
            }

            // TODO: 實作資料庫刪除邏輯
            logger.info('Command queue deleted successfully', { id });
            return 1; // 返回刪除的筆數
        } catch (error) {
            throw error;
        }
    }

    /**
     * 將指令加入佇列
     */
    enqueueDroneCommand = async (droneId: number, commandType: string, commandData?: any, priority?: number): Promise<DroneCommandQueueAttributes> => {
        try {
            logger.info('Enqueueing drone command', { droneId, commandType, commandData, priority });

            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            if (!commandType || typeof commandType !== 'string') {
                throw new Error('指令類型為必填項');
            }

            // 創建佇列項目
            const queueData: DroneCommandQueueCreationAttributes = {
                name: `Command-${commandType}-${Date.now()}`,
                status: DroneCommandQueueStatus.PENDING,
                drone_id: droneId,
                priority: priority || 5,
                command_type: commandType,
                current_index: 0,
                auto_execute: true,
                execution_conditions: null,
                loop_count: null,
                max_loops: null,
                created_by: 1, // TODO: 從當前用戶會話獲取
                started_at: null,
                completed_at: null,
                error_message: null
            };

            return await this.createDroneCommandQueue(queueData);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 從佇列中取出指令
     */
    dequeueDroneCommand = async (droneId: number): Promise<DroneCommandQueueAttributes | null> => {
        try {
            logger.info('Dequeuing drone command', { droneId });

            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            // 取得下一個待執行的指令
            const nextCommand = await this.queryService.getNextDroneCommand(droneId);
            if (!nextCommand) {
                logger.info('No pending commands found for dequeue', { droneId });
                return null;
            }

            // 將狀態更新為執行中
            const updatedQueue = await this.updateDroneCommandQueue(nextCommand.id, {
                status: DroneCommandQueueStatus.RUNNING
            });

            logger.info('Command dequeued successfully', { droneId, commandId: nextCommand.id });
            return updatedQueue;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 清空指令佇列
     */
    clearDroneCommandQueue = async (droneId: number): Promise<number> => {
        try {
            logger.info('Clearing drone command queue', { droneId });

            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            // 取得該無人機的所有佇列項目
            const droneQueues = await this.queryService.getDroneCommandQueueByDroneId(droneId);
            
            // 過濾出可以刪除的項目（非運行中狀態）
            const deletableQueues = droneQueues.filter(queue => queue.status !== DroneCommandQueueStatus.RUNNING);
            
            let deletedCount = 0;
            for (const queue of deletableQueues) {
                const result = await this.deleteDroneCommandQueue(queue.id);
                deletedCount += result;
            }

            logger.info('Command queue cleared', { droneId, deletedCount, totalQueues: droneQueues.length });
            return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新佇列狀態
     */
    updateDroneCommandQueueStatus = async (id: number, status: DroneCommandQueueStatus): Promise<DroneCommandQueueAttributes | null> => {
        try {
            logger.info('Updating drone command queue status', { id, status });

            return await this.updateDroneCommandQueue(id, { status });
        } catch (error) {
            throw error;
        }
    }

    /**
     * 執行指令佇列
     */
    executeQueue = async (id: number): Promise<QueueExecutionResult> => {
        try {
            logger.info('Executing queue', { id });

            const queue = await this.queryService.getDroneCommandQueueById(id);
            if (!queue) {
                return {
                    success: false,
                    queue: {} as DroneCommandQueueAttributes,
                    message: '佇列不存在',
                    error: '找不到指定的指令佇列'
                };
            }

            if (queue.status !== DroneCommandQueueStatus.PENDING) {
                return {
                    success: false,
                    queue,
                    message: '佇列執行失敗',
                    error: '只有待執行狀態的佇列可以執行'
                };
            }

            // 更新狀態為執行中
            const updatedQueue = await this.updateDroneCommandQueue(id, { status: DroneCommandQueueStatus.RUNNING });
            
            if (!updatedQueue) {
                return {
                    success: false,
                    queue,
                    message: '佇列執行失敗',
                    error: '無法更新佇列狀態'
                };
            }

            return {
                success: true,
                queue: updatedQueue,
                message: '佇列開始執行'
            };
        } catch (error) {
            return {
                success: false,
                queue: {} as DroneCommandQueueAttributes,
                message: '佇列執行失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 暫停指令佇列
     */
    pauseQueue = async (id: number): Promise<QueueExecutionResult> => {
        try {
            logger.info('Pausing queue', { id });

            const queue = await this.queryService.getDroneCommandQueueById(id);
            if (!queue) {
                return {
                    success: false,
                    queue: {} as DroneCommandQueueAttributes,
                    message: '佇列不存在',
                    error: '找不到指定的指令佇列'
                };
            }

            if (queue.status !== DroneCommandQueueStatus.RUNNING) {
                return {
                    success: false,
                    queue,
                    message: '佇列暫停失敗',
                    error: '只有執行中的佇列可以暫停'
                };
            }

            const updatedQueue = await this.updateDroneCommandQueue(id, { status: DroneCommandQueueStatus.PAUSED });
            
            if (!updatedQueue) {
                return {
                    success: false,
                    queue,
                    message: '佇列暫停失敗',
                    error: '無法更新佇列狀態'
                };
            }

            return {
                success: true,
                queue: updatedQueue,
                message: '佇列已暫停'
            };
        } catch (error) {
            return {
                success: false,
                queue: {} as DroneCommandQueueAttributes,
                message: '佇列暫停失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }

    /**
     * 完成指令佇列
     */
    completeQueue = async (id: number): Promise<QueueExecutionResult> => {
        try {
            logger.info('Completing queue', { id });

            const updatedQueue = await this.updateDroneCommandQueue(id, { status: DroneCommandQueueStatus.COMPLETED });
            
            if (!updatedQueue) {
                return {
                    success: false,
                    queue: {} as DroneCommandQueueAttributes,
                    message: '佇列完成失敗',
                    error: '無法更新佇列狀態'
                };
            }

            return {
                success: true,
                queue: updatedQueue,
                message: '佇列執行完成'
            };
        } catch (error) {
            return {
                success: false,
                queue: {} as DroneCommandQueueAttributes,
                message: '佇列完成失敗',
                error: error instanceof Error ? error.message : '未知錯誤'
            };
        }
    }
}