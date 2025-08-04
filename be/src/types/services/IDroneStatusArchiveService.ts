/**
 * @fileoverview 無人機狀態歷史服務介面定義
 *
 * 定義無人機狀態變更歷史相關業務邏輯的抽象介面，規範服務層的所有方法。
 * 包含資料驗證、業務規則處理和錯誤處理的規範。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes } from '../../models/drone/DroneStatusArchiveModel.js';
import type { DroneStatus } from '../../models/drone/DroneStatusModel.js';

/**
 * 無人機狀態歷史服務介面
 *
 * 定義無人機狀態變更歷史相關的業務邏輯方法，包含 CRUD 操作和特殊業務邏輯
 *
 * @interface IDroneStatusArchiveService
 */
export interface IDroneStatusArchiveService {
    /**
     * 取得所有狀態歷史資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 狀態歷史資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getAllStatusArchives(limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據 ID 取得狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<DroneStatusArchiveAttributes>} 狀態歷史資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    getStatusArchiveById(id: number): Promise<DroneStatusArchiveAttributes>;

    /**
     * 建立新的狀態歷史記錄
     *
     * @param {DroneStatusArchiveCreationAttributes} data - 狀態歷史建立資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態歷史資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    createStatusArchive(data: DroneStatusArchiveCreationAttributes): Promise<DroneStatusArchiveAttributes>;

    /**
     * 更新狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @param {Partial<DroneStatusArchiveCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusArchiveAttributes>} 更新後的狀態歷史資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    updateStatusArchive(id: number, data: Partial<DroneStatusArchiveCreationAttributes>): Promise<DroneStatusArchiveAttributes>;

    /**
     * 刪除狀態歷史資料
     *
     * @param {number} id - 狀態歷史資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    deleteStatusArchive(id: number): Promise<void>;

    /**
     * 根據無人機 ID 查詢狀態歷史
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定無人機的狀態歷史陣列
     * @throws {Error} 當無人機 ID 無效或查詢失敗時
     */
    getStatusArchivesByDroneId(droneId: number, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據狀態查詢歷史記錄
     *
     * @param {DroneStatus} status - 無人機狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定狀態的歷史記錄陣列
     * @throws {Error} 當狀態無效或查詢失敗時
     */
    getStatusArchivesByStatus(status: DroneStatus, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據操作者查詢歷史記錄
     *
     * @param {number} createdBy - 操作者用戶 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定操作者的歷史記錄陣列
     * @throws {Error} 當用戶 ID 無效或查詢失敗時
     */
    getStatusArchivesByCreatedBy(createdBy: number, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據時間範圍查詢歷史記錄
     *
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 指定時間範圍的歷史記錄陣列
     * @throws {Error} 當時間範圍無效或查詢失敗時
     */
    getStatusArchivesByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 根據變更原因查詢歷史記錄
     *
     * @param {string} reason - 變更原因（支援模糊搜尋）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 包含指定原因的歷史記錄陣列
     * @throws {Error} 當原因字串無效或查詢失敗時
     */
    getStatusArchivesByReason(reason: string, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 取得最新的狀態變更記錄
     *
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 最新的狀態變更記錄陣列
     * @throws {Error} 當資料取得失敗時
     */
    getLatestStatusArchives(limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 取得特定無人機的最新狀態變更
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneStatusArchiveAttributes | null>} 最新的狀態變更記錄或 null
     * @throws {Error} 當無人機 ID 無效或查詢失敗時
     */
    getLatestStatusArchiveByDroneId(droneId: number): Promise<DroneStatusArchiveAttributes | null>;

    /**
     * 根據狀態轉換查詢歷史記錄
     *
     * @param {DroneStatus | null} fromStatus - 轉換前狀態
     * @param {DroneStatus} toStatus - 轉換後狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneStatusArchiveAttributes[]>} 符合狀態轉換的歷史記錄陣列
     * @throws {Error} 當狀態無效或查詢失敗時
     */
    getStatusArchivesByTransition(fromStatus: DroneStatus | null, toStatus: DroneStatus, limit?: number): Promise<DroneStatusArchiveAttributes[]>;

    /**
     * 記錄無人機狀態變更
     *
     * @param {number} droneId - 無人機 ID
     * @param {DroneStatus} newStatus - 新狀態
     * @param {DroneStatus | null} previousStatus - 前一狀態
     * @param {string} reason - 變更原因
     * @param {object} details - 詳細資訊（可選）
     * @param {number} createdBy - 操作者用戶 ID（可選）
     * @returns {Promise<DroneStatusArchiveAttributes>} 建立的狀態變更記錄
     * @throws {Error} 當參數無效或記錄失敗時
     */
    recordStatusChange(
        droneId: number,
        newStatus: DroneStatus,
        previousStatus: DroneStatus | null,
        reason: string,
        details?: object,
        createdBy?: number
    ): Promise<DroneStatusArchiveAttributes>;

    /**
     * 取得狀態變更統計
     *
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<{[key: string]: number}>} 狀態變更統計資料
     * @throws {Error} 當時間範圍無效或統計失敗時
     */
    getStatusChangeStatistics(startDate?: Date, endDate?: Date): Promise<{ [key: string]: number }>;

    /**
     * 取得無人機狀態變更趨勢分析
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} days - 分析天數，預設為 30
     * @returns {Promise<{date: string, changes: number}[]>} 狀態變更趨勢資料
     * @throws {Error} 當參數無效或分析失敗時
     */
    getStatusChangeTrend(droneId: number, days?: number): Promise<{ date: string, changes: number }[]>;

    /**
     * 檢查狀態變更的有效性
     *
     * @param {DroneStatus | null} fromStatus - 轉換前狀態
     * @param {DroneStatus} toStatus - 轉換後狀態
     * @returns {Promise<boolean>} 是否為有效的狀態轉換
     */
    isValidStatusTransition(fromStatus: DroneStatus | null, toStatus: DroneStatus): Promise<boolean>;

    /**
     * 取得無人機活動摘要
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} days - 分析天數，預設為 7
     * @returns {Promise<{totalChanges: number, mostCommonStatus: DroneStatus, lastChange: Date}>} 活動摘要
     * @throws {Error} 當參數無效或查詢失敗時
     */
    getDroneActivitySummary(droneId: number, days?: number): Promise<{
        totalChanges: number;
        mostCommonStatus: DroneStatus;
        lastChange: Date;
    }>;
}