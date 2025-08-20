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
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { DroneRealTimeStatusCommandsRepository } from '../../repo/commands/DroneRealTimeStatusCommandsRepo.js';
// 暫時註解掉不存在的類型導入，使用 any 作為臨時解決方案
// import type { IDroneRealTimeStatusRepository } from '../../types/repositories/IDroneRealTimeStatusRepository.js';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes,
    DroneRealTimeStatus
} from '../../models/DroneRealTimeStatusModel.js';
import type { 
    DroneRealTimeStatusCreationAttributes as ExternalCreationAttributesLocal,
    DroneRealTimeStatusAttributes as ExternalAttributes
} from '../../types/services/IDroneRealTimeStatusService.js';
import { DroneRealTimeStatusQueriesSvc } from '../queries/DroneRealTimeStatusQueriesSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneRealTimeStatusCommandsSvc');

/**
 * 外部資料創建屬性介面
 */
interface ExternalCreationAttributesLocalLocal {
  drone_id: number;
  status?: string;
  battery_level?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  signal_strength?: number | null;
  temperature?: number | null;
  last_seen?: Date;
}

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
    private repo: DroneRealTimeStatusCommandsRepo;
    private readonly queryService: DroneRealTimeStatusQueriesSvc;

    constructor(
        @inject(TYPES.DroneRealTimeStatusCommandsRepository) repo: DroneRealTimeStatusCommandsRepository,
        @inject(TYPES.DroneRealTimeStatusQueriesSvc) queryService: DroneRealTimeStatusQueriesSvc
    ) {
        this.repo = repo;
        this.queryService = queryService;
    }

    /**
     * 創建新的無人機即時狀態記錄
     */
    createRealTimeStatus = async (data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> => {
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
            const result = await this.repo.create(processedData);
            
            logger.info('Successfully created drone real-time status', { id: result.id, droneId: data.drone_id });
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`創建即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 更新即時狀態記錄
     */
    updateRealTimeStatus = async (id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel> => {
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
            const result = await this.repo.updateById(id, data);
            if (!result) {
                throw new Error('更新即時狀態記錄失敗');
            }

            logger.info('Successfully updated drone real-time status', { id });
            return result;
        } catch (error) {
            throw new Error(`更新即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據無人機 ID 更新即時狀態記錄
     */
    updateRealTimeStatusByDroneId = async (droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Updating drone real-time status by drone ID', { droneId, data });
            const result = await this.repo.updateByDroneId(droneId, data);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在或更新失敗');
            }

            logger.info('Successfully updated drone real-time status by drone ID', { droneId });
            return result;
        } catch (error) {
            throw new Error(`更新即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 刪除即時狀態記錄
     */
    deleteRealTimeStatus = async (id: number): Promise<boolean> => {
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
            const result = await this.repo.deleteById(id);
            if (!result) {
                throw new Error('即時狀態記錄不存在或刪除失敗');
            }

            logger.info('Successfully deleted drone real-time status', { id });
            return true;
        } catch (error) {
            throw new Error(`刪除即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     */
    deleteRealTimeStatusByDroneId = async (droneId: number): Promise<boolean> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Deleting drone real-time status by drone ID', { droneId });
            const result = await this.repo.deleteByDroneId(droneId);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在或刪除失敗');
            }

            logger.info('Successfully deleted drone real-time status by drone ID', { droneId });
            return true;
        } catch (error) {
            throw new Error(`刪除即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Upsert 即時狀態記錄
     */
    upsertRealTimeStatus = async (droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel> => {
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
            const result = await this.repo.upsertByDroneId(droneId, data);
            
            logger.info('Successfully upserted drone real-time status', { droneId });
            return result;
        } catch (error) {
            throw new Error(`更新/創建即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 更新心跳包（最後連線時間）
     */
    updateHeartbeat = async (droneId: number): Promise<boolean> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Updating drone heartbeat', { droneId });
            const result = await this.repo.updateLastSeen(droneId);
            
            if (result) {
                logger.info('Successfully updated drone heartbeat', { droneId });
            } else {
                logger.warn('Failed to update drone heartbeat - drone not found', { droneId });
            }
            
            return result;
        } catch (error) {
            throw new Error(`更新心跳包失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 標記無人機為離線狀態
     */
    markDroneOffline = async (droneId: number, errorMessage?: string): Promise<DroneRealTimeStatusModel> => {
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
            const result = await this.repo.updateByDroneId(droneId, updateData);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在');
            }

            logger.info('Successfully marked drone as offline', { droneId });
            return result;
        } catch (error) {
            throw new Error(`標記無人機離線狀態失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 批量更新無人機即時狀態
     */
    updateRealTimeStatusesBatch = async (updates: Array<{ droneId: number; statusData: Partial<DroneRealTimeStatusAttributes> }>): Promise<DroneRealTimeStatusModel[]> => {
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
    private validateRealTimeStatusData = (data: DroneRealTimeStatusCreationAttributes): { isSuccess: boolean; message: string } => {
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
    createDroneRealTimeStatus = async (data: ExternalCreationAttributesLocal): Promise<ExternalAttributes> => {
        const convertedData = this.convertFromExternalCreationAttributesLocal(data);
        const model = await this.createRealTimeStatus(convertedData);
        return this.convertToExternalAttributes(model.toJSON());
    }

    updateDroneRealTimeStatus = async (id: number, data: Partial<ExternalCreationAttributesLocal>): Promise<ExternalAttributes | null> => {
        try {
            const convertedData = this.convertFromPartialExternalCreationAttributesLocal(data);
            const model = await this.updateRealTimeStatus(id, convertedData);
            return this.convertToExternalAttributes(model.toJSON());
        } catch (error) {
            return null;
        }
    }

    deleteDroneRealTimeStatus = async (id: number): Promise<number> => {
        const result = await this.deleteRealTimeStatus(id);
        return result ? 1 : 0;
    }

    updateDroneRealTimeStatusByDroneId = async (droneId: number, data: Partial<ExternalCreationAttributesLocal>): Promise<ExternalAttributes | null> => {
        try {
            const convertedData = this.convertFromPartialExternalCreationAttributesLocal(data);
            const model = await this.updateRealTimeStatusByDroneId(droneId, convertedData);
            return this.convertToExternalAttributes(model.toJSON());
        } catch (error) {
            return null;
        }
    }

    updateDroneRealTimeStatusesBatch = async (updates: Array<{ droneId: number; statusData: Partial<ExternalCreationAttributesLocal> }>): Promise<ExternalAttributes[]> => {
        const convertedUpdates = updates.map(update => ({
            droneId: update.droneId,
            statusData: this.convertFromPartialExternalCreationAttributesLocal(update.statusData)
        }));
        
        const results = await this.updateRealTimeStatusesBatch(convertedUpdates);
        return results.map(model => this.convertToExternalAttributes(model.toJSON()));
    }

    /**
     * 轉換外部創建屬性到內部創建屬性
     * @private
     */
    private convertFromExternalCreationAttributesLocal = (data: ExternalCreationAttributesLocal): DroneRealTimeStatusCreationAttributes => {
        return {
            drone_id: data.drone_id,
            current_status: (data as any).current_status || (data as any).status || DroneRealTimeStatus.IDLE,
            current_battery_level: (data as any).current_battery_level || (data as any).battery_level || 0,
            signal_strength: data.signal_strength ?? null,
            current_altitude: (data as any).current_altitude || (data as any).altitude || null,
            current_speed: (data as any).current_speed || (data as any).speed || null,
            current_heading: (data as any).current_heading || (data as any).heading || null,
            temperature: data.temperature ?? null,
            last_seen: data.last_seen ?? new Date(),
            is_connected: true, // 預設連線狀態
            error_message: null // 預設無錯誤訊息
        };
    }

    /**
     * 轉換部分外部創建屬性到內部屬性
     * @private
     */
    private convertFromPartialExternalCreationAttributesLocal = (data: Partial<ExternalCreationAttributesLocal>): Partial<DroneRealTimeStatusAttributes> => {
        const result: Partial<DroneRealTimeStatusAttributes> = {};
        
        if (data.drone_id !== undefined) result.drone_id = data.drone_id;
        if ((data as any).status !== undefined) result.current_status = (data as any).status as DroneRealTimeStatus;
        if ((data as any).current_status !== undefined) result.current_status = (data as any).current_status as DroneRealTimeStatus;
        if ((data as any).battery_level !== undefined) result.current_battery_level = (data as any).battery_level;
        if ((data as any).current_battery_level !== undefined) result.current_battery_level = (data as any).current_battery_level;
        if (data.signal_strength !== undefined) result.signal_strength = data.signal_strength;
        if ((data as any).altitude !== undefined) result.current_altitude = (data as any).altitude;
        if ((data as any).current_altitude !== undefined) result.current_altitude = (data as any).current_altitude;
        if ((data as any).speed !== undefined) result.current_speed = (data as any).speed;
        if ((data as any).current_speed !== undefined) result.current_speed = (data as any).current_speed;
        if ((data as any).heading !== undefined) result.current_heading = (data as any).heading;
        if ((data as any).current_heading !== undefined) result.current_heading = (data as any).current_heading;
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
    private convertToExternalAttributes = (modelData: any): ExternalAttributes => {
        return {
            id: modelData.id,
            drone_id: modelData.drone_id,
            current_battery_level: modelData.current_battery_level,
            current_status: modelData.current_status || DroneRealTimeStatus.IDLE,
            last_seen: modelData.last_seen,
            current_altitude: modelData.current_altitude,
            current_speed: modelData.current_speed,
            current_heading: modelData.current_heading,
            signal_strength: modelData.signal_strength,
            is_connected: modelData.is_connected,
            error_message: modelData.error_message,
            temperature: modelData.temperature,
            flight_time_today: modelData.flight_time_today || 0,
            createdAt: modelData.createdAt,
            updatedAt: modelData.updatedAt
        };
    }
}