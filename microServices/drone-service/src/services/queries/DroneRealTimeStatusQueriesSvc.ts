/**
 * @fileoverview 無人機即時狀態查詢 Service 實現
 *
 * 此文件實作了無人機即時狀態查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneRealTimeStatusQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { DroneRealTimeStatusQueriesRepo } from '../../repo/queries/DroneRealTimeStatusQueriesRepo.js';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatus,
    DroneRealTimeStatusAttributes
} from '../../models/DroneRealTimeStatusModel.js';
import type { 
    DroneRealTimeStatusAttributes as ExternalAttributesLocal,
    RealTimeStatusStatistics 
} from '../../types/services/IDroneRealTimeStatusService.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';
import { PaginationParams, PaginatedResult, PaginationUtils } from '../../types/PaginationTypes.js';

const logger = createLogger('DroneRealTimeStatusQueriesSvc');

/**
 * 外部屬性介面
 */
interface ExternalAttributesLocal {
  id: number;
  drone_id: number;
  status: string;
  battery_level: number;
  signal_strength?: number;
  altitude?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  temperature?: number;
  last_seen?: Date;
  is_connected?: boolean;
  error_message?: string;
  flight_time_today?: number;
}

/**
 * 無人機即時狀態查詢 Service 實現類別
 *
 * 專門處理無人機即時狀態相關的查詢請求，包含取得狀態資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneRealTimeStatusQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneRealTimeStatusQueriesSvc {
    private repo: DroneRealTimeStatusQueriesRepo;

    constructor(
        @inject(TYPES.DroneRealTimeStatusQueriesRepo) repo: DroneRealTimeStatusQueriesRepo
    ) {
        this.repo = repo;
    }

    /**
     * 根據 ID 獲取即時狀態記錄
     */
    getRealTimeStatusById = async (id: number): Promise<DroneRealTimeStatusModel> => {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的記錄 ID');
            }

            logger.info('Getting drone real-time status by ID', { id });
            const result = await this.repo.findById(id);
            if (!result) {
                throw new Error('即時狀態記錄不存在');
            }

            logger.info('Successfully retrieved drone real-time status', { id });
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`獲取即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據無人機 ID 獲取即時狀態記錄
     */
    getRealTimeStatusByDroneId = async (droneId: number): Promise<DroneRealTimeStatusModel> => {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Getting drone real-time status by drone ID', { droneId });
            const result = await this.repo.findByDroneId(droneId);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在');
            }

            logger.info('Successfully retrieved drone real-time status by drone ID', { droneId });
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`獲取即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 獲取所有即時狀態記錄（內部使用，有數量限制）
     * @private
     */
    private getAllRealTimeStatusesInternal = async (limit: number = 100): Promise<DroneRealTimeStatusModel[]> => {
        try {
            logger.info('Getting all drone real-time statuses (limited)');
            const result = await this.repo.findAll();
            
            // 應用限制以防止過大查詢
            const limitedResult = result.slice(0, limit);
            logger.info(`Retrieved ${limitedResult.length} drone real-time status records (limited to ${limit})`);
            return limitedResult;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`獲取即時狀態記錄列表失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據狀態獲取即時狀態記錄
     */
    getRealTimeStatusesByStatus = async (status: DroneRealTimeStatus): Promise<DroneRealTimeStatusModel[]> => {
        try {
            if (!Object.values(DroneRealTimeStatus).includes(status)) {
                throw new Error('無效的狀態值');
            }

            logger.info('Getting drone real-time statuses by status', { status });
            const result = await this.repo.findByStatus(status);
            
            logger.info(`Retrieved ${result.length} drone real-time status records with status ${status}`);
            return result;
        } catch (error) {
            throw new Error(`獲取特定狀態的即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取所有在線的無人機
     */
    getOnlineDrones = async (): Promise<DroneRealTimeStatusModel[]> => {
        try {
            logger.info('Getting online drones');
            const result = await this.repo.findOnlineDrones();
            
            logger.info(`Retrieved ${result.length} online drones`);
            return result;
        } catch (error) {
            throw new Error(`獲取在線無人機列表失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取離線的無人機
     */
    getOfflineDrones = async (thresholdMinutes: number = 5): Promise<DroneRealTimeStatusModel[]> => {
        try {
            if (thresholdMinutes <= 0) {
                throw new Error('離線判定時間閾值必須大於 0');
            }

            logger.info('Getting offline drones', { thresholdMinutes });
            const result = await this.repo.findOfflineDrones(thresholdMinutes);
            
            logger.info(`Retrieved ${result.length} offline drones`);
            return result;
        } catch (error) {
            throw new Error(`獲取離線無人機列表失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取電池統計資訊
     */
    getBatteryStatistics = async (): Promise<any> => {
        try {
            logger.info('Getting battery statistics');
            const result = await this.repo.getBatteryStatistics();
            
            logger.info('Successfully retrieved battery statistics');
            return result;
        } catch (error) {
            throw new Error(`獲取電池統計資訊失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取狀態統計資訊
     */
    getStatusStatistics = async (): Promise<any> => {
        try {
            logger.info('Getting status statistics');
            const result = await this.repo.getStatusStatistics();
            
            logger.info('Successfully retrieved status statistics');
            return result;
        } catch (error) {
            throw new Error(`獲取狀態統計資訊失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取儀表板摘要資訊
     */
    getDashboardSummary = async (): Promise<any> => {
        try {
            logger.info('Getting dashboard summary');
            
            const [onlineDrones, offlineDrones, batteryStats, statusStats] = await Promise.all([
                this.repo.findOnlineDrones(),
                this.repo.findOfflineDrones(),
                this.repo.getBatteryStatistics(),
                this.repo.getStatusStatistics()
            ]);

            const summary = {
                totalDrones: onlineDrones.length + offlineDrones.length,
                onlineCount: onlineDrones.length,
                offlineCount: offlineDrones.length,
                batteryStatistics: batteryStats,
                statusStatistics: statusStats,
                lastUpdated: new Date()
            };

            logger.info('Successfully retrieved dashboard summary', {
                totalDrones: summary.totalDrones,
                onlineCount: summary.onlineCount,
                offlineCount: summary.offlineCount
            });
            return summary;
        } catch (error) {
            throw new Error(`獲取儀表板摘要失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 檢查低電量無人機
     */
    checkLowBatteryDrones = async (threshold: number = 20): Promise<DroneRealTimeStatusModel[]> => {
        try {
            if (threshold <= 0 || threshold > 100) {
                throw new Error('電量閾值必須在 1-100 之間');
            }

            logger.info('Checking low battery drones', { threshold });
            const allDrones = await this.getAllRealTimeStatusesInternal();
            const lowBatteryDrones = allDrones.filter(drone => 
                drone.current_battery_level <= threshold
            );

            logger.info(`Found ${lowBatteryDrones.length} low battery drones with threshold ${threshold}%`);
            return lowBatteryDrones;
        } catch (error) {
            throw new Error(`檢查低電量無人機失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取所有無人機即時狀態（支持分頁）
     * 
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁無人機即時狀態結果
     */
    public async getAllDroneRealTimeStatuses(params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'DESC' }): Promise<PaginatedResult<DroneRealTimeStatusAttributes>> {
        try {
            logger.debug('Getting drone real-time statuses with pagination', params);

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'id',
                defaultSortOrder: 'DESC',
                allowedSortFields: ['id', 'drone_id', 'current_status', 'current_battery_level', 'last_seen', 'createdAt', 'updatedAt']
            });

            // 獲取所有數據（模擬，實際應該從資料庫分頁查詢）
            const allStatuses = await this.getAllRealTimeStatusesInternal();
            const total = allStatuses.length;

            // 手動分頁和排序（實際應該在資料庫層面完成）
            const sortedStatuses = [...allStatuses].sort((a, b) => {
                const field = validatedParams.sortBy as keyof DroneRealTimeStatusModel;
                const aValue = a[field];
                const bValue = b[field];
                
                let comparison = 0;
                if (aValue > bValue) comparison = 1;
                if (aValue < bValue) comparison = -1;
                
                return validatedParams.sortOrder === 'ASC' ? comparison : -comparison;
            });

            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            const paginatedStatuses = sortedStatuses.slice(offset, offset + validatedParams.pageSize);

            // 轉換為外部屬性格式
            const convertedStatuses = paginatedStatuses.map(status => this.convertToExternalAttributes(status.toJSON()));

            // 創建分頁結果
            const result = PaginationUtils.createPaginatedResult(
                convertedStatuses,
                total,
                validatedParams.page,
                validatedParams.pageSize
            );

            logger.info('Successfully fetched drone real-time statuses with pagination', {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error fetching drone real-time statuses with pagination:', error);
            throw new Error('Failed to fetch drone real-time statuses with pagination');
        }
    }

    getDroneRealTimeStatusById = async (id: number): Promise<DroneRealTimeStatusAttributes | null> => {
        return await this.getRealTimeStatusById(id);
    }

    getDroneRealTimeStatusByDroneId = async (droneId: number): Promise<DroneRealTimeStatusAttributes | null> => {
        try {
            const model = await this.getRealTimeStatusByDroneId(droneId);
            return this.convertToExternalAttributes(model.toJSON());
        } catch (error) {
            return null;
        }
    }

    getDroneRealTimeStatusesByStatus = async (status: string): Promise<DroneRealTimeStatusAttributes[]> => {
        const models = await this.getRealTimeStatusesByStatus(status as DroneRealTimeStatus);
        return models.map(model => this.convertToExternalAttributes(model.toJSON()));
    }

    getActiveDroneRealTimeStatuses = async (): Promise<DroneRealTimeStatusAttributes[]> => {
        const models = await this.getOnlineDrones();
        return models.map(model => this.convertToExternalAttributes(model.toJSON()));
    }

    /**
     * 轉換內部模型屬性到外部屬性
     * @private
     */
    private convertToExternalAttributes(modelData: any): ExternalAttributesLocal {
        return {
            id: modelData.id,
            drone_id: modelData.drone_id,
            status: modelData.current_status || 'idle',
            battery_level: modelData.current_battery_level,
            signal_strength: modelData.signal_strength,
            altitude: modelData.current_altitude,
            speed: modelData.current_speed,
            heading: modelData.current_heading,
            latitude: modelData.latitude || undefined,
            longitude: modelData.longitude || undefined,
            temperature: modelData.temperature,
            humidity: modelData.humidity || undefined,
            wind_speed: modelData.wind_speed || undefined,
            last_seen: modelData.last_seen,
            createdAt: modelData.createdAt,
            updatedAt: modelData.updatedAt
        };
    }

    getDroneRealTimeStatusStatistics = async (): Promise<RealTimeStatusStatistics> => {
        const [statusStats, batteryStats, onlineDrones, offlineDrones] = await Promise.all([
            this.getStatusStatistics(),
            this.getBatteryStatistics(),
            this.getOnlineDrones(),
            this.getOfflineDrones()
        ]);
        
        return {
            totalStatuses: onlineDrones.length + offlineDrones.length,
            activeStatuses: onlineDrones.length,
            offlineStatuses: offlineDrones.length,
            lowBatteryCount: batteryStats.lowBatteryCount || 0,
            averageBatteryLevel: batteryStats.averageBatteryLevel || 0,
            averageSignalStrength: batteryStats.averageSignalStrength || 0
        };
    }

    /**
     * 分頁查詢無人機即時狀態列表
     * 
     * @param params 分頁參數
     * @returns 分頁無人機即時狀態結果
     */
    public async getDroneRealTimeStatusesPaginated(params: any): Promise<any> {
        try {
            logger.debug('Getting drone real-time statuses with pagination', params);

            // 模擬分頁實現（實際應該在 repository 層實現）
            const allStatuses = await this.getAllRealTimeStatusesInternal();
            const total = allStatuses.length;

            const page = params.page || 1;
            const pageSize = params.pageSize || 10;
            const offset = (page - 1) * pageSize;
            
            const paginatedStatuses = allStatuses.slice(offset, offset + pageSize);
            const totalPages = Math.ceil(total / pageSize);

            const result = {
                data: paginatedStatuses,
                page,
                pageSize,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            };

            logger.info('Successfully fetched drone real-time statuses with pagination', {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error fetching drone real-time statuses with pagination:', error);
            throw new Error('Failed to fetch drone real-time statuses with pagination');
        }
    }
}