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
import { TYPES } from '../../container/types.js';
import { DroneStatusCommandsRepository } from '../../repo/commands/DroneStatusCommandsRepo.js';
import type { DroneStatusAttributes, DroneStatusCreationAttributes } from '../../models/DroneStatusModel.js';
import { DroneStatus } from '../../models/DroneStatusModel.js';
import type { IDroneStatusRepository } from '../../types/repositories/IDroneStatusRepository.js';
import { DroneStatusQueriesSvc } from '../queries/DroneStatusQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

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
    createDroneStatus = async (data: DroneStatusCreationAttributes): Promise<DroneStatusAttributes> => {
        try {
            // 驗證必要欄位
            await this.validateDroneStatusData(data);

            // 檢查序號是否已存在
            const isDuplicate = await this.queryService.isDroneSerialExists(data.drone_serial);
            if (isDuplicate) {
                throw new Error('無人機序號已存在');
            }
const droneStatus = await this.droneStatusRepository.create(data);
return droneStatus;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新無人機狀態資料
     */
    updateDroneStatus = async (id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusAttributes> => {
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
const updatedDroneStatus = await this.droneStatusRepository.update(id, data);

            if (!updatedDroneStatus) {
                throw new Error(`找不到 ID 為 ${id} 的無人機狀態資料`);
            }
return updatedDroneStatus;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 刪除無人機狀態資料
     */
    deleteDroneStatus = async (id: number): Promise<void> => {
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
await this.droneStatusRepository.delete(id);
} catch (error) {
            throw error;
        }
    }

    /**
     * 更新無人機狀態
     */
    updateDroneStatusOnly = async (id: number, status: DroneStatus): Promise<DroneStatusAttributes> => {
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
const updatedDroneStatus = await this.droneStatusRepository.updateStatus(id, status);

            if (!updatedDroneStatus) {
                throw new Error(`更新 ID 為 ${id} 的無人機狀態失敗`);
            }
return updatedDroneStatus;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量更新無人機狀態
     */
    bulkUpdateDroneStatus = async (ids: number[], status: DroneStatus): Promise<number> => {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('無人機 ID 陣列不能為空');
            }

            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }
let successCount = 0;
            const errors: string[] = [];

            for (const id of ids) {
                try {
                    await this.updateDroneStatusOnly(id, status);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to update drone ${id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
                    errors.push(errorMessage);
}
            }
if (errors.length > 0) {
}

            return successCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 批量刪除無人機狀態資料
     */
    bulkDeleteDroneStatus = async (ids: number[]): Promise<number> => {
        try {
            if (!ids || ids.length === 0) {
                throw new Error('無人機 ID 陣列不能為空');
            }
let successCount = 0;
            const errors: string[] = [];

            for (const id of ids) {
                try {
                    await this.deleteDroneStatus(id);
                    successCount++;
                } catch (error) {
                    const errorMessage = `Failed to delete drone ${id}: ${error instanceof Error ? error.message : '未知錯誤'}`;
                    errors.push(errorMessage);
}
            }
if (errors.length > 0) {
}

            return successCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 重置無人機為非活躍狀態
     */
    resetInactiveDrones = async (): Promise<number> => {
        try {
const activeDrones = await this.queryService.getDronesByStatus(DroneStatus.ACTIVE);
            const flyingDrones = await this.queryService.getDronesByStatus(DroneStatus.FLYING);
            
            const activeIds = activeDrones.map(drone => drone.id);
            const flyingIds = flyingDrones.map(drone => drone.id);
            const allActiveIds = [...activeIds, ...flyingIds];

            if (allActiveIds.length === 0) {
return 0;
            }

            const resetCount = await this.bulkUpdateDroneStatus(allActiveIds, DroneStatus.INACTIVE);
return resetCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 將維護中的無人機設為活躍
     */
    activateMaintenanceDrones = async (): Promise<number> => {
        try {
const maintenanceDrones = await this.queryService.getDronesByStatus(DroneStatus.MAINTENANCE);
            const maintenanceIds = maintenanceDrones.map(drone => drone.id);

            if (maintenanceIds.length === 0) {
return 0;
            }

            const activatedCount = await this.bulkUpdateDroneStatus(maintenanceIds, DroneStatus.ACTIVE);
return activatedCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新無人機擁有者
     */
    updateDroneOwner = async (id: number, newOwnerUserId: number): Promise<DroneStatusAttributes> => {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的無人機 ID');
            }

            if (!newOwnerUserId || newOwnerUserId <= 0) {
                throw new Error('無效的新擁有者用戶 ID');
            }
const updatedDrone = await this.updateDroneStatus(id, {
                owner_user_id: newOwnerUserId,
                updatedAt: new Date()
            });
return updatedDrone;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 驗證無人機狀態資料
     */
    private validateDroneStatusData = async (data: DroneStatusCreationAttributes): Promise<void> => {
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
    private validateNumericFields = (data: Partial<DroneStatusCreationAttributes>): void => {
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