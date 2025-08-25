/**
 * @fileoverview 無人機即時狀態命令資料存取層
 * 
 * 處理無人機即時狀態的寫入操作，包含創建、更新和刪除。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-12
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { DroneRealTimeStatusModel } from '@/models/DroneRealTimeStatusModel.js';
import type { DroneRealTimeStatusAttributes, DroneRealTimeStatusCreationAttributes } from '@/models/DroneRealTimeStatusModel.js';
import { loggerDecorator } from '../../patterns/LoggerDecorator.js';

/**
 * 無人機即時狀態命令資料存取庫
 * 
 * 提供無人機即時狀態的各種寫入功能
 */
@injectable()
export class DroneRealTimeStatusCommandsRepositorysitorysitorysitory {
    
    /**
     * 創建無人機即時狀態記錄
     */
    createRealTimeStatus = loggerDecorator(async (statusData: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusAttributes> => {
        return await DroneRealTimeStatusModel.create(statusData);
    }, 'createRealTimeStatus')

    /**
     * 更新無人機即時狀態
     */
    updateRealTimeStatus = loggerDecorator(async (id: number, updates: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusAttributes | null> => {
        const [affectedRows] = await DroneRealTimeStatusModel.update(updates, {
            where: { id },
            returning: true
        });

        if (affectedRows === 0) {
            return null;
        }

        return await DroneRealTimeStatusModel.findByPk(id);
    }, 'updateRealTimeStatus')

    /**
     * 根據無人機 ID 更新即時狀態
     */
    updateRealTimeStatusByDroneId = loggerDecorator(async (droneId: number, updates: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusAttributes | null> => {
        const [affectedRows] = await DroneRealTimeStatusModel.update(updates, {
            where: { drone_id: droneId },
            returning: true
        });

        if (affectedRows === 0) {
            return null;
        }

        return await DroneRealTimeStatusModel.findOne({
            where: { drone_id: droneId },
            order: [['updatedAt', 'DESC']]
        });
    }, 'updateRealTimeStatusByDroneId')

    /**
     * 刪除即時狀態記錄
     */
    deleteRealTimeStatus = loggerDecorator(async (id: number): Promise<number> => {
        return await DroneRealTimeStatusModel.destroy({
            where: { id }
        });
    }, 'deleteRealTimeStatus')

    /**
     * 批量更新無人機狀態
     */
    bulkUpdateRealTimeStatus = loggerDecorator(async (updates: Array<{ droneId: number; data: Partial<DroneRealTimeStatusCreationAttributes> }>): Promise<void> => {
        const promises = updates.map(({ droneId, data }) =>
            this.updateRealTimeStatusByDroneId(droneId, data)
        );

        await Promise.all(promises);
    }, 'bulkUpdateRealTimeStatus')

    /**
     * Upsert 操作 - 如果存在則更新，否則創建
     */
    upsertRealTimeStatus = loggerDecorator(async (droneId: number, statusData: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusAttributes> => {
        const existingStatus = await DroneRealTimeStatusModel.findOne({
            where: { drone_id: droneId }
        });

        if (existingStatus) {
            await existingStatus.update(statusData);
            return existingStatus;
        } else {
            return await DroneRealTimeStatusModel.create({ ...statusData, drone_id: droneId });
        }
    }, 'upsertRealTimeStatus')
}