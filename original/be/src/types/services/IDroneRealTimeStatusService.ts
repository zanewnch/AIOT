/**
 * @fileoverview 無人機即時狀態服務介面定義
 * 
 * 定義無人機即時狀態業務邏輯層的抽象介面，規範所有即時狀態管理相關的業務操作方法。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * 無人機即時狀態創建屬性介面
 */
export interface DroneRealTimeStatusCreationAttributes {
    drone_id: number;
    status: string;
    battery_level?: number;
    signal_strength?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    latitude?: number;
    longitude?: number;
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
    last_seen?: Date;
}

/**
 * 無人機即時狀態屬性介面
 */
export interface DroneRealTimeStatusAttributes extends DroneRealTimeStatusCreationAttributes {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 即時狀態統計資料介面
 */
export interface RealTimeStatusStatistics {
    totalStatuses: number;
    activeStatuses: number;
    offlineStatuses: number;
    lowBatteryCount: number;
    averageBatteryLevel: number;
    averageSignalStrength: number;
}

/**
 * 無人機即時狀態服務介面
 */
export interface IDroneRealTimeStatusService {
    /**
     * 取得所有即時狀態
     */
    getAllDroneRealTimeStatuses(): Promise<DroneRealTimeStatusAttributes[]>;

    /**
     * 根據 ID 取得即時狀態
     */
    getDroneRealTimeStatusById(id: number): Promise<DroneRealTimeStatusAttributes | null>;

    /**
     * 根據無人機 ID 取得即時狀態
     */
    getDroneRealTimeStatusByDroneId(droneId: number): Promise<DroneRealTimeStatusAttributes | null>;

    /**
     * 根據狀態取得即時狀態列表
     */
    getDroneRealTimeStatusesByStatus(status: string): Promise<DroneRealTimeStatusAttributes[]>;

    /**
     * 取得活躍中的即時狀態
     */
    getActiveDroneRealTimeStatuses(): Promise<DroneRealTimeStatusAttributes[]>;

    /**
     * 取得即時狀態統計
     */
    getDroneRealTimeStatusStatistics(): Promise<RealTimeStatusStatistics>;

    /**
     * 創建即時狀態
     */
    createDroneRealTimeStatus(data: DroneRealTimeStatusCreationAttributes): Promise<DroneRealTimeStatusAttributes>;

    /**
     * 更新即時狀態
     */
    updateDroneRealTimeStatus(id: number, data: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusAttributes | null>;

    /**
     * 刪除即時狀態
     */
    deleteDroneRealTimeStatus(id: number): Promise<number>;

    /**
     * 根據無人機 ID 更新即時狀態
     */
    updateDroneRealTimeStatusByDroneId(droneId: number, data: Partial<DroneRealTimeStatusCreationAttributes>): Promise<DroneRealTimeStatusAttributes | null>;

    /**
     * 批量更新即時狀態
     */
    updateDroneRealTimeStatusesBatch(updates: Array<{ droneId: number; statusData: Partial<DroneRealTimeStatusCreationAttributes> }>): Promise<DroneRealTimeStatusAttributes[]>;
}