/**
 * @fileoverview 無人機位置命令 Service 實現
 *
 * 此文件實作了無人機位置命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DronePositionCommandsService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { DronePositionCommandsRepo } from '../../repo/commands/DronePositionCommandsRepo.js';
import { DronePositionQueriesRepo } from '../../repo/queries/DronePositionQueriesRepo.js';
import type { DronePositionAttributes, DronePositionCreationAttributes } from '../../models/DronePositionModel.js';
import type { IDronePositionRepository } from '../../types/repo/IDronePositionRepo.js';
import { DronePositionQueriesSvc } from '../queries/DronePositionQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DronePositionCommandsService');

/**
 * 無人機位置命令 Service 實現類別
 *
 * 專門處理無人機位置相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DronePositionCommandsService
 * @since 1.0.0
 */
@injectable()
export class DronePositionCommandsSvc {
    private dronePositionRepository: IDronePositionRepository; // 組合介面

    constructor(
        @inject(TYPES.DronePositionCommandsRepositorysitory) 
        private readonly commandsRepository: DronePositionCommandsRepositorysitory,
        
        @inject(TYPES.DronePositionQueriesRepo) 
        private readonly queriesRepository: DronePositionQueriesRepository,
        
        @inject(TYPES.DronePositionQueriesService) 
        private readonly queryService: DronePositionQueriesService
    ) {
        // 創建組合repository
        this.dronePositionRepository = Object.assign(
            Object.create(Object.getPrototypeOf(this.commandsRepository)),
            this.commandsRepository,
            this.queriesRepository
        ) as IDronePositionRepository;
    }

    /**
     * 建立新的無人機位置資料
     *
     * @param {DronePositionCreationAttributes} data - 無人機位置建立資料
     * @returns {Promise<DronePositionAttributes>} 建立的無人機位置資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    createDronePosition = async (data: DronePositionCreationAttributes): Promise<DronePositionAttributes> => {
        try {
            // 驗證必要欄位
            this.validateDronePositionData(data);

            logger.info('Creating new drone position data', { data });
            const dronePosition = await this.dronePositionRepositorysitory.create(data);

            logger.info('Successfully created drone position data', { id: dronePosition.id });
            return dronePosition;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @param {Partial<DronePositionCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionAttributes>} 更新後的無人機位置資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    updateDronePosition = async (id: number, data: Partial<DronePositionCreationAttributes>): Promise<DronePositionAttributes> => {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機位置資料 ID');
            }

            // 檢查記錄是否存在
            const existsCheck = await this.queryService.isDronePositionExists(id);
            if (!existsCheck) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            // 驗證更新資料
            if (data.latitude !== undefined || data.longitude !== undefined) {
                this.queryService.validateCoordinates(data.latitude, data.longitude);
            }

            // 驗證其他數值欄位
            this.validateNumericFields(data);

            logger.info('Updating drone position data', { id, data });
            const updatedDronePosition = await this.dronePositionRepositorysitory.update(id, data);

            if (!updatedDronePosition) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            logger.info('Successfully updated drone position data', { id });
            return updatedDronePosition;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    deleteDronePosition = async (id: number): Promise<void> => {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機位置資料 ID');
            }

            // 檢查記錄是否存在
            const existsCheck = await this.queryService.isDronePositionExists(id);
            if (!existsCheck) {
                throw new Error(`找不到 ID 為 ${id} 的無人機位置資料`);
            }

            logger.info('Deleting drone position data', { id });
            await this.dronePositionRepositorysitory.delete(id);
            
            logger.info('Successfully deleted drone position data', { id });

            logger.info('Successfully deleted drone position data', { id });
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量創建無人機位置
     *
     * @param {DronePositionCreationAttributes[]} positions - 位置資料陣列
     * @returns {Promise<DronePositionAttributes[]>} 創建的位置資料陣列
     * @throws {Error} 當批量創建失敗時
     */
    createDronePositionsBatch = async (positions: DronePositionCreationAttributes[]): Promise<DronePositionAttributes[]> => {
        try {
            if (!positions || positions.length === 0) {
                throw new Error('位置資料陣列不能為空');
            }

            if (positions.length > 100) {
                throw new Error('一次最多只能創建 100 筆位置資料');
            }

            // 驗證所有位置資料
            for (let i = 0; i < positions.length; i++) {
                try {
                    this.validateDronePositionData(positions[i]);
                } catch (error) {
                    throw new Error(`第 ${i + 1} 筆資料驗證失敗: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            logger.info('Creating batch drone positions', { count: positions.length });
            
            const results: DronePositionAttributes[] = [];
            for (const position of positions) {
                const result = await this.dronePositionRepositorysitory.create(position);
                results.push(result);
            }

            logger.info('Batch drone positions created successfully', { count: results.length });
            return results;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量刪除無人機位置資料
     *
     * @param {number[]} ids - 位置資料 ID 陣列
     * @returns {Promise<number>} 成功刪除的筆數
     * @throws {Error} 當批量刪除失敗時
     */
    deleteDronePositionsBatch = async (ids: number[]): Promise<number> => {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('位置資料 ID 陣列不能為空');
            }

            if (ids.length > 100) {
                throw new Error('一次最多只能刪除 100 筆位置資料');
            }

            logger.info('Bulk deleting drone position data', { ids });

            let successCount = 0;
            const errors: string[] = [];

            for (const id of ids) {
                try {
                    await this.deleteDronePosition(id);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to delete position ${id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
                    errors.push(errorMessage);
                    logger.warn(errorMessage);
                }
            }

            logger.info('Bulk delete completed', { total: ids.length, success: successCount, errors: errors.length });

            if (errors.length > 0) {
                logger.warn('Some deletions failed', { errors });
            }

            return successCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量更新無人機位置資料
     *
     * @param {Array<{id: number, data: Partial<DronePositionCreationAttributes>}>} updates - 更新資料陣列
     * @returns {Promise<number>} 成功更新的筆數
     * @throws {Error} 當批量更新失敗時
     */
    updateDronePositionsBatch = async (updates: Array<{id: number, data: Partial<DronePositionCreationAttributes>}>): Promise<number> => {
        try {
            if (!updates || updates.length === 0) {
                throw new Error('更新資料陣列不能為空');
            }

            if (updates.length > 100) {
                throw new Error('一次最多只能更新 100 筆位置資料');
            }

            logger.info('Bulk updating drone position data', { count: updates.length });

            let successCount = 0;
            const errors: string[] = [];

            for (const update of updates) {
                try {
                    await this.updateDronePosition(update.id, update.data);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to update position ${update.id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
                    errors.push(errorMessage);
                    logger.warn(errorMessage);
                }
            }

            logger.info('Bulk update completed', { total: updates.length, success: successCount, errors: errors.length });

            if (errors.length > 0) {
                logger.warn('Some updates failed', { errors });
            }

            return successCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 清除指定無人機的歷史位置資料（保留最新N筆）
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} keepLatest - 保留最新的筆數，預設保留 10 筆
     * @returns {Promise<number>} 清除的筆數
     * @throws {Error} 當清除失敗時
     */
    cleanupDronePositionHistory = async (droneId: number, keepLatest: number = 10): Promise<number> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            if (keepLatest <= 0 || keepLatest > 1000) {
                throw new Error('保留筆數必須在 1 到 1000 之間');
            }

            logger.info('Cleaning up drone position history', { droneId, keepLatest });

            // 取得該無人機的所有位置記錄
            const allPositions = await this.queryService.getDronePositionsByDroneId(droneId, 999999);
            
            if (allPositions.length <= keepLatest) {
                logger.info('No positions to clean up', { droneId, total: allPositions.length, keepLatest });
                return 0;
            }

            // 排序並找出需要刪除的記錄 (保留最新的)
            const sortedPositions = allPositions.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            const positionsToDelete = sortedPositions.slice(keepLatest);
            const idsToDelete = positionsToDelete.map(pos => pos.id);

            const deletedCount = await this.deleteDronePositionsBatch(idsToDelete);

            logger.info('Drone position history cleanup completed', { 
                droneId, 
                total: allPositions.length, 
                deleted: deletedCount,
                kept: allPositions.length - deletedCount 
            });

            return deletedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證無人機位置資料
     *
     * @private
     * @param {DronePositionCreationAttributes} data - 要驗證的資料
     * @throws {Error} 當資料驗證失敗時
     */
    private validateDronePositionData = (data: DronePositionCreationAttributes): void => {
        // 驗證必要欄位
        if (!data.drone_id || data.drone_id <= 0) {
            throw new Error('無人機 ID 必須是正整數');
        }

        if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
            throw new Error('緯度和經度必須是數字');
        }

        if (typeof data.altitude !== 'number') {
            throw new Error('高度必須是數字');
        }

        if (data.signal_strength !== undefined && (typeof data.signal_strength !== 'number' || data.signal_strength < 0)) {
            throw new Error('信號強度必須是非負數');
        }

        if (data.speed !== undefined && (typeof data.speed !== 'number' || data.speed < 0)) {
            throw new Error('速度必須是非負數');
        }

        if (data.heading !== undefined && (typeof data.heading !== 'number' || data.heading < 0 || data.heading >= 360)) {
            throw new Error('航向角度必須在 0-360 度之間');
        }

        if (data.battery_level !== undefined && (typeof data.battery_level !== 'number' || data.battery_level < 0 || data.battery_level > 100)) {
            throw new Error('電池電量必須在 0-100% 之間');
        }

        this.queryService.validateCoordinates(data.latitude, data.longitude);
    }

    /**
     * 驗證數值欄位
     *
     * @private
     * @param {Partial<DronePositionCreationAttributes>} data - 要驗證的部分資料
     * @throws {Error} 當數值驗證失敗時
     */
    private validateNumericFields = (data: Partial<DronePositionCreationAttributes>): void => {
        if (data.signal_strength !== undefined && (typeof data.signal_strength !== 'number' || data.signal_strength < 0)) {
            throw new Error('信號強度必須是非負數');
        }

        if (data.speed !== undefined && (typeof data.speed !== 'number' || data.speed < 0)) {
            throw new Error('速度必須是非負數');
        }

        if (data.heading !== undefined && (typeof data.heading !== 'number' || data.heading < 0 || data.heading >= 360)) {
            throw new Error('航向角度必須在 0-360 度之間');
        }

        if (data.battery_level !== undefined && (typeof data.battery_level !== 'number' || data.battery_level < 0 || data.battery_level > 100)) {
            throw new Error('電池電量必須在 0-100% 之間');
        }

        if (data.altitude !== undefined && typeof data.altitude !== 'number') {
            throw new Error('高度必須是數字');
        }
    }
}