/**
 * @fileoverview 無人機狀態歷史 Repository 介面定義
 *
 * 定義無人機狀態變更歷史資料存取層的抽象介面，規範所有狀態歷史相關的資料庫操作方法。
 * 遵循 Repository Pattern 設計模式，將資料存取邏輯與業務邏輯分離。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes } from '../../models/DroneStatusArchiveModel.js';
import type { DroneStatus } from '../../models/drone/DroneStatusModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機狀態歷史 Repository 介面
 *
 * 定義無人機狀態變更歷史資料存取層的所有方法，包含基本的 CRUD 操作和特殊查詢方法
 *
 * @interface IDroneStatusArchiveRepository
 */
export interface IDroneStatusArchiveRepository {
    /**
     * 取得所有無人機狀態歷史資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 狀態歷史資料陣列
     */
    selectAll(limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 取得分頁無人機狀態歷史資料
     *
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneStatusArchiveAttributes>>} 分頁狀態歷史資料
     */
    selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneStatusArchiveAttributes>>;

    /**
     * 根據 ID 取得單筆狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 狀態歷史資料或 null
     */
    findById(id: number): Promise<DroneStatusArchiveAttributes | null>;

    /**
     * 建立新的狀態歷史記錄
     *
     * @param {DroneStatusArchiveCreationAttributes} data - 狀態歷史建立資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態歷史資料
     */
    create(data: DroneStatusArchiveCreationAttributes): Promise<DroneStatusArchiveAttributes>;

    /**
     * 更新狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @param {Partial<DroneStatusArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 更新後的狀態歷史資料或 null
     */
    update(id: number, data: Partial<DroneStatusArchiveCreationAttributes>): Promise<DroneStatusArchiveAttributes | null>;

    /**
     * 刪除狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 查詢狀態歷史
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定無人機的狀態歷史陣列
     */
    findByDroneId(droneId: number, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據狀態查詢歷史記錄
     *
     * @param {DroneStatus} status - 無人機狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定狀態的歷史記錄陣列
     */
    findByStatus(status: DroneStatus, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據操作者查詢歷史記錄
     *
     * @param {number} createdBy - 操作者用戶 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定操作者的歷史記錄陣列
     */
    findByCreatedBy(createdBy: number, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據時間範圍查詢歷史記錄
     *
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定時間範圍的歷史記錄陣列
     */
    findByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據變更原因查詢歷史記錄
     *
     * @param {string} reason - 變更原因（支援模糊搜尋）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 包含指定原因的歷史記錄陣列
     */
    findByReason(reason: string, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 取得最新的狀態變更記錄
     *
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 最新的狀態變更記錄陣列
     */
    findLatest(limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 取得特定無人機的最新狀態變更
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 最新的狀態變更記錄或 null
     */
    findLatestByDroneId(droneId: number): Promise<DroneStatusArchiveAttributes | null>;

    /**
     * 根據狀態轉換查詢歷史記錄
     *
     * @param {DroneStatus | null} fromStatus - 轉換前狀態
     * @param {DroneStatus} toStatus - 轉換後狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 符合狀態轉換的歷史記錄陣列
     */
    findByStatusTransition(fromStatus: DroneStatus | null, toStatus: DroneStatus, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 取得狀態變更統計
     *
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<{[key: string]: number}>} 狀態變更統計資料
     */
    getStatusChangeStatistics(startDate?: Date, endDate?: Date): Promise<{ [key: string]: number }>;
}