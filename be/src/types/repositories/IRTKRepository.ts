/**
 * @fileoverview RTK Repository 介面定義
 * 
 * 定義 RTK 資料存取層的介面，實現資料存取的抽象化。
 * 遵循 Repository Pattern，將業務邏輯與資料存取邏輯分離。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { RTKAttributes, RTKCreationAttributes } from '../../models/RTKModel.js';

/**
 * RTK Repository 介面
 * 
 * 定義 RTK 資料的基本 CRUD 操作介面
 * 
 * @interface IRTKRepository
 */
export interface IRTKRepository {
    /**
     * 取得所有 RTK 資料
     * 
     * @returns {Promise<RTKAttributes[]>} RTK 資料陣列
     */
    findAll(): Promise<RTKAttributes[]>;

    /**
     * 根據 ID 取得單筆 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<RTKAttributes | null>} RTK 資料或 null
     */
    findById(id: number): Promise<RTKAttributes | null>;

    /**
     * 建立新的 RTK 資料
     * 
     * @param {RTKCreationAttributes} data - RTK 建立資料
     * @returns {Promise<RTKAttributes>} 建立的 RTK 資料
     */
    create(data: RTKCreationAttributes): Promise<RTKAttributes>;

    /**
     * 更新 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @param {Partial<RTKCreationAttributes>} data - 更新資料
     * @returns {Promise<RTKAttributes | null>} 更新後的 RTK 資料或 null
     */
    update(id: number, data: Partial<RTKCreationAttributes>): Promise<RTKAttributes | null>;

    /**
     * 刪除 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete(id: number): Promise<boolean>;

    /**
     * 取得最新的 RTK 資料
     * 
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<RTKAttributes[]>} 最新的 RTK 資料陣列
     */
    findLatest(limit?: number): Promise<RTKAttributes[]>;
}