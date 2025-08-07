/**
 * @fileoverview 無人機指令歷史歸檔 Repository 介面定義
 *
 * 定義無人機指令歷史歸檔資料存取層的抽象介面，規範所有指令歷史歸檔相關的資料庫操作方法。
 * 遵循 Repository Pattern 設計模式，將資料存取邏輯與業務邏輯分離。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneCommandsArchiveAttributes, DroneCommandsArchiveCreationAttributes } from '../../models/drone/DroneCommandsArchiveModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機指令歷史歸檔 Repository 介面
 *
 * 定義無人機指令歷史歸檔資料存取層的所有方法，包含基本的 CRUD 操作和特殊查詢方法
 *
 * @interface IDroneCommandsArchiveRepository
 */
export interface IDroneCommandsArchiveRepository {
    /**
     * 取得所有指令歷史歸檔資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    selectAll(limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據 ID 取得單筆指令歷史歸檔資料
     *
     * @param {number} id - 指令歷史歸檔資料 ID
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 指令歷史歸檔資料或 null
     */
    selectById(id: number): Promise<DroneCommandsArchiveAttributes | null>;

    /**
     * 創建新的指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes} data - 要創建的歸檔資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 創建後的歸檔資料
     */
    insert(data: DroneCommandsArchiveCreationAttributes): Promise<DroneCommandsArchiveAttributes>;

    /**
     * 更新指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<DroneCommandsArchiveAttributes | null>} 更新後的歸檔資料或 null
     */
    update(id: number, data: Partial<DroneCommandsArchiveAttributes>): Promise<DroneCommandsArchiveAttributes | null>;

    /**
     * 刪除指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    delete(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 取得指令歷史歸檔資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    selectByDroneId(droneId: number, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據時間範圍取得指令歷史歸檔資料
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    selectByTimeRange(startTime: Date, endTime: Date, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據指令類型取得指令歷史歸檔資料
     *
     * @param {string} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    selectByCommandType(commandType: string, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據指令狀態取得指令歷史歸檔資料
     *
     * @param {string} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    selectByStatus(status: string, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;
}