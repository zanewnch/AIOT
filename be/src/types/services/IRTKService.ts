/**
 * @fileoverview RTK 服務介面定義
 * 
 * 定義 RTK 業務邏輯服務的標準介面，遵循依賴倒置原則。
 * 控制器依賴此介面而非具體實現，提高代碼的可測試性和可維護性。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { RTKAttributes, RTKCreationAttributes } from '../../models/RTKModel.js';

/**
 * RTK 服務介面
 * 
 * 定義 RTK 業務邏輯的標準操作介面
 * 
 * @interface IRTKService
 */
export interface IRTKService {
    /**
     * 取得所有 RTK 資料
     * 
     * @returns {Promise<RTKAttributes[]>} RTK 資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getAllRTKData(): Promise<RTKAttributes[]>;

    /**
     * 根據 ID 取得 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<RTKAttributes>} RTK 資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    getRTKDataById(id: number): Promise<RTKAttributes>;

    /**
     * 建立新的 RTK 資料
     * 
     * @param {RTKCreationAttributes} data - RTK 建立資料
     * @returns {Promise<RTKAttributes>} 建立的 RTK 資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    createRTKData(data: RTKCreationAttributes): Promise<RTKAttributes>;

    /**
     * 更新 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @param {Partial<RTKCreationAttributes>} data - 更新資料
     * @returns {Promise<RTKAttributes>} 更新後的 RTK 資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    updateRTKData(id: number, data: Partial<RTKCreationAttributes>): Promise<RTKAttributes>;

    /**
     * 刪除 RTK 資料
     * 
     * @param {number} id - RTK 資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    deleteRTKData(id: number): Promise<void>;

    /**
     * 取得最新的 RTK 資料
     * 
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<RTKAttributes[]>} 最新的 RTK 資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getLatestRTKData(limit?: number): Promise<RTKAttributes[]>;
}