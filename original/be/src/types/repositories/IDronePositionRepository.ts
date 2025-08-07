/**
 * @fileoverview 無人機位置 Repository 介面定義
 *
 * 定義無人機位置資料存取層的介面，實現資料存取的抽象化。
 * 遵循 Repository Pattern，將業務邏輯與資料存取邏輯分離。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DronePositionAttributes, DronePositionCreationAttributes } from '../../models/drone/DronePositionModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機位置 Repository 介面
 *
 * 定義無人機位置資料的基本 CRUD 操作介面
 *
 * @interface IDronePositionRepository
 */
export interface IDronePositionRepository {
    /**
     * 取得所有無人機位置資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DronePositionAttributes[]>} 無人機位置資料陣列
     */
    selectAll(limit?: number): Promise<DronePositionAttributes[]>;

    /**
     * 取得分頁無人機位置資料
     *
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DronePositionAttributes>>} 分頁無人機位置資料
     */
    selectPagination(params: PaginationParams): Promise<PaginatedResponse<DronePositionAttributes>>;

    /**
     * 根據 ID 取得單筆無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<DronePositionAttributes | null>} 無人機位置資料或 null
     */
    findById(id: number): Promise<DronePositionAttributes | null>;

    /**
     * 建立新的無人機位置資料
     *
     * @param {DronePositionCreationAttributes} data - 無人機位置建立資料
     * @returns {Promise<DronePositionAttributes>} 建立的無人機位置資料
     */
    create(data: DronePositionCreationAttributes): Promise<DronePositionAttributes>;

    /**
     * 更新無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @param {Partial<DronePositionCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionAttributes | null>} 更新後的無人機位置資料或 null
     */
    update(id: number, data: Partial<DronePositionCreationAttributes>): Promise<DronePositionAttributes | null>;

    /**
     * 刪除無人機位置資料
     *
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete(id: number): Promise<boolean>;

    /**
     * 取得最新的無人機位置資料
     *
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 最新的無人機位置資料陣列
     */
    findLatest(limit?: number): Promise<DronePositionAttributes[]>;

    /**
     * 根據無人機 ID 取得位置資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 特定無人機的位置資料陣列
     */
    findByDroneId(droneId: number, limit?: number): Promise<DronePositionAttributes[]>;
}