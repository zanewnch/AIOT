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

/**
 * 無人機即時狀態業務邏輯介面
 * 
 * 定義所有與無人機即時狀態相關的業務操作方法
 * 
 * @interface IDroneRealTimeStatusService
 */
export interface IDroneRealTimeStatusService {
    createRealTimeStatus(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel>;
    getRealTimeStatusById(id: number): Promise<DroneRealTimeStatusModel>;
    getRealTimeStatusByDroneId(droneId: number): Promise<DroneRealTimeStatusModel>;
    getAllRealTimeStatuses(): Promise<DroneRealTimeStatusModel[]>;
    getRealTimeStatusesByStatus(status: DroneRealTimeStatus): Promise<DroneRealTimeStatusModel[]>;
    getOnlineDrones(): Promise<DroneRealTimeStatusModel[]>;
    getOfflineDrones(thresholdMinutes?: number): Promise<DroneRealTimeStatusModel[]>;
    updateRealTimeStatus(id: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel>;
    updateRealTimeStatusByDroneId(droneId: number, data: Partial<DroneRealTimeStatusAttributes>): Promise<DroneRealTimeStatusModel>;
    deleteRealTimeStatus(id: number): Promise<boolean>;
    deleteRealTimeStatusByDroneId(droneId: number): Promise<boolean>;
    upsertRealTimeStatus(droneId: number, data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusModel>;
    updateHeartbeat(droneId: number): Promise<boolean>;
    getBatteryStatistics(): Promise<any>;
    getStatusStatistics(): Promise<any>;
    getDashboardSummary(): Promise<any>;
    checkLowBatteryDrones(threshold?: number): Promise<DroneRealTimeStatusModel[]>;
    markDroneOffline(droneId: number, errorMessage?: string): Promise<DroneRealTimeStatusModel>;
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
     * @returns Promise<DroneRealTimeStatusModel>
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

            const result = await this.repository.create(processedData);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`創建即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據 ID 獲取即時狀態記錄
     */
    async getRealTimeStatusById(id: number): Promise<DroneRealTimeStatusModel> {
        try {
            if (!id || id <= 0) {
                throw new Error('無效的記錄 ID');
            }

            const result = await this.repository.findById(id);
            if (!result) {
                throw new Error('即時狀態記錄不存在');
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`獲取即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據無人機 ID 獲取即時狀態記錄
     */
    async getRealTimeStatusByDroneId(droneId: number): Promise<DroneRealTimeStatusModel> {
        try {
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            const result = await this.repository.findByDroneId(droneId);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在');
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error); throw new Error(`獲取即時狀態記錄失敗: ${errorMessage}`);
        }
    }

    /**
     * 獲取所有即時狀態記錄
     */
    async getAllRealTimeStatuses(): Promise<DroneRealTimeStatusModel[]> {
        try {
            const result = await this.repository.findAll();
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error); throw new Error(`獲取即時狀態記錄列表失敗: ${errorMessage}`);
        }
    }

    /**
     * 根據狀態獲取即時狀態記錄
     */
    async getRealTimeStatusesByStatus(status: DroneRealTimeStatus): Promise<DroneRealTimeStatusModel[]> {
        try {
            if (!Object.values(DroneRealTimeStatus).includes(status)) {
                throw new Error('無效的狀態值');
            }

            const result = await this.repository.findByStatus(status);
            return result;
        } catch (error) {
            throw new Error(`獲取特定狀態的即時狀態記錄失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取所有在線的無人機
     */
    async getOnlineDrones(): Promise<DroneRealTimeStatusModel[]> {
        try {
            const result = await this.repository.findOnlineDrones();
            return result;
        } catch (error) {
            throw new Error(`獲取在線無人機列表失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取離線的無人機
     */
    async getOfflineDrones(thresholdMinutes: number = 5): Promise<DroneRealTimeStatusModel[]> {
        try {
            if (thresholdMinutes <= 0) {
                throw new Error('離線判定時間閾值必須大於 0');
            }

            const result = await this.repository.findOfflineDrones(thresholdMinutes);
            return result;
        } catch (error) {
            throw new Error(`獲取離線無人機列表失敗: ${error instanceof Error ? error.message : String(error)}`);
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
            const existingRecord = await this.repository.findById(id);
            if (!existingRecord) {
                throw new Error('即時狀態記錄不存在');
            }

            const result = await this.repository.updateById(id, data);
            if (!result) {
                throw new Error('更新即時狀態記錄失敗');
            }

            return result;
        } catch (error) {
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

            const result = await this.repository.updateByDroneId(droneId, data);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在或更新失敗');
            }

            return result;
        } catch (error) {
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

            const result = await this.repository.deleteById(id);
            if (!result) {
                throw new Error('即時狀態記錄不存在或刪除失敗');
            }

            return true;
        } catch (error) {
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

            const result = await this.repository.deleteByDroneId(droneId);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在或刪除失敗');
            }

            return true;
        } catch (error) {
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

            const result = await this.repository.upsertByDroneId(droneId, data);
            return result;
        } catch (error) {
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

            const result = await this.repository.updateLastSeen(droneId);
            return result;
        } catch (error) {
            throw new Error(`更新心跳包失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取電池統計資訊
     */
    async getBatteryStatistics(): Promise<any> {
        try {
            const result = await this.repository.getBatteryStatistics();
            return result;
        } catch (error) {
            throw new Error(`獲取電池統計資訊失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取狀態統計資訊
     */
    async getStatusStatistics(): Promise<any> {
        try {
            const result = await this.repository.getStatusStatistics();
            return result;
        } catch (error) {
            throw new Error(`獲取狀態統計資訊失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取儀表板摘要資訊
     */
    async getDashboardSummary(): Promise<any> {
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

            return summary;
        } catch (error) {
            throw new Error(`獲取儀表板摘要失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 檢查低電量無人機
     */
    async checkLowBatteryDrones(threshold: number = 20): Promise<DroneRealTimeStatusModel[]> {
        try {
            if (threshold <= 0 || threshold > 100) {
                throw new Error('電量閾值必須在 1-100 之間');
            }

            const allDrones = await this.repository.findAll();
            const lowBatteryDrones = allDrones.filter(drone => 
                drone.current_battery_level <= threshold
            );

            return lowBatteryDrones;
        } catch (error) {
            throw new Error(`檢查低電量無人機失敗: ${error instanceof Error ? error.message : String(error)}`);
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

            const result = await this.repository.updateByDroneId(droneId, updateData);
            if (!result) {
                throw new Error('該無人機的即時狀態記錄不存在');
            }

            return result;
        } catch (error) {
            throw new Error(`標記無人機離線狀態失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
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
}