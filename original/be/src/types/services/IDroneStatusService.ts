/**
 * @fileoverview 無人機狀態服務介面定義
 *
 * 定義無人機狀態相關業務邏輯的抽象介面，規範服務層的所有方法。
 * 包含資料驗證、業務規則處理和錯誤處理的規範。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneStatusAttributes, DroneStatusCreationAttributes, DroneStatus } from '../../models/drone/DroneStatusModel.js';

/**
 * 無人機狀態服務介面
 *
 * 定義無人機狀態相關的業務邏輯方法，包含 CRUD 操作和特殊業務邏輯
 *
 * @interface IDroneStatusService
 */
export interface IDroneStatusService {
    /**
     * 取得所有無人機狀態資料
     *
     * @returns {Promise<DroneStatusAttributes[]>} 無人機狀態資料陣列
     * @throws {Error} 當資料取得失敗時
     */
    getAllDroneStatuses(): Promise<DroneStatusAttributes[]>;

    /**
     * 根據 ID 取得無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<DroneStatusAttributes>} 無人機狀態資料
     * @throws {Error} 當 ID 無效或資料不存在時
     */
    getDroneStatusById(id: number): Promise<DroneStatusAttributes>;

    /**
     * 根據無人機序號取得無人機狀態資料
     *
     * @param {string} droneSerial - 無人機序號
     * @returns {Promise<DroneStatusAttributes>} 無人機狀態資料
     * @throws {Error} 當序號無效或資料不存在時
     */
    getDroneStatusBySerial(droneSerial: string): Promise<DroneStatusAttributes>;

    /**
     * 建立新的無人機狀態資料
     *
     * @param {DroneStatusCreationAttributes} data - 無人機狀態建立資料
     * @returns {Promise<DroneStatusAttributes>} 建立的無人機狀態資料
     * @throws {Error} 當資料驗證失敗或建立失敗時
     */
    createDroneStatus(data: DroneStatusCreationAttributes): Promise<DroneStatusAttributes>;

    /**
     * 更新無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @param {Partial<DroneStatusCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneStatusAttributes>} 更新後的無人機狀態資料
     * @throws {Error} 當 ID 無效、資料驗證失敗或更新失敗時
     */
    updateDroneStatus(id: number, data: Partial<DroneStatusCreationAttributes>): Promise<DroneStatusAttributes>;

    /**
     * 刪除無人機狀態資料
     *
     * @param {number} id - 無人機狀態資料 ID
     * @returns {Promise<void>}
     * @throws {Error} 當 ID 無效或刪除失敗時
     */
    deleteDroneStatus(id: number): Promise<void>;

    /**
     * 根據狀態查詢無人機
     *
     * @param {DroneStatus} status - 無人機狀態
     * @returns {Promise<DroneStatusAttributes[]>} 指定狀態的無人機陣列
     * @throws {Error} 當狀態無效或查詢失敗時
     */
    getDronesByStatus(status: DroneStatus): Promise<DroneStatusAttributes[]>;

    /**
     * 根據擁有者 ID 查詢無人機
     *
     * @param {number} ownerUserId - 擁有者用戶 ID
     * @returns {Promise<DroneStatusAttributes[]>} 指定擁有者的無人機陣列
     * @throws {Error} 當用戶 ID 無效或查詢失敗時
     */
    getDronesByOwner(ownerUserId: number): Promise<DroneStatusAttributes[]>;

    /**
     * 根據製造商查詢無人機
     *
     * @param {string} manufacturer - 製造商名稱
     * @returns {Promise<DroneStatusAttributes[]>} 指定製造商的無人機陣列
     * @throws {Error} 當製造商名稱無效或查詢失敗時
     */
    getDronesByManufacturer(manufacturer: string): Promise<DroneStatusAttributes[]>;

    /**
     * 更新無人機狀態
     *
     * @param {number} id - 無人機 ID
     * @param {DroneStatus} status - 新狀態
     * @returns {Promise<DroneStatusAttributes>} 更新後的無人機資料
     * @throws {Error} 當 ID 或狀態無效、更新失敗時
     */
    updateDroneStatusOnly(id: number, status: DroneStatus): Promise<DroneStatusAttributes>;

    /**
     * 檢查無人機序號是否已存在
     *
     * @param {string} droneSerial - 無人機序號
     * @param {number} excludeId - 排除的 ID（用於更新時檢查）
     * @returns {Promise<boolean>} 是否已存在
     */
    isDroneSerialExists(droneSerial: string, excludeId?: number): Promise<boolean>;

    /**
     * 取得無人機狀態統計
     *
     * @returns {Promise<{[key in DroneStatus]: number}>} 各狀態的無人機數量統計
     */
    getDroneStatusStatistics(): Promise<{ [key in DroneStatus]: number }>;
}