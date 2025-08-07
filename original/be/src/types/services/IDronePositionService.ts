/**
 * @fileoverview 無人機位置服務介面定義 (已重構為 CQRS 模式)
 *
 * ⚠️ 注意：此介面已被重構為 CQRS 模式
 * 
 * 新的服務類別：
 * - DronePositionQueriesSvc: 處理所有查詢操作 
 * - DronePositionCommandsSvc: 處理所有命令操作
 * 
 * 建議使用新的服務類別而不是此統一介面
 *
 * @deprecated 請使用 DronePositionQueriesSvc 和 DronePositionCommandsSvc
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DronePositionAttributes, DronePositionCreationAttributes } from '../../models/drone/DronePositionModel.js';

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

    /**
     * 取得特定無人機的最新位置
     *
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DronePositionAttributes | null>} 最新的位置資料
     * @throws {Error} 當資料取得失敗時
     */
    getLatestDronePosition(droneId: number): Promise<DronePositionAttributes | null>;

    /**
     * 根據時間範圍取得無人機位置
     *
     * @param {number} droneId - 無人機 ID
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @returns {Promise<DronePositionAttributes[]>} 時間範圍內的位置資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getDronePositionsByTimeRange(droneId: number, startTime: Date, endTime: Date): Promise<DronePositionAttributes[]>;

    /**
     * 批量創建無人機位置
     *
     * @param {DronePositionCreationAttributes[]} positions - 位置資料陣列
     * @returns {Promise<DronePositionAttributes[]>} 創建的位置資料陣列
     * @throws {Error} 當批量創建失敗時
     */
    createDronePositionsBatch(positions: DronePositionCreationAttributes[]): Promise<DronePositionAttributes[]>;
}