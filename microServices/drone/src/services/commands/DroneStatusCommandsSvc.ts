/**
 * @fileoverview 無人機狀態命令 Service 實現
 *
 * 此文件實作了無人機狀態命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneStatusCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types/container/dependency-injection.js';
import { DroneStatusCommandsRepository } from '../../repo/commands/drone/DroneStatusCommandsRepo.js';
import type { DroneStatusAttributes, DroneStatusCreationAttributes } from '../../models/drone/DroneStatusModel.js';
import { DroneStatus } from '../../models/drone/DroneStatusModel.js';
import type { IDroneStatusRepository } from '../../types/repositories/IDroneStatusRepository.js';
import { DroneStatusQueriesSvc } from '../queries/DroneStatusQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneStatusCommandsSvc');

/**
 * 無人機狀態命令 Service 實現類別
 *
 * 專門處理無人機狀態相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneStatusCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DroneStatusCommandsSvc {
    constructor(
        @inject(TYPES.DroneStatusQueriesSvc)
        private readonly queryService: DroneStatusQueriesSvc
    ) {
        // Initialize repository directly for now since it's not in DI container yet
        this.droneStatusRepository = new DroneStatusCommandsRepository();
    }

    private readonly droneStatusRepository: DroneStatusCommandsRepository;

    /**
     * 建立新的無人機狀態資料
     */
    async createDroneStatus(data: DroneStatusCreationAttributes): Promise<DroneStatusAttributes> {
        try {
            // 驗證必要欄位
            await this.validateDroneStatusData(data);

            // 檢查序號是否已存在
            const isDuplicate = await this.queryService.isDroneSerialExists(data.drone_serial);
            if (isDuplicate) {
                throw new Error('無人機序號已存在');
            }

            logger.info('Creating new drone status data', { data });
            const droneStatus = await this.droneStatusRepository.create(data);

            logger.info('Successfully created drone status data', { id: droneStatus.id });
            return droneStatus;
        } catch (error) {
            logger.error('Failed to create drone status data', { data, error });
            throw error;
        }
    }

    /**
     * 更新無人機狀態資料
     */
    async updateDroneStatus(id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機狀態資料 ID');
            }

            // 檢查記錄是否存在
            const existingDrone = await this.queryService.getDroneStatusById(id);
            if (!existingDrone) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            // 驗證更新資料
            if (data.drone_serial) {
                const isDuplicate = await this.queryService.isDroneSerialExists(data.drone_serial, id);
                if (isDuplicate) {
                    throw new Error('無人機序號已存在');
                }
            }

            // 驗證數值範圍
            this.validateNumericFields(data);

            logger.info('Updating drone status data', { id, data });
            const updatedDroneStatus = await this.droneStatusRepository.update(id, data);

            if (!updatedDroneStatus) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            logger.info('Successfully updated drone status data', { id });
            return updatedDroneStatus;
        } catch (error) {
            logger.error('Failed to update drone status data', { id, data, error });
            throw error;
        }
    }

    /**
     * 刪除無人機狀態資料
     */
    async deleteDroneStatus(id: number): Promise<void> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機狀態資料 ID');
            }

            // 檢查記錄是否存在
            const existingDrone = await this.queryService.getDroneStatusById(id);
            if (!existingDrone) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }

            logger.info('Deleting drone status data', { id });
            const success = await this.droneStatusRepository.delete(id);

            if (!success) {
                throw new Error(`刪除 ID 為 ${id} 的無人機狀態資料失敗`);
            }

            logger.info('Successfully deleted drone status data', { id });
        } catch (error) {
            logger.error('Failed to delete drone status data', { id, error });
            throw error;
        }
    }

    /**
     * 更新無人機狀態
     */
    async updateDroneStatusOnly(id: number, status: DroneStatus): Promise<DroneStatusAttributes> {
        try {
            // 驗證 ID
            if (!id || id <= 0) {
                throw new Error('無效的無人機 ID');
            }

            // 驗證狀態
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }

            // 檢查記錄是否存在
            const existingDrone = await this.queryService.getDroneStatusById(id);
            if (!existingDrone) {
                throw new Error(`找不到 ID 為 ${id} 的無人機`);
            }

            logger.info('Updating drone status only', { id, status });
            const updatedDroneStatus = await this.droneStatusRepository.updateStatus(id, status);

            if (!updatedDroneStatus) {
                throw new Error(`更新 ID 為 ${id} 的無人機狀態失敗`);
            }

            logger.info('Successfully updated drone status', { id, status });
            return updatedDroneStatus;
        } catch (error) {
            logger.error('Failed to update drone status', { id, status, error });
            throw error;
        }
    }

    /**
     * 批量更新無人機狀態
     */
    async bulkUpdateDroneStatus(ids: number[], status: DroneStatus): Promise<number> {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('無人機 ID 陣列不能為空');
            }

            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }

            logger.info('Bulk updating drone status', { ids, status });

            let successCount = 0;
            const errors: string[] = [];

            for (const id of ids) {
                try {
                    await this.updateDroneStatusOnly(id, status);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to update drone ${id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
                    errors.push(errorMessage);
                    logger.warn(errorMessage);
                }
            }

            logger.info('Bulk update completed', { total: ids.length, success: successCount, errors: errors.length });

            if (errors.length > 0) {
                logger.warn('Some updates failed', { errors });
            }

            return successCount;
        } catch (error) {
            logger.error('Failed to bulk update drone status', { ids, status, error });
            throw error;
        }
    }

    /**
     * 批量刪除無人機狀態資料
     */
    async bulkDeleteDroneStatus(ids: number[]): Promise<number> {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('無人機 ID 陣列不能為空');
            }

            logger.info('Bulk deleting drone status data', { ids });

            let successCount = 0;
            const errors: string[] = [];

            for (const id of ids) {
                try {
                    await this.deleteDroneStatus(id);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to delete drone ${id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
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
            logger.error('Failed to bulk delete drone status data', { ids, error });
            throw error;
        }
    }

    /**
     * 重置無人機為非活躍狀態
     */
    async resetInactiveDrones(): Promise<number> {
        try {
            logger.info('Resetting inactive drones');

            const activeDrones = await this.queryService.getDronesByStatus(DroneStatus.ACTIVE);
            const flyingDrones = await this.queryService.getDronesByStatus(DroneStatus.FLYING);
            
            const activeIds = activeDrones.map(drone => drone.id);
            const flyingIds = flyingDrones.map(drone => drone.id);
            const allActiveIds = [...activeIds, ...flyingIds];

            if (allActiveIds.length === 0) {
                logger.info('No active or flying drones to reset');
                return 0;
            }

            const resetCount = await this.bulkUpdateDroneStatus(allActiveIds, DroneStatus.INACTIVE);

            logger.info('Inactive drones reset completed', { resetCount });
            return resetCount;
        } catch (error) {
            logger.error('Failed to reset inactive drones', { error });
            throw error;
        }
    }

    /**
     * 將維護中的無人機設為活躍
     */
    async activateMaintenanceDrones(): Promise<number> {
        try {
            logger.info('Activating maintenance drones');

            const maintenanceDrones = await this.queryService.getDronesByStatus(DroneStatus.MAINTENANCE);
            const maintenanceIds = maintenanceDrones.map(drone => drone.id);

            if (maintenanceIds.length === 0) {
                logger.info('No maintenance drones to activate');
                return 0;
            }

            const activatedCount = await this.bulkUpdateDroneStatus(maintenanceIds, DroneStatus.ACTIVE);

            logger.info('Maintenance drones activation completed', { activatedCount });
            return activatedCount;
        } catch (error) {
            logger.error('Failed to activate maintenance drones', { error });
            throw error;
        }
    }

    /**
     * 更新無人機擁有者
     */
    async updateDroneOwner(id: number, newOwnerUserId: number): Promise<DroneStatusAttributes> {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的無人機 ID');
            }

            if (!newOwnerUserId || newOwnerUserId <= 0) {
                throw new Error('無效的新擁有者用戶 ID');
            }

            logger.info('Updating drone owner', { id, newOwnerUserId });

            const updatedDrone = await this.updateDroneStatus(id, {
                owner_user_id: newOwnerUserId,
                updatedAt: new Date()
            });

            logger.info('Successfully updated drone owner', { id, newOwnerUserId });
            return updatedDrone;
        } catch (error) {
            logger.error('Failed to update drone owner', { id, newOwnerUserId, error });
            throw error;
        }
    }

    /**
     * 驗證無人機狀態資料
     */
    private async validateDroneStatusData(data: DroneStatusCreationAttributes): Promise<void> {
        // 驗證必要欄位
        if (!data.drone_serial || data.drone_serial.trim() === '') {
            throw new Error('無人機序號為必填欄位');
        }

        if (!data.drone_name || data.drone_name.trim() === '') {
            throw new Error('無人機名稱為必填欄位');
        }

        if (!data.model || data.model.trim() === '') {
            throw new Error('型號為必填欄位');
        }

        if (!data.manufacturer || data.manufacturer.trim() === '') {
            throw new Error('製造商為必填欄位');
        }

        if (!data.owner_user_id || data.owner_user_id <= 0) {
            throw new Error('擁有者用戶 ID 必須是正整數');
        }

        if (!data.status || !Object.values(DroneStatus).includes(data.status)) {
            throw new Error('無效的無人機狀態');
        }

        // 驗證數值範圍
        this.validateNumericFields(data);
    }

    /**
     * 驗證數值欄位
     */
    private validateNumericFields(data: Partial<DroneStatusCreationAttributes>): void {
        if (data.max_altitude !== undefined && (typeof data.max_altitude !== 'number' || data.max_altitude <= 0)) {
            throw new Error('最大飛行高度必須是正數');
        }

        if (data.max_range !== undefined && (typeof data.max_range !== 'number' || data.max_range <= 0)) {
            throw new Error('最大飛行距離必須是正數');
        }

        if (data.battery_capacity !== undefined && (typeof data.battery_capacity !== 'number' || data.battery_capacity <= 0)) {
            throw new Error('電池容量必須是正數');
        }

        if (data.weight !== undefined && (typeof data.weight !== 'number' || data.weight <= 0)) {
            throw new Error('重量必須是正數');
        }
    }
}