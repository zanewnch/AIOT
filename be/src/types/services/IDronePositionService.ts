/**
 * @fileoverview 無人機位置服務介面定義
 * 
 * 定義無人機位置業務邏輯服務的標準介面，遵循依賴倒置原則。
 * 控制器依賴此介面而非具體實現，提高代碼的可測試性和可維護性。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DronePositionAttributes, DronePositionCreationAttributes } from '../../models/DronePositionModel.js';

/**
 * 無人機位置服務介面
 * 
 * 定義無人機位置業務邏輯的標準操作介面
 * 
 * @interface IDronePositionService
 */
export interface IDronePositionService {
    /**
     * 取得所有無人機位置資料
     * 
     * @returns {Promise<DronePositionAttributes[]>} 無人機位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getAllDronePositions(): Promise<DronePositionAttributes[]>;

    /**
     * 根據 ID 取得無人機位置資料
     * 
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<DronePositionAttributes>} 無人機位置資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    getDronePositionById(id: number): Promise<DronePositionAttributes>;

    /**
     * 建立新的無人機位置資料
     * 
     * @param {DronePositionCreationAttributes} data - 無人機位置建立資料
     * @returns {Promise<DronePositionAttributes>} 建立的無人機位置資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    createDronePosition(data: DronePositionCreationAttributes): Promise<DronePositionAttributes>;

    /**
     * 更新無人機位置資料
     * 
     * @param {number} id - 無人機位置資料 ID
     * @param {Partial<DronePositionCreationAttributes>} data - 更新資料
     * @returns {Promise<DronePositionAttributes>} 更新後的無人機位置資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    updateDronePosition(id: number, data: Partial<DronePositionCreationAttributes>): Promise<DronePositionAttributes>;

    /**
     * 刪除無人機位置資料
     * 
     * @param {number} id - 無人機位置資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    deleteDronePosition(id: number): Promise<void>;

    /**
     * 取得最新的無人機位置資料
     * 
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 最新的無人機位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getLatestDronePositions(limit?: number): Promise<DronePositionAttributes[]>;

    /**
     * 取得特定無人機的位置資料
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 10
     * @returns {Promise<DronePositionAttributes[]>} 特定無人機的位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getDronePositionsByDroneId(droneId: number, limit?: number): Promise<DronePositionAttributes[]>;
}