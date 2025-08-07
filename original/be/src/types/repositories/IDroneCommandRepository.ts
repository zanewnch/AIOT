/**
 * @fileoverview 無人機指令 Repository 介面定義
 * 
 * 定義無人機指令資料存取層的抽象介面，規範所有無人機指令相關的資料庫操作方法。
 * 遵循 Repository Pattern 設計模式，將資料存取邏輯與業務邏輯分離。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneCommandAttributes, DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/drone/DroneCommandModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機指令 Repository 介面
 * 
 * 定義無人機指令資料存取層的所有方法，包含基本的 CRUD 操作和特殊查詢方法
 * 
 * @interface IDroneCommandRepository
 */
export interface IDroneCommandRepository {
    /**
     * 取得所有無人機指令
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 無人機指令陣列
     */
    selectAll(limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得分頁無人機指令
     * 
     * @param {PaginationParams} params - 分頁參數
     * @returns {Promise<PaginatedResponse<DroneCommandAttributes>>} 分頁無人機指令資料
     */
    selectPagination(params: PaginationParams): Promise<PaginatedResponse<DroneCommandAttributes>>;

    /**
     * 根據 ID 取得單筆無人機指令
     * 
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 無人機指令或 null
     */
    findById(id: number): Promise<DroneCommandAttributes | null>;

    /**
     * 建立新的無人機指令記錄
     * 
     * @param {DroneCommandCreationAttributes} data - 無人機指令建立資料
     * @returns {Promise<DroneCommandAttributes>} 建立的無人機指令資料
     */
    create(data: DroneCommandCreationAttributes): Promise<DroneCommandAttributes>;

    /**
     * 批量建立無人機指令記錄
     * 
     * @param {DroneCommandCreationAttributes[]} dataArray - 無人機指令建立資料陣列
     * @returns {Promise<DroneCommandAttributes[]>} 建立的無人機指令資料陣列
     */
    bulkCreate(dataArray: DroneCommandCreationAttributes[]): Promise<DroneCommandAttributes[]>;

    /**
     * 更新無人機指令資料
     * 
     * @param {number} id - 無人機指令 ID
     * @param {Partial<DroneCommandCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的無人機指令資料或 null
     */
    update(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandAttributes | null>;

    /**
     * 刪除無人機指令資料
     * 
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    delete(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 查詢指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定無人機的指令陣列
     */
    findByDroneId(droneId: number, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據指令狀態查詢
     * 
     * @param {DroneCommandStatus} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定狀態的指令陣列
     */
    findByStatus(status: DroneCommandStatus, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據指令類型查詢
     * 
     * @param {DroneCommandType} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定類型的指令陣列
     */
    findByCommandType(commandType: DroneCommandType, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據發送者查詢指令
     * 
     * @param {number} issuedBy - 發送者 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定發送者的指令陣列
     */
    findByIssuedBy(issuedBy: number, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據時間範圍查詢指令
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 指定時間範圍的指令陣列
     */
    findByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據無人機 ID 和狀態查詢指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {DroneCommandStatus} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 符合條件的指令陣列
     */
    findByDroneIdAndStatus(droneId: number, status: DroneCommandStatus, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據無人機 ID 和指令類型查詢
     * 
     * @param {number} droneId - 無人機 ID
     * @param {DroneCommandType} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 符合條件的指令陣列
     */
    findByDroneIdAndCommandType(droneId: number, commandType: DroneCommandType, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得無人機的待執行指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes[]>} 待執行的指令陣列（按發送時間排序）
     */
    findPendingCommandsByDroneId(droneId: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得正在執行的指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 正在執行的指令或 null
     */
    findExecutingCommandByDroneId(droneId: number): Promise<DroneCommandAttributes | null>;

    /**
     * 取得最新的指令記錄
     * 
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneCommandAttributes[]>} 最新的指令記錄陣列
     */
    findLatest(limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得特定無人機的最新指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 最新的指令記錄或 null
     */
    findLatestByDroneId(droneId: number): Promise<DroneCommandAttributes | null>;

    /**
     * 取得失敗的指令
     * 
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 失敗的指令陣列
     */
    findFailedCommands(limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得超時的指令（發送後超過指定時間仍未執行）
     * 
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 超時的指令陣列
     */
    findTimeoutCommands(timeoutMinutes: number, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 統計總指令數
     * 
     * @returns {Promise<number>} 總指令數
     */
    count(): Promise<number>;

    /**
     * 根據無人機 ID 統計指令數
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<number>} 指定無人機的指令數
     */
    countByDroneId(droneId: number): Promise<number>;

    /**
     * 根據狀態統計指令數
     * 
     * @param {DroneCommandStatus} status - 指令狀態
     * @returns {Promise<number>} 指定狀態的指令數
     */
    countByStatus(status: DroneCommandStatus): Promise<number>;

    /**
     * 根據指令類型統計指令數
     * 
     * @param {DroneCommandType} commandType - 指令類型
     * @returns {Promise<number>} 指定類型的指令數
     */
    countByCommandType(commandType: DroneCommandType): Promise<number>;

    /**
     * 根據時間範圍統計指令數
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @returns {Promise<number>} 指定時間範圍的指令數
     */
    countByDateRange(startDate: Date, endDate: Date): Promise<number>;

    /**
     * 刪除指定時間之前的指令記錄
     * 
     * @param {Date} beforeDate - 刪除此時間之前的記錄
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteBeforeDate(beforeDate: Date): Promise<number>;

    /**
     * 刪除已完成的指令記錄
     * 
     * @param {Date} beforeDate - 刪除此時間之前完成的記錄
     * @returns {Promise<number>} 刪除的記錄數
     */
    deleteCompletedBefore(beforeDate: Date): Promise<number>;

    /**
     * 更新指令狀態
     * 
     * @param {number} id - 指令 ID
     * @param {DroneCommandStatus} status - 新狀態
     * @param {string} errorMessage - 錯誤訊息（可選）
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    updateStatus(id: number, status: DroneCommandStatus, errorMessage?: string): Promise<DroneCommandAttributes | null>;

    /**
     * 標記指令開始執行
     * 
     * @param {number} id - 指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    markAsExecuting(id: number): Promise<DroneCommandAttributes | null>;

    /**
     * 標記指令完成
     * 
     * @param {number} id - 指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    markAsCompleted(id: number): Promise<DroneCommandAttributes | null>;

    /**
     * 標記指令失敗
     * 
     * @param {number} id - 指令 ID
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的指令資料或 null
     */
    markAsFailed(id: number, errorMessage: string): Promise<DroneCommandAttributes | null>;
}