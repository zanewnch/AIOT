/**
 * @fileoverview 無人機指令歷史歸檔 Service 介面定義
 *
 * 定義無人機指令歷史歸檔業務邏輯層的抽象介面，規範所有指令歷史歸檔相關的業務操作方法。
 * 遵循 Service Layer Pattern 設計模式，將業務邏輯與資料存取邏輯分離。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneCommandsArchiveAttributes, DroneCommandsArchiveCreationAttributes } from '../../models/drone/DroneCommandsArchiveModel.js';

/**
 * 無人機指令歷史歸檔 Service 介面
 *
 * 定義無人機指令歷史歸檔業務邏輯層的所有方法，包含資料驗證、業務規則和複雜查詢方法
 *
 * @interface IDroneCommandsArchiveService
 */
export interface IDroneCommandsArchiveService {
    /**
     * 取得所有指令歷史歸檔資料
     *
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    getAllCommandsArchive(limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據 ID 取得指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<DroneCommandsArchiveAttributes>} 指令歷史歸檔資料
     * @throws {Error} 當資料不存在時拋出錯誤
     */
    getCommandArchiveById(id: number): Promise<DroneCommandsArchiveAttributes>;

    /**
     * 創建新的指令歷史歸檔資料
     *
     * @param {DroneCommandsArchiveCreationAttributes} data - 要創建的歸檔資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 創建後的歸檔資料
     */
    createCommandArchive(data: DroneCommandsArchiveCreationAttributes): Promise<DroneCommandsArchiveAttributes>;

    /**
     * 更新指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @param {Partial<DroneCommandsArchiveAttributes>} data - 要更新的資料
     * @returns {Promise<DroneCommandsArchiveAttributes>} 更新後的歸檔資料
     * @throws {Error} 當資料不存在時拋出錯誤
     */
    updateCommandArchive(id: number, data: Partial<DroneCommandsArchiveAttributes>): Promise<DroneCommandsArchiveAttributes>;

    /**
     * 刪除指定指令歷史歸檔資料
     *
     * @param {number} id - 歸檔資料 ID
     * @returns {Promise<boolean>} 是否成功刪除
     */
    deleteCommandArchive(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 取得指令歷史歸檔資料
     *
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    getCommandArchivesByDroneId(droneId: number, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據時間範圍取得指令歷史歸檔資料
     *
     * @param {Date} startTime - 開始時間
     * @param {Date} endTime - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    getCommandArchivesByTimeRange(startTime: Date, endTime: Date, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據指令類型取得指令歷史歸檔資料
     *
     * @param {string} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    getCommandArchivesByType(commandType: string, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;

    /**
     * 根據指令狀態取得指令歷史歸檔資料
     *
     * @param {string} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandsArchiveAttributes[]>} 指令歷史歸檔資料陣列
     */
    getCommandArchivesByStatus(status: string, limit?: number): Promise<DroneCommandsArchiveAttributes[]>;
}