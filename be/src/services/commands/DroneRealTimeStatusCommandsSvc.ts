/**
 * @fileoverview 無人機即時狀態命令 Service 實現
 *
 * 此文件實作了無人機即時狀態命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneRealTimeStatusCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { 
    DroneRealTimeStatusRepository, 
    IDroneRealTimeStatusRepository 
} from '../../repo/drone/DroneRealTimeStatusRepo.js';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes,
    DroneRealTimeStatus
} from '../../models/drone/DroneRealTimeStatusModel.js';
import type { 
    DroneRealTimeStatusCreationAttributes as ExternalCreationAttributes,
    DroneRealTimeStatusAttributes as ExternalAttributes
} from '../../types/services/IDroneRealTimeStatusService.js';
import { DroneRealTimeStatusQueriesSvc } from '../queries/DroneRealTimeStatusQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneRealTimeStatusCommandsSvc');

/**
 * 無人機即時狀態命令 Service 實現類別
 *
 * 專門處理無人機即時狀態相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneRealTimeStatusCommandsSvc
 * @since 1.0.0
 */
@injectable()
export class DroneRealTimeStatusCommandsSvc {
    private repository: IDroneRealTimeStatusRepository;
    private queryService: DroneRealTimeStatusQueriesSvc;

    constructor(repository?: IDroneRealTimeStatusRepository) {
        this.repository = repository || new DroneRealTimeStatusRepository();
        this.queryService = new DroneRealTimeStatusQueriesSvc(this.repository);
    }

    /**
     * 創建新的無人機即時狀態記錄
     */
    async createRealTimeStatus(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> {
        try {
            // 驗證資料
            const validationResult = this.validateRealTimeStatusData(data);
            if (!validationResult.isSuccess) {
                throw new Error(validationResult.message);
            }

            // 設定預設值
            const processedData = {
                ...data,
                last_seen: new Date(),
                is_connected: true
            };

            logger.info('Creating new drone real-time status', { droneId: data.drone_id });
            const result = await this.repository.create(processedData);
            
            logger.info('Successfully created drone real-time status', { id: result.id, droneId: data.drone_id });
            return result;
        } catch (error) {
            logger.error('Failed to create drone real-time status', { data, error });
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`創建即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 更新即時狀態記錄
     */
    async updateRealTimeStatus(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel> {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的記錄 ID');
            }

            // 檢查記錄是否存在
            const existingRecord = await this.queryService.getRealTimeStatusById(id);
            if (!existingRecord) {
                throw new Error('即時狀態記錄不存在');
            }

            logger.info('Updating drone real-time status', { id, data });
            const result = await this.repository.updateById(id, data);
            if (!result) {
                throw new Error('更新即時狀態記錄失敗');
            }

            logger.info('Successfully updated drone real-time status', { id });
            return result;
        } catch (error) {
            logger.error('Failed to update drone real-time status', { id, data, error });
            throw new Error(`更新即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據無人機 ID 更新即時狀態記錄
     */
    async updateRealTimeStatusByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Updating drone real-time status by drone ID', { droneId, data });
            const result = await this.repository.updateByDroneId(droneId, data);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在或更新失敗');
            }

            logger.info('Successfully updated drone real-time status by drone ID', { droneId });
            return result;
        } catch (error) {
            logger.error('Failed to update drone real-time status by drone ID', { droneId, data, error });
            throw new Error(`更新即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 刪除即時狀態記錄
     */
    async deleteRealTimeStatus(id: number): Promise<boolean> {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的記錄 ID');
            }

            // 檢查記錄是否存在
            const existingRecord = await this.queryService.getRealTimeStatusById(id);
            if (!existingRecord) {
                throw new Error('即時狀態記錄不存在');
            }

            logger.info('Deleting drone real-time status', { id });
            const result = await this.repository.deleteById(id);
            if (!result) {
                throw new Error('即時狀態記錄不存在或刪除失敗');
            }

            logger.info('Successfully deleted drone real-time status', { id });
            return true;
        } catch (error) {
            logger.error('Failed to delete drone real-time status', { id, error });
            throw new Error(`刪除即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     */
    async deleteRealTimeStatusByDroneId(droneId: number): Promise<boolean> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Deleting drone real-time status by drone ID', { droneId });
            const result = await this.repository.deleteByDroneId(droneId);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在或刪除失敗');
            }

            logger.info('Successfully deleted drone real-time status by drone ID', { droneId });
            return true;
        } catch (error) {
            logger.error('Failed to delete drone real-time status by drone ID', { droneId, error });
            throw new Error(`刪除即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Upsert 即時狀態記錄
     */
    async upsertRealTimeStatus(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            // 驗證資料
            const validationResult = this.validateRealTimeStatusData(data);
            if (!validationResult.isSuccess) {
                throw new Error(validationResult.message);
            }

            logger.info('Upserting drone real-time status', { droneId });
            const result = await this.repository.upsertByDroneId(droneId, data);
            
            logger.info('Successfully upserted drone real-time status', { droneId });
            return result;
        } catch (error) {
            logger.error('Failed to upsert drone real-time status', { droneId, data, error });
            throw new Error(`更新/創建即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 更新心跳包（最後連線時間）
     */
    async updateHeartbeat(droneId: number): Promise<boolean> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Updating drone heartbeat', { droneId });
            const result = await this.repository.updateLastSeen(droneId);
            
            if (result) {
                logger.info('Successfully updated drone heartbeat', { droneId });
            } else {
                logger.warn('Failed to update drone heartbeat - drone not found', { droneId });
            }
            
            return result;
        } catch (error) {
            logger.error('Failed to update drone heartbeat', { droneId, error });
            throw new Error(`更新心跳包失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 標記無人機為離線狀態
     */
    async markDroneOffline(droneId: number, errorMessage?: string): Promise<DroneRealTimeStatusModel> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            const updateData = {
                current_status: DroneRealTimeStatus.OFFLINE,
                is_connected: false,
                error_message: errorMessage || null
            };

            logger.info('Marking drone as offline', { droneId, errorMessage });
            const result = await this.repository.updateByDroneId(droneId, updateData);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在');
            }

            logger.info('Successfully marked drone as offline', { droneId });
            return result;
        } catch (error) {
            logger.error('Failed to mark drone as offline', { droneId, errorMessage, error });
            throw new Error(`標記無人機離線狀態失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 批量更新無人機即時狀態
     */
    async updateRealTimeStatusesBatch(updates: Array<{ droneId: number; statusData: Partial<DroneRealTimeStatusAttributes> }>): Promise<DroneRealTimeStatusModel[]> {
        const results: DroneRealTimeStatusModel[] = [];
        
        logger.info('Batch updating drone real-time statuses', { count: updates.length });
        
        for (const update of updates) {
            try {
                const model = await this.updateRealTimeStatusByDroneId(
                    update.droneId, 
                    update.statusData
                );
                results.push(model);
            } catch (error) {
                logger.warn('Failed to update drone in batch', { 
                    droneId: update.droneId, 
                    error: error instanceof Error ? error.message : String(error) 
                });
                // 忽略錯誤，繼續處理下一個
            }
        }
        
        logger.info('Batch update completed', { 
            total: updates.length, 
            success: results.length, 
            failed: updates.length - results.length 
        });
        return results;
    }

    /**
     * 驗證即時狀態資料
     * 
     * @private
     */
    private validateRealTimeStatusData(data: DroneRealTimeStatusCreationAttributes): { isSuccess: boolean; message: string } {
        if (!data.drone_id || data.drone_id <= 0) {
            return { isSuccess: false, message: '無效的無人機 ID' };
        }

        if (data.current_battery_level !== undefined) {
            if (data.current_battery_level < 0 || data.current_battery_level > 100) {
                return { isSuccess: false, message: '電量百分比必須在 0-100 之間' };
            }
        }

        if (data.current_status && !Object.values(DroneRealTimeStatus).includes(data.current_status)) {
            return { isSuccess: false, message: '無效的即時狀態值' };
        }

        if (data.current_heading !== undefined && data.current_heading !== null) {
            if (data.current_heading < 0 || data.current_heading >= 360) {
                return { isSuccess: false, message: '航向角度必須在 0-359 度之間' };
            }
        }

        return { isSuccess: true, message: '驗證成功' };
    }

    // 實現外部介面方法
    async createDroneRealTimeStatus(data: ExternalCreationAttributes): Promise<ExternalAttributes> {
        const convertedData = this.convertFromExternalCreationAttributes(data);
        const model = await this.createRealTimeStatus(convertedData);
        return this.convertToExternalAttributes(model.toJSON());
    }

    async updateDroneRealTimeStatus(id: number, data: Partial<ExternalCreationAttributes>): Promise<ExternalAttributes | null> {
        try {
            const convertedData = this.convertFromPartialExternalCreationAttributes(data);
            const model = await this.updateRealTimeStatus(id, convertedData);
            return this.convertToExternalAttributes(model.toJSON());
        } catch (error) {
            return null;
        }
    }

    async deleteDroneRealTimeStatus(id: number): Promise<number> {
        const result = await this.deleteRealTimeStatus(id);
        return result ? 1 : 0;
    }

    async updateDroneRealTimeStatusByDroneId(droneId: number, data: Partial<ExternalCreationAttributes>): Promise<ExternalAttributes | null> {
        try {
            const convertedData = this.convertFromPartialExternalCreationAttributes(data);
            const model = await this.updateRealTimeStatusByDroneId(droneId, convertedData);
            return this.convertToExternalAttributes(model.toJSON());
        } catch (error) {
            return null;
        }
    }

    async updateDroneRealTimeStatusesBatch(updates: Array<{ droneId: number; statusData: Partial<ExternalCreationAttributes> }>): Promise<ExternalAttributes[]> {
        const convertedUpdates = updates.map(update => ({
            droneId: update.droneId,
            statusData: this.convertFromPartialExternalCreationAttributes(update.statusData)
        }));
        
        const results = await this.updateRealTimeStatusesBatch(convertedUpdates);
        return results.map(model => this.convertToExternalAttributes(model.toJSON()));
    }

    /**
     * 轉換外部創建屬性到內部創建屬性
     * @private
     */
    private convertFromExternalCreationAttributes(data: ExternalCreationAttributes): DroneRealTimeStatusCreationAttributes {
        return {
            drone_id: data.drone_id,
            current_status: data.status as DroneRealTimeStatus,
            current_battery_level: data.battery_level,
            signal_strength: data.signal_strength,
            current_altitude: data.altitude,
            current_speed: data.speed,
            current_heading: data.heading,
            // latitude: data.latitude,
            // longitude: data.longitude,
            temperature: data.temperature,
            // humidity: data.humidity,
            // wind_speed: data.wind_speed,
            last_seen: data.last_seen
        };
    }

    /**
     * 轉換部分外部創建屬性到內部屬性
     * @private
     */
    private convertFromPartialExternalCreationAttributes(data: Partial<ExternalCreationAttributes>): Partial<DroneRealTimeStatusAttributes> {
        const result: Partial<DroneRealTimeStatusAttributes> = {};
        
        if (data.drone_id !== undefined) result.drone_id = data.drone_id;
        if (data.status !== undefined) result.current_status = data.status as DroneRealTimeStatus;
        if (data.battery_level !== undefined) result.current_battery_level = data.battery_level;
        if (data.signal_strength !== undefined) result.signal_strength = data.signal_strength;
        if (data.altitude !== undefined) result.current_altitude = data.altitude;
        if (data.speed !== undefined) result.current_speed = data.speed;
        if (data.heading !== undefined) result.current_heading = data.heading;
        // 注意：這些欄位在內部模型中可能不存在，需要根據實際模型調整
        // if (data.latitude !== undefined) result.latitude = data.latitude;
        // if (data.longitude !== undefined) result.longitude = data.longitude;
        if (data.temperature !== undefined) result.temperature = data.temperature;
        // if (data.humidity !== undefined) result.humidity = data.humidity;
        // if (data.wind_speed !== undefined) result.wind_speed = data.wind_speed;
        if (data.last_seen !== undefined) result.last_seen = data.last_seen;
        
        return result;
    }

    /**
     * 轉換內部模型屬性到外部屬性
     * @private
     */
    private convertToExternalAttributes(modelData: any): ExternalAttributes {
        return {
            id: modelData.id,
            drone_id: modelData.drone_id,
            status: modelData.current_status || 'idle',
            battery_level: modelData.current_battery_level,
            signal_strength: modelData.signal_strength,
            altitude: modelData.current_altitude,
            speed: modelData.current_speed,
            heading: modelData.current_heading,
            latitude: modelData.latitude,
            longitude: modelData.longitude,
            temperature: modelData.temperature,
            humidity: modelData.humidity,
            wind_speed: modelData.wind_speed,
            last_seen: modelData.last_seen,
            createdAt: modelData.createdAt,
            updatedAt: modelData.updatedAt
        };
    }
}