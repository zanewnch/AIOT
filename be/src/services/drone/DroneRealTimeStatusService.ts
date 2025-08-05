/**
 * @fileoverview 無人機即時狀態業務邏輯服務
 * 
 * 此文件實作無人機即時狀態的業務邏輯層，處理所有與即時狀態相關的業務規則。
 * 提供完整的狀態管理、監控和統計功能，確保資料驗證和業務邏輯的正確性。
 * 
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { 
    DroneRealTimeStatusRepository, 
    IDroneRealTimeStatusRepository 
} from '../../repo/drone/DroneRealTimeStatusRepo';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes,
    DroneRealTimeStatus
} from '../../models/drone/DroneRealTimeStatusModel';
import { ServiceResult } from '../../utils/ServiceResult';

/**
 * 無人機即時狀態業務邏輯介面
 * 
 * 定義所有與無人機即時狀態相關的業務操作方法
 * 
 * @interface IDroneRealTimeStatusService
 */
export interface IDroneRealTimeStatusService {
    createRealTimeStatus(data: DroneRealTimeStatusCreationAttributes): Promise<ServiceResult<DroneRealTimeStatusModel>>;
    getRealTimeStatusById(id: number): Promise<ServiceResult<DroneRealTimeStatusModel>>;
    getRealTimeStatusByDroneId(droneId: number): Promise<ServiceResult<DroneRealTimeStatusModel>>;
    getAllRealTimeStatuses(): Promise<ServiceResult<DroneRealTimeStatusModel[]>>;
    getRealTimeStatusesByStatus(status: DroneRealTimeStatus): Promise<ServiceResult<DroneRealTimeStatusModel[]>>;
    getOnlineDrones(): Promise<ServiceResult<DroneRealTimeStatusModel[]>>;
    getOfflineDrones(thresholdMinutes?: number): Promise<ServiceResult<DroneRealTimeStatusModel[]>>;
    updateRealTimeStatus(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<ServiceResult<DroneRealTimeStatusModel>>;
    updateRealTimeStatusByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<ServiceResult<DroneRealTimeStatusModel>>;
    deleteRealTimeStatus(id: number): Promise<ServiceResult<boolean>>;
    deleteRealTimeStatusByDroneId(droneId: number): Promise<ServiceResult<boolean>>;
    upsertRealTimeStatus(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<ServiceResult<DroneRealTimeStatusModel>>;
    updateHeartbeat(droneId: number): Promise<ServiceResult<boolean>>;
    getBatteryStatistics(): Promise<ServiceResult<any>>;
    getStatusStatistics(): Promise<ServiceResult<any>>;
    getDashboardSummary(): Promise<ServiceResult<any>>;
    checkLowBatteryDrones(threshold?: number): Promise<ServiceResult<DroneRealTimeStatusModel[]>>;
    markDroneOffline(droneId: number, errorMessage?: string): Promise<ServiceResult<DroneRealTimeStatusModel>>;
}

/**
 * 無人機即時狀態業務邏輯實作類別
 * 
 * 實作所有與無人機即時狀態相關的業務邏輯
 * 
 * @class DroneRealTimeStatusService
 * @implements {IDroneRealTimeStatusService}
 */
export class DroneRealTimeStatusService implements IDroneRealTimeStatusService {
    private repository: IDroneRealTimeStatusRepository;

    constructor(repository?: IDroneRealTimeStatusRepository) {
        this.repository = repository || new DroneRealTimeStatusRepository();
    }

    /**
     * 創建新的無人機即時狀態記錄
     * 
     * @param data - 即時狀態資料
     * @returns Promise<ServiceResult<DroneRealTimeStatusModel>>
     */
    async createRealTimeStatus(data: DroneRealTimeStatusCreationAttributes): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            // 驗證資料
            const validationResult = this.validateRealTimeStatusData(data);
            if (!validationResult.isSuccess) {
                return ServiceResult.failure(validationResult.message, 400);
            }

            // 設定預設值
            const processedData = {
                ...data,
                last_seen: new Date(),
                is_connected: true
            };

            const result = await this.repository.create(processedData);
            return ServiceResult.success(result, '即時狀態記錄創建成功');
        } catch (error) {
            return ServiceResult.failure(`創建即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 根據 ID 獲取即時狀態記錄
     */
    async getRealTimeStatusById(id: number): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            if (!id || id <= 0) {
                return ServiceResult.failure('無效的記錄 ID', 400);
            }

            const result = await this.repository.findById(id);
            if (!result) {
                return ServiceResult.failure('即時狀態記錄不存在', 404);
            }

            return ServiceResult.success(result, '即時狀態記錄獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 根據無人機 ID 獲取即時狀態記錄
     */
    async getRealTimeStatusByDroneId(droneId: number): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            if (!droneId || droneId <= 0) {
                return ServiceResult.failure('無效的無人機 ID', 400);
            }

            const result = await this.repository.findByDroneId(droneId);
            if (!result) {
                return ServiceResult.failure('該無人機的即時狀態記錄不存在', 404);
            }

            return ServiceResult.success(result, '即時狀態記錄獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 獲取所有即時狀態記錄
     */
    async getAllRealTimeStatuses(): Promise<ServiceResult<DroneRealTimeStatusModel[]>> {
        try {
            const result = await this.repository.findAll();
            return ServiceResult.success(result, '所有即時狀態記錄獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取即時狀態記錄列表失敗: ${error}`, 500);
        }
    }

    /**
     * 根據狀態獲取即時狀態記錄
     */
    async getRealTimeStatusesByStatus(status: DroneRealTimeStatus): Promise<ServiceResult<DroneRealTimeStatusModel[]>> {
        try {
            if (!Object.values(DroneRealTimeStatus).includes(status)) {
                return ServiceResult.failure('無效的狀態值', 400);
            }

            const result = await this.repository.findByStatus(status);
            return ServiceResult.success(result, `狀態為 ${status} 的即時狀態記錄獲取成功`);
        } catch (error) {
            return ServiceResult.failure(`獲取特定狀態的即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 獲取所有在線的無人機
     */
    async getOnlineDrones(): Promise<ServiceResult<DroneRealTimeStatusModel[]>> {
        try {
            const result = await this.repository.findOnlineDrones();
            return ServiceResult.success(result, '在線無人機列表獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取在線無人機列表失敗: ${error}`, 500);
        }
    }

    /**
     * 獲取離線的無人機
     */
    async getOfflineDrones(thresholdMinutes: number = 5): Promise<ServiceResult<DroneRealTimeStatusModel[]>> {
        try {
            if (thresholdMinutes <= 0) {
                return ServiceResult.failure('離線判定時間閾值必須大於 0', 400);
            }

            const result = await this.repository.findOfflineDrones(thresholdMinutes);
            return ServiceResult.success(result, '離線無人機列表獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取離線無人機列表失敗: ${error}`, 500);
        }
    }

    /**
     * 更新即時狀態記錄
     */
    async updateRealTimeStatus(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            if (!id || id <= 0) {
                return ServiceResult.failure('無效的記錄 ID', 400);
            }

            // 檢查記錄是否存在
            const existingRecord = await this.repository.findById(id);
            if (!existingRecord) {
                return ServiceResult.failure('即時狀態記錄不存在', 404);
            }

            const result = await this.repository.updateById(id, data);
            if (!result) {
                return ServiceResult.failure('更新即時狀態記錄失敗', 500);
            }

            return ServiceResult.success(result, '即時狀態記錄更新成功');
        } catch (error) {
            return ServiceResult.failure(`更新即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 根據無人機 ID 更新即時狀態記錄
     */
    async updateRealTimeStatusByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            if (!droneId || droneId <= 0) {
                return ServiceResult.failure('無效的無人機 ID', 400);
            }

            const result = await this.repository.updateByDroneId(droneId, data);
            if (!result) {
                return ServiceResult.failure('該無人機的即時狀態記錄不存在或更新失敗', 404);
            }

            return ServiceResult.success(result, '即時狀態記錄更新成功');
        } catch (error) {
            return ServiceResult.failure(`更新即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 刪除即時狀態記錄
     */
    async deleteRealTimeStatus(id: number): Promise<ServiceResult<boolean>> {
        try {
            if (!id || id <= 0) {
                return ServiceResult.failure('無效的記錄 ID', 400);
            }

            const result = await this.repository.deleteById(id);
            if (!result) {
                return ServiceResult.failure('即時狀態記錄不存在或刪除失敗', 404);
            }

            return ServiceResult.success(true, '即時狀態記錄刪除成功');
        } catch (error) {
            return ServiceResult.failure(`刪除即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     */
    async deleteRealTimeStatusByDroneId(droneId: number): Promise<ServiceResult<boolean>> {
        try {
            if (!droneId || droneId <= 0) {
                return ServiceResult.failure('無效的無人機 ID', 400);
            }

            const result = await this.repository.deleteByDroneId(droneId);
            if (!result) {
                return ServiceResult.failure('該無人機的即時狀態記錄不存在或刪除失敗', 404);
            }

            return ServiceResult.success(true, '即時狀態記錄刪除成功');
        } catch (error) {
            return ServiceResult.failure(`刪除即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * Upsert 即時狀態記錄
     */
    async upsertRealTimeStatus(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            if (!droneId || droneId <= 0) {
                return ServiceResult.failure('無效的無人機 ID', 400);
            }

            // 驗證資料
            const validationResult = this.validateRealTimeStatusData(data);
            if (!validationResult.isSuccess) {
                return ServiceResult.failure(validationResult.message, 400);
            }

            const result = await this.repository.upsertByDroneId(droneId, data);
            return ServiceResult.success(result, '即時狀態記錄更新/創建成功');
        } catch (error) {
            return ServiceResult.failure(`更新/創建即時狀態記錄失敗: ${error}`, 500);
        }
    }

    /**
     * 更新心跳包（最後連線時間）
     */
    async updateHeartbeat(droneId: number): Promise<ServiceResult<boolean>> {
        try {
            if (!droneId || droneId <= 0) {
                return ServiceResult.failure('無效的無人機 ID', 400);
            }

            const result = await this.repository.updateLastSeen(droneId);
            return ServiceResult.success(result, '心跳包更新成功');
        } catch (error) {
            return ServiceResult.failure(`更新心跳包失敗: ${error}`, 500);
        }
    }

    /**
     * 獲取電池統計資訊
     */
    async getBatteryStatistics(): Promise<ServiceResult<any>> {
        try {
            const result = await this.repository.getBatteryStatistics();
            return ServiceResult.success(result, '電池統計資訊獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取電池統計資訊失敗: ${error}`, 500);
        }
    }

    /**
     * 獲取狀態統計資訊
     */
    async getStatusStatistics(): Promise<ServiceResult<any>> {
        try {
            const result = await this.repository.getStatusStatistics();
            return ServiceResult.success(result, '狀態統計資訊獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取狀態統計資訊失敗: ${error}`, 500);
        }
    }

    /**
     * 獲取儀表板摘要資訊
     */
    async getDashboardSummary(): Promise<ServiceResult<any>> {
        try {
            const [onlineDrones, offlineDrones, batteryStats, statusStats] = await Promise.all([
                this.repository.findOnlineDrones(),
                this.repository.findOfflineDrones(),
                this.repository.getBatteryStatistics(),
                this.repository.getStatusStatistics()
            ]);

            const summary = {
                totalDrones: onlineDrones.length + offlineDrones.length,
                onlineCount: onlineDrones.length,
                offlineCount: offlineDrones.length,
                batteryStatistics: batteryStats,
                statusStatistics: statusStats,
                lastUpdated: new Date()
            };

            return ServiceResult.success(summary, '儀表板摘要獲取成功');
        } catch (error) {
            return ServiceResult.failure(`獲取儀表板摘要失敗: ${error}`, 500);
        }
    }

    /**
     * 檢查低電量無人機
     */
    async checkLowBatteryDrones(threshold: number = 20): Promise<ServiceResult<DroneRealTimeStatusModel[]>> {
        try {
            if (threshold <= 0 || threshold > 100) {
                return ServiceResult.failure('電量閾值必須在 1-100 之間', 400);
            }

            const allDrones = await this.repository.findAll();
            const lowBatteryDrones = allDrones.filter(drone => 
                drone.current_battery_level <= threshold
            );

            return ServiceResult.success(lowBatteryDrones, '低電量無人機檢查完成');
        } catch (error) {
            return ServiceResult.failure(`檢查低電量無人機失敗: ${error}`, 500);
        }
    }

    /**
     * 標記無人機為離線狀態
     */
    async markDroneOffline(droneId: number, errorMessage?: string): Promise<ServiceResult<DroneRealTimeStatusModel>> {
        try {
            if (!droneId || droneId <= 0) {
                return ServiceResult.failure('無效的無人機 ID', 400);
            }

            const updateData = {
                current_status: DroneRealTimeStatus.OFFLINE,
                is_connected: false,
                error_message: errorMessage || null
            };

            const result = await this.repository.updateByDroneId(droneId, updateData);
            if (!result) {
                return ServiceResult.failure('該無人機的即時狀態記錄不存在', 404);
            }

            return ServiceResult.success(result, '無人機已標記為離線狀態');
        } catch (error) {
            return ServiceResult.failure(`標記無人機離線狀態失敗: ${error}`, 500);
        }
    }

    /**
     * 驗證即時狀態資料
     * 
     * @private
     */
    private validateRealTimeStatusData(data: DroneRealTimeStatusCreationAttributes): ServiceResult<boolean> {
        if (!data.drone_id || data.drone_id <= 0) {
            return ServiceResult.failure('無效的無人機 ID');
        }

        if (data.current_battery_level !== undefined) {
            if (data.current_battery_level < 0 || data.current_battery_level > 100) {
                return ServiceResult.failure('電量百分比必須在 0-100 之間');
            }
        }

        if (data.current_status && !Object.values(DroneRealTimeStatus).includes(data.current_status)) {
            return ServiceResult.failure('無效的即時狀態值');
        }

        if (data.current_heading !== undefined && data.current_heading !== null) {
            if (data.current_heading < 0 || data.current_heading >= 360) {
                return ServiceResult.failure('航向角度必須在 0-359 度之間');
            }
        }

        return ServiceResult.success(true);
    }
}