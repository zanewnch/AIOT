/**
 * @fileoverview 無人機狀態 Repository 介面定義
 *
 * 定義無人機狀態資料存取層的抽象介面，規範所有無人機狀態相關的資料庫操作方法。
 * 遵循 Repository Pattern 設計模式，將資料存取邏輯與業務邏輯分離。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneStatusAttributes, DroneStatusCreationAttributes, DroneStatus } from '../../models/drone/DroneStatusModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機狀態 Repository 介面
 *
 * 定義無人機狀態資料存取層的所有方法，包含基本的 CRUD 操作和特殊查詢方法
 *
 * @interface IDroneStatusRepository
 */
export interface IDroneStatusRepository {
    /**
     * 取得所有無人機狀態資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneStatusAttributes[]>} 無人機狀態資料陣列
     */
    selectAll(limit?: number): Promise<DroneStatusAttributes[]>;

    /**
     * 取得分頁無人機狀態資料
     *
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneStatusAttributes>>} 分頁無人機狀態資料
     */
    selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneStatusAttributes>>;

    /**
     * 根據 ID 取得單筆無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<DroneStatusAttributes | null>} 無人機狀態資料或 null
     */
    findById(id: number): Promise<DroneStatusAttributes | null>;

    /**
     * 根據無人機序號取得無人機狀態資料
     *
     * @param {string} droneSerial - 無人機序號
     * @returns {Promise<DroneStatusAttributes | null>} 無人機狀態資料或 null
     */
    findByDroneSerial(droneSerial: string): Promise<DroneStatusAttributes | null>;

    /**
     * 建立新的無人機狀態資料
     *
     * @param {DroneStatusCreationAttributes} data - 無人機狀態建立資料
     * @returns {Promise<DroneStatusAttributes>} 建立的無人機狀態資料
     */
    create(data: DroneStatusCreationAttributes): Promise<DroneStatusAttributes>;

    /**
     * 更新無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @param {Partial<DroneStatusCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusAttributes | null>} 更新後的無人機狀態資料或 null
     */
    update(id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusAttributes | null>;

    /**
     * 刪除無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete(id: number): Promise<boolean>;

    /**
     * 根據狀態查詢無人機
     *
     * @param {DroneStatus} status - 無人機狀態
     * @returns {Promise<DroneStatusAttributes[]>} 指定狀態的無人機陣列
     */
    findByStatus(status: DroneStatus): Promise<DroneStatusAttributes[]>;

    /**
     * 根據擁有者 ID 查詢無人機
     *
     * @param {number} ownerUserId - 擁有者用戶 ID
     * @returns {Promise<DroneStatusAttributes[]>} 指定擁有者的無人機陣列
     */
    findByOwner(ownerUserId: number): Promise<DroneStatusAttributes[]>;

    /**
     * 根據製造商查詢無人機
     *
     * @param {string} manufacturer - 製造商名稱
     * @returns {Promise<DroneStatusAttributes[]>} 指定製造商的無人機陣列
     */
    findByManufacturer(manufacturer: string): Promise<DroneStatusAttributes[]>;

    /**
     * 更新無人機狀態
     *
     * @param {number} id - 無人機 ID
     * @param {DroneStatus} status - 新狀態
     * @returns {Promise<DroneStatusAttributes | null>} 更新後的無人機資料或 null
     */
    updateStatus(id: number, status: DroneStatus): Promise<DroneStatusAttributes | null>;
}