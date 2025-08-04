/**
 * @fileoverview 無人機位置歷史歸檔 Repository 介面定義
 * 
 * 定義無人機位置歷史歸檔資料存取層的抽象介面，規範所有位置歷史歸檔相關的資料庫操作方法。
 * 遵循 Repository Pattern 設計模式，將資料存取邏輯與業務邏輯分離。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes } from '../../models/DronePositionsArchiveModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機位置歷史歸檔 Repository 介面
 * 
 * 定義無人機位置歷史歸檔資料存取層的所有方法，包含基本的 CRUD 操作和特殊查詢方法
 * 
 * @interface IDronePositionsArchiveRepository
 */
export interface IDronePositionsArchiveRepository {
    /**
     * 取得所有位置歷史歸檔資料
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 位置歷史歸檔資料陣列
     */
    selectAll(limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 取得分頁位置歷史歸檔資料
     * 
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DronePositionsArchiveAttributes>>} 分頁位置歷史歸檔資料
     */
    selectPagination(params: PaginationParams): Promise<PaginatedResponse<DronePositionsArchiveAttributes>>;

    /**
     * 根據 ID 取得單筆位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    findById(id: number): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 根據原始 ID 取得歸檔資料
     * 
     * @param {number} originalId - 原始資料表的 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 位置歷史歸檔資料或 null
     */
    findByOriginalId(originalId: number): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 建立新的位置歷史歸檔記錄
     * 
     * @param {DronePositionsArchiveCreationAttributes} data - 位置歷史歸檔建立資料
     * @returns {Promise<DronePositionsArchiveAttributes>} 建立的位置歷史歸檔資料
     */
    create(data: DronePositionsArchiveCreationAttributes): Promise<DronePositionsArchiveAttributes>;

    /**
     * 批量建立位置歷史歸檔記錄
     * 
     * @param {DronePositionsArchiveCreationAttributes[]} dataArray - 位置歷史歸檔建立資料陣列
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 建立的位置歷史歸檔資料陣列
     */
    bulkCreate(dataArray: DronePositionsArchiveCreationAttributes[]): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 更新位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @param {Partial<DronePositionsArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 更新後的位置歷史歸檔資料或 null
     */
    update(id: number, data: Partial<DronePositionsArchiveCreationAttributes>): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 刪除位置歷史歸檔資料
     * 
     * @param {number} id - 位置歷史歸檔資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定無人機的位置歷史歸檔陣列
     */
    findByDroneId(droneId: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據時間範圍查詢位置歷史歸檔
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 500
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定時間範圍的位置歷史歸檔陣列
     */
    findByTimeRange(startTime: Date, endTime: Date, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據歸檔批次 ID 查詢資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定批次的位置歷史歸檔陣列
     */
    findByBatchId(batchId: string): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據歸檔時間範圍查詢資料
     * 
     * @param {Date} startDate - 開始歸檔時間
     * @param {Date} endDate - 結束歸檔時間
     * @param {number} limit - 限制筆數，預設為 200
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定歸檔時間範圍的資料陣列
     */
    findByArchivedDateRange(startDate: Date, endDate: Date, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

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
    findByGeoBounds(minLat: number, maxLat: number, minLng: number, maxLng: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據無人機和時間範圍查詢軌跡
     * 
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 1000
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 無人機軌跡資料陣列（按時間排序）
     */
    findTrajectoryByDroneAndTime(droneId: number, startTime: Date, endTime: Date, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據電池電量範圍查詢資料
     * 
     * @param {number} minBattery - 最小電池電量
     * @param {number} maxBattery - 最大電池電量
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定電池電量範圍的資料陣列
     */
    findByBatteryRange(minBattery: number, maxBattery: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據飛行速度範圍查詢資料
     * 
     * @param {number} minSpeed - 最小速度
     * @param {number} maxSpeed - 最大速度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定速度範圍的資料陣列
     */
    findBySpeedRange(minSpeed: number, maxSpeed: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據高度範圍查詢資料
     * 
     * @param {number} minAltitude - 最小高度
     * @param {number} maxAltitude - 最大高度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定高度範圍的資料陣列
     */
    findByAltitudeRange(minAltitude: number, maxAltitude: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 根據溫度範圍查詢資料
     * 
     * @param {number} minTemp - 最小溫度
     * @param {number} maxTemp - 最大溫度
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 指定溫度範圍的資料陣列
     */
    findByTemperatureRange(minTemp: number, maxTemp: number, limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 取得最新的歷史歸檔記錄
     * 
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DronePositionsArchiveAttributes[]>} 最新的歷史歸檔記錄陣列
     */
    findLatest(limit?: number): Promise<DronePositionsArchiveAttributes[]>;

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DronePositionsArchiveAttributes | null>} 最新的歷史歸檔記錄或 null
     */
    findLatestByDroneId(droneId: number): Promise<DronePositionsArchiveAttributes | null>;

    /**
     * 統計總記錄數
     * 
     * @returns {Promise<number>} 總記錄數
     */
    count(): Promise<number>;

    /**
     * 根據無人機 ID 統計記錄數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的記錄數
     */
    countByDroneId(droneId: number): Promise<number>;

    /**
     * 根據時間範圍統計記錄數
     * 
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<number>} 指定時間範圍的記錄數
     */
    countByTimeRange(startTime: Date, endTime: Date): Promise<number>;

    /**
     * 根據歸檔批次統計記錄數
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 指定批次的記錄數
     */
    countByBatchId(batchId: string): Promise<number>;

    /**
     * 刪除指定時間之前的歸檔資料
     * 
     * @param {Date} beforeDate - 刪除此時間之前的資料
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteBeforeDate(beforeDate: Date): Promise<number>;

    /**
     * 刪除指定批次的歸檔資料
     * 
     * @param {string} batchId - 歸檔批次 ID
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteBatch(batchId: string): Promise<number>;
}