/**
 * @fileoverview 無人機即時狀態資料存取層
 * 
 * 此文件實作無人機即時狀態的資料存取邏輯，包含所有與資料庫互動的操作。
 * 提供完整的 CRUD 功能和特殊查詢方法，適用於即時狀態監控和管理。
 * 
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { WhereOptions, Op } from 'sequelize';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes,
    DroneRealTimeStatus
} from '../../models/drone/DroneRealTimeStatusModel';
import { DroneStatusModel } from '../../models/drone/DroneStatusModel';

/**
 * 無人機即時狀態資料存取介面
 * 
 * 定義所有與無人機即時狀態相關的資料庫操作方法
 * 
 * @interface IDroneRealTimeStatusRepository
 */
export interface IDroneRealTimeStatusRepository {
    create(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel>;
    findById(id: number): Promise<DroneRealTimeStatusModel | null>;
    findByDroneId(droneId: number): Promise<DroneRealTimeStatusModel | null>;
    findAll(): Promise<DroneRealTimeStatusModel[]>;
    findByStatus(status: DroneRealTimeStatus): Promise<DroneRealTimeStatusModel[]>;
    findOnlineDrones(): Promise<DroneRealTimeStatusModel[]>;
    findOfflineDrones(thresholdMinutes?: number): Promise<DroneRealTimeStatusModel[]>;
    updateById(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel | null>;
    updateByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel | null>;
    deleteById(id: number): Promise<boolean>;
    deleteByDroneId(droneId: number): Promise<boolean>;
    upsertByDroneId(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel>;
    updateLastSeen(droneId: number): Promise<boolean>;
    getBatteryStatistics(): Promise<any>;
    getStatusStatistics(): Promise<any>;
}

/**
 * 無人機即時狀態資料存取實作類別
 * 
 * 實作所有與無人機即時狀態相關的資料庫操作
 * 
 * @class DroneRealTimeStatusRepository
 * @implements {IDroneRealTimeStatusRepository}
 */
export class DroneRealTimeStatusRepository implements IDroneRealTimeStatusRepository {
    
    /**
     * 創建新的無人機即時狀態記錄
     * 
     * @param data - 即時狀態資料
     * @returns Promise<DroneRealTimeStatusModel>
     */
    async create(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> {
        return await DroneRealTimeStatusModel.create(data);
    }

    /**
     * 根據 ID 查詢即時狀態記錄
     * 
     * @param id - 記錄 ID
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async findById(id: number): Promise<DroneRealTimeStatusModel | null> {
        return await DroneRealTimeStatusModel.findByPk(id, {
            include: [DroneStatusModel]
        });
    }

    /**
     * 根據無人機 ID 查詢即時狀態記錄
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async findByDroneId(droneId: number): Promise<DroneRealTimeStatusModel | null> {
        return await DroneRealTimeStatusModel.findOne({
            where: { drone_id: droneId },
            include: [DroneStatusModel]
        });
    }

    /**
     * 查詢所有即時狀態記錄
     * 
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findAll(): Promise<DroneRealTimeStatusModel[]> {
        return await DroneRealTimeStatusModel.findAll({
            include: [DroneStatusModel],
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * 根據狀態查詢即時狀態記錄
     * 
     * @param status - 即時狀態
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findByStatus(status: DroneRealTimeStatus): Promise<DroneRealTimeStatusModel[]> {
        return await DroneRealTimeStatusModel.findAll({
            where: { current_status: status },
            include: [DroneStatusModel],
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * 查詢所有在線的無人機
     * 
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findOnlineDrones(): Promise<DroneRealTimeStatusModel[]> {
        return await DroneRealTimeStatusModel.findAll({
            where: { is_connected: true },
            include: [DroneStatusModel],
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * 查詢離線的無人機
     * 
     * @param thresholdMinutes - 離線判定時間閾值（分鐘），預設 5 分鐘
     * @returns Promise<DroneRealTimeStatusModel[]>
     */
    async findOfflineDrones(thresholdMinutes: number = 5): Promise<DroneRealTimeStatusModel[]> {
        const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        
        return await DroneRealTimeStatusModel.findAll({
            where: {
                [Op.or]: [
                    { is_connected: false },
                    { last_seen: { [Op.lt]: thresholdTime } }
                ]
            },
            include: [DroneStatusModel],
            order: [['last_seen', 'DESC']]
        });
    }

    /**
     * 根據 ID 更新即時狀態記錄
     * 
     * @param id - 記錄 ID
     * @param data - 更新資料
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async updateById(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel | null> {
        const [affectedCount] = await DroneRealTimeStatusModel.update(data, {
            where: { id }
        });

        if (affectedCount > 0) {
            return await this.findById(id);
        }
        return null;
    }

    /**
     * 根據無人機 ID 更新即時狀態記錄
     * 
     * @param droneId - 無人機 ID
     * @param data - 更新資料
     * @returns Promise<DroneRealTimeStatusModel | null>
     */
    async updateByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel | null> {
        const [affectedCount] = await DroneRealTimeStatusModel.update(data, {
            where: { drone_id: droneId }
        });

        if (affectedCount > 0) {
            return await this.findByDroneId(droneId);
        }
        return null;
    }

    /**
     * 根據 ID 刪除即時狀態記錄
     * 
     * @param id - 記錄 ID
     * @returns Promise<boolean>
     */
    async deleteById(id: number): Promise<boolean> {
        const affectedCount = await DroneRealTimeStatusModel.destroy({
            where: { id }
        });
        return affectedCount > 0;
    }

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<boolean>
     */
    async deleteByDroneId(droneId: number): Promise<boolean> {
        const affectedCount = await DroneRealTimeStatusModel.destroy({
            where: { drone_id: droneId }
        });
        return affectedCount > 0;
    }

    /**
     * 根據無人機 ID 進行 Upsert 操作（更新或插入）
     * 
     * @param droneId - 無人機 ID
     * @param data - 即時狀態資料
     * @returns Promise<DroneRealTimeStatusModel>
     */
    async upsertByDroneId(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> {
        const existingRecord = await this.findByDroneId(droneId);
        
        if (existingRecord) {
            // 更新現有記錄
            await this.updateByDroneId(droneId, data);
            return await this.findByDroneId(droneId) as DroneRealTimeStatusModel;
        } else {
            // 創建新記錄
            return await this.create({ ...data, drone_id: droneId });
        }
    }

    /**
     * 更新最後連線時間
     * 
     * @param droneId - 無人機 ID
     * @returns Promise<boolean>
     */
    async updateLastSeen(droneId: number): Promise<boolean> {
        const [affectedCount] = await DroneRealTimeStatusModel.update({
            last_seen: new Date(),
            is_connected: true
        }, {
            where: { drone_id: droneId }
        });
        return affectedCount > 0;
    }

    /**
     * 獲取電池統計資訊
     * 
     * @returns Promise<any>
     */
    async getBatteryStatistics(): Promise<any> {
        const stats = await DroneRealTimeStatusModel.findAll({
            attributes: [
                [DroneRealTimeStatusModel.sequelize!.fn('AVG', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'avg_battery'],
                [DroneRealTimeStatusModel.sequelize!.fn('MIN', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'min_battery'],
                [DroneRealTimeStatusModel.sequelize!.fn('MAX', DroneRealTimeStatusModel.sequelize!.col('current_battery_level')), 'max_battery'],
                [DroneRealTimeStatusModel.sequelize!.fn('COUNT', DroneRealTimeStatusModel.sequelize!.col('id')), 'total_count']
            ],
            raw: true
        });
        return stats[0];
    }

    /**
     * 獲取狀態統計資訊
     * 
     * @returns Promise<any>
     */
    async getStatusStatistics(): Promise<any> {
        return await DroneRealTimeStatusModel.findAll({
            attributes: [
                'current_status',
                [DroneRealTimeStatusModel.sequelize!.fn('COUNT', DroneRealTimeStatusModel.sequelize!.col('id')), 'count']
            ],
            group: ['current_status'],
            raw: true
        });
    }
}