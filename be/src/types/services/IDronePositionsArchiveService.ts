/**
 * @fileoverview 無人機位置歷史歸檔 Service 介面定義
 * 
 * 定義無人機位置歷史歸檔業務邏輯層的抽象介面，規範所有位置歷史歸檔相關的業務操作方法。
 * 遵循 Service Layer Pattern 設計模式，封裝業務邏輯和資料驗證。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes } from '../../models/DronePositionsArchiveModel.js';

/**
 * 軌跡統計資料介面
 * 
 * @interface TrajectoryStatistics
 */
export interface TrajectoryStatistics {
    /** 總位置點數 */
    totalPoints: number;
    /** 軌跡總距離（公尺） */
    totalDistance: number;
    /** 平均速度（m/s） */
    averageSpeed: number;
    /** 最大速度（m/s） */
    maxSpeed: number;
    /** 最小速度（m/s） */
    minSpeed: number;
    /** 最大高度（公尺） */
    maxAltitude: number;
    /** 最小高度（公尺） */
    minAltitude: number;
    /** 平均高度（公尺） */
    averageAltitude: number;
    /** 飛行時間（秒） */
    flightDuration: number;
    /** 起始時間 */
    startTime: Date;
    /** 結束時間 */
    endTime: Date;
}

/**
 * 電池使用統計資料介面
 * 
 * @interface BatteryUsageStatistics
 */
export interface BatteryUsageStatistics {
    /** 初始電量 */
    initialBattery: number;
    /** 最終電量 */
    finalBattery: number;
    /** 消耗電量 */
    batteryConsumed: number;
    /** 平均電量 */
    averageBattery: number;
    /** 低電量警告次數 */
    lowBatteryWarnings: number;
    /** 電量消耗率（%/小時） */
    consumptionRate: number;
}

/**
 * 位置分佈統計資料介面
 * 
 * @interface PositionDistributionStatistics
 */
export interface PositionDistributionStatistics {
    /** 地理邊界 */
    bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    /** 中心點 */
    center: {
        latitude: number;
        longitude: number;
    };
    /** 覆蓋區域（平方公尺） */
    coverageArea: number;
    /** 活動範圍半徑（公尺） */
    activityRadius: number;
}

/**
 * 歸檔批次統計資料介面
 * 
 * @interface ArchiveBatchStatistics
 */
export interface ArchiveBatchStatistics {
    /** 批次ID */
    batchId: string;
    /** 歸檔記錄數 */
    recordCount: number;
    /** 歸檔時間 */
    archivedAt: Date;
    /** 涉及無人機數量 */
    droneCount: number;
    /** 時間範圍 */
    timeRange: {
        start: Date;
        end: Date;
    };
}

/**
 * 無人機位置歷史歸檔 Service 介面
 * 
 * 定義無人機位置歷史歸檔業務邏輯層的所有方法，包含基本的 CRUD 操作、業務邏輯驗證和統計分析
 * 
 * @interface IDronePositionsArchiveService
 */
export interface IDronePositionsArchiveService {
    /**
     * 取得所有位置歷史歸檔資料
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 位置歷史歸檔資料陣列
     */
    getAllPositionArchives(limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據 ID 取得單筆位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    getPositionArchiveById(id: number): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 根據原始 ID 取得歸檔資料
     * 
     * @param {number} originalId - 原始資料表的 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    getPositionArchiveByOriginalId(originalId: number): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 建立新的位置歷史歸檔記錄
     * 
     * @param {DronePositionsArchiveCreationAttributes} data - 位置歷史歸檔建立資料
     * @returns {Promise<DronePositionsArchiveAttributes>} 建立的位置歷史歸檔資料
     */
    createPositionArchive(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveAttributes>;

    /**
     * 批量建立位置歷史歸檔記錄
     * 
     * @param {DronePositionsArchiveCreationAttributes[]} dataArray - 位置歷史歸檔建立資料陣列
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 建立的位置歷史歸檔資料陣列
     */
    bulkCreatePositionArchives(dataArray: DronePositionsArchiveCreationAttributes[]): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 更新位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @param {Partial<DronePositionsArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 更新後的位置歷史歸檔資料或 null
     */
    updatePositionArchive(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 刪除位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    deletePositionArchive(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定無人機的位置歷史歸檔陣列
     */
    getPositionArchivesByDroneId(droneId: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據時間範圍查詢位置歷史歸檔
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 500
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定時間範圍的位置歷史歸檔陣列
     */
    getPositionArchivesByTimeRange(startTime: Date, endTime: Date, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據歸檔批次 ID 查詢資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定批次的位置歷史歸檔陣列
     */
    getPositionArchivesByBatchId(batchId: string): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據歸檔時間範圍查詢資料
     * 
     * @param {Date} startDate - 開始歸檔時間
     * @param {Date} endDate - 結束歸檔時間
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定歸檔時間範圍的資料陣列
     */
    getPositionArchivesByArchivedDateRange(startDate: Date, endDate: Date, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據地理邊界查詢位置歷史歸檔
     * 
     * @param {number} minLat - 最小緯度
     * @param {number} maxLat - 最大緯度
     * @param {number} minLng - 最小經度
     * @param {number} maxLng - 最大經度
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定地理邊界內的位置歷史歸檔陣列
     */
    getPositionArchivesByGeoBounds(minLat: number, maxLat: number, minLng: number, maxLng: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據無人機和時間範圍查詢軌跡
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 1000
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 無人機軌跡資料陣列（按時間排序）
     */
    getTrajectoryByDroneAndTime(droneId: number, startTime: Date, endTime: Date, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據電池電量範圍查詢資料
     * 
     * @param {number} minBattery - 最小電池電量
     * @param {number} maxBattery - 最大電池電量
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定電池電量範圍的資料陣列
     */
    getPositionArchivesByBatteryRange(minBattery: number, maxBattery: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據飛行速度範圍查詢資料
     * 
     * @param {number} minSpeed - 最小速度
     * @param {number} maxSpeed - 最大速度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定速度範圍的資料陣列
     */
    getPositionArchivesBySpeedRange(minSpeed: number, maxSpeed: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據高度範圍查詢資料
     * 
     * @param {number} minAltitude - 最小高度
     * @param {number} maxAltitude - 最大高度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定高度範圍的資料陣列
     */
    getPositionArchivesByAltitudeRange(minAltitude: number, maxAltitude: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據溫度範圍查詢資料
     * 
     * @param {number} minTemp - 最小溫度
     * @param {number} maxTemp - 最大溫度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定溫度範圍的資料陣列
     */
    getPositionArchivesByTemperatureRange(minTemp: number, maxTemp: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 取得最新的歷史歸檔記錄
     * 
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 最新的歷史歸檔記錄陣列
     */
    getLatestPositionArchives(limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 最新的歷史歸檔記錄或 null
     */
    getLatestPositionArchiveByDroneId(droneId: number): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 統計總記錄數
     * 
     * @returns {Promise<number>} 總記錄數
     */
    getTotalArchiveCount(): Promise<number>;

    /**
     * 根據無人機 ID 統計記錄數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的記錄數
     */
    getArchiveCountByDroneId(droneId: number): Promise<number>;

    /**
     * 根據時間範圍統計記錄數
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<number>} 指定時間範圍的記錄數
     */
    getArchiveCountByTimeRange(startTime: Date, endTime: Date): Promise<number>;

    /**
     * 根據歸檔批次統計記錄數
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 指定批次的記錄數
     */
    getArchiveCountByBatchId(batchId: string): Promise<number>;

    /**
     * 刪除指定時間之前的歸檔資料
     * 
     * @param {Date} beforeDate - 刪除此時間之前的資料
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteArchivesBeforeDate(beforeDate: Date): Promise<number>;

    /**
     * 刪除指定批次的歸檔資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteArchiveBatch(batchId: string): Promise<number>;

    /**
     * 驗證位置座標有效性
     * 
     * @param {number} latitude - 緯度
     * @param {number} longitude - 經度
     * @returns {Promise<boolean>} 是否有效
     */
    validateCoordinates(latitude: number, longitude: number): Promise<boolean>;

    /**
     * 驗證時間範圍有效性
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<boolean>} 是否有效
     */
    validateTimeRange(startTime: Date, endTime: Date): Promise<boolean>;

    /**
     * 驗證歸檔資料完整性
     * 
     * @param {DronePositionsArchiveCreationAttributes} data - 歸檔資料
     * @returns {Promise<boolean>} 是否完整
     */
    validateArchiveData(data: DronePositionsArchiveCreationAttributes): Promise<boolean>;

    /**
     * 計算軌跡統計資料
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<TrajectoryStatistics>} 軌跡統計資料
     */
    calculateTrajectoryStatistics(droneId: number, startTime: Date, endTime: Date): Promise<TrajectoryStatistics>;

    /**
     * 計算電池使用統計資料
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<BatteryUsageStatistics>} 電池使用統計資料
     */
    calculateBatteryUsageStatistics(droneId: number, startTime: Date, endTime: Date): Promise<BatteryUsageStatistics>;

    /**
     * 計算位置分佈統計資料
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<PositionDistributionStatistics>} 位置分佈統計資料
     */
    calculatePositionDistributionStatistics(droneId: number, startTime: Date, endTime: Date): Promise<PositionDistributionStatistics>;

    /**
     * 取得歸檔批次統計資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<ArchiveBatchStatistics>} 歸檔批次統計資料
     */
    getArchiveBatchStatistics(batchId: string): Promise<ArchiveBatchStatistics>;

    /**
     * 分析飛行模式
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<string[]>} 飛行模式陣列
     */
    analyzeFlightPatterns(droneId: number, startTime: Date, endTime: Date): Promise<string[]>;

    /**
     * 檢測異常位置資料
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 異常位置資料陣列
     */
    detectAnomalousPositions(droneId: number, startTime: Date, endTime: Date): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 產生軌跡摘要報告
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<object>} 軌跡摘要報告
     */
    generateTrajectorySummaryReport(droneId: number, startTime: Date, endTime: Date): Promise<object>;
}