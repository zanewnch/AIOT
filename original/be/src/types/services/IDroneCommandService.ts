/**
 * @fileoverview 無人機指令 Service 介面定義
 * 
 * 定義無人機指令業務邏輯層的抽象介面，規範所有無人機指令相關的業務操作方法。
 * 遵循 Service Layer Pattern 設計模式，封裝業務邏輯和資料驗證。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { DroneCommandAttributes, DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/drone/DroneCommandModel.js';

/**
 * 指令統計資料介面
 * 
 * @interface CommandStatistics
 */
export interface CommandStatistics {
    /** 總指令數 */
    totalCommands: number;
    /** 待執行指令數 */
    pendingCommands: number;
    /** 執行中指令數 */
    executingCommands: number;
    /** 已完成指令數 */
    completedCommands: number;
    /** 失敗指令數 */
    failedCommands: number;
    /** 成功率 */
    successRate: number;
    /** 平均執行時間（毫秒） */
    averageExecutionTime: number;
    /** 平均等待時間（毫秒） */
    averageWaitTime: number;
}

/**
 * 指令類型統計介面
 * 
 * @interface CommandTypeStatistics
 */
export interface CommandTypeStatistics {
    /** 指令類型 */
    commandType: DroneCommandType;
    /** 該類型指令數量 */
    count: number;
    /** 成功率 */
    successRate: number;
    /** 平均執行時間 */
    averageExecutionTime: number;
}

/**
 * 無人機指令執行摘要介面
 * 
 * @interface DroneCommandSummary
 */
export interface DroneCommandSummary {
    /** 無人機 ID */
    droneId: number;
    /** 總指令數 */
    totalCommands: number;
    /** 最近指令 */
    latestCommand: DroneCommandAttributes | null;
    /** 待執行指令數 */
    pendingCount: number;
    /** 執行中指令 */
    executingCommand: DroneCommandAttributes | null;
    /** 最近失敗指令 */
    latestFailedCommand: DroneCommandAttributes | null;
    /** 指令類型統計 */
    commandTypeStats: CommandTypeStatistics[];
}

/**
 * 指令執行結果介面
 * 
 * @interface CommandExecutionResult
 */
export interface CommandExecutionResult {
    /** 是否成功 */
    success: boolean;
    /** 指令資料 */
    command: DroneCommandAttributes;
    /** 訊息 */
    message: string;
    /** 錯誤訊息（如果失敗） */
    error?: string;
}

/**
 * 批次指令執行結果介面
 * 
 * @interface BatchCommandResult
 */
export interface BatchCommandResult {
    /** 成功的指令 */
    successful: DroneCommandAttributes[];
    /** 失敗的指令 */
    failed: Array<{
        command: DroneCommandCreationAttributes;
        error: string;
    }>;
    /** 總數 */
    total: number;
    /** 成功數 */
    successCount: number;
    /** 失敗數 */
    failedCount: number;
}

/**
 * 無人機指令 Service 介面
 * 
 * 定義無人機指令業務邏輯層的所有方法，包含基本的 CRUD 操作、業務邏輯驗證和指令管理
 * 
 * @interface IDroneCommandService
 */
export interface IDroneCommandService {
    /**
     * 取得所有無人機指令
     * 
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 無人機指令陣列
     */
    getAllCommands(limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據 ID 取得單筆無人機指令
     * 
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<DroneCommandAttributes | null>} 無人機指令或 null
     */
    getCommandById(id: number): Promise<DroneCommandAttributes | null>;

    /**
     * 建立新的無人機指令記錄
     * 
     * @param {DroneCommandCreationAttributes} data - 無人機指令建立資料
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    createCommand(data: DroneCommandCreationAttributes): Promise<CommandExecutionResult>;

    /**
     * 批量建立無人機指令記錄
     * 
     * @param {DroneCommandCreationAttributes[]} dataArray - 無人機指令建立資料陣列
     * @returns {Promise<BatchCommandResult>} 批次指令執行結果
     */
    createBatchCommands(dataArray: DroneCommandCreationAttributes[]): Promise<BatchCommandResult>;

    /**
     * 更新無人機指令資料
     * 
     * @param {number} id - 無人機指令 ID
     * @param {Partial<DroneCommandCreationAttributes>} data - 更新資料
     * @returns {Promise<DroneCommandAttributes | null>} 更新後的無人機指令資料或 null
     */
    updateCommand(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandAttributes | null>;

    /**
     * 刪除無人機指令資料
     * 
     * @param {number} id - 無人機指令 ID
     * @returns {Promise<boolean>} 是否刪除成功
     */
    deleteCommand(id: number): Promise<boolean>;

    /**
     * 根據無人機 ID 查詢指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定無人機的指令陣列
     */
    getCommandsByDroneId(droneId: number, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據指令狀態查詢
     * 
     * @param {DroneCommandStatus} status - 指令狀態
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定狀態的指令陣列
     */
    getCommandsByStatus(status: DroneCommandStatus, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據指令類型查詢
     * 
     * @param {DroneCommandType} commandType - 指令類型
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定類型的指令陣列
     */
    getCommandsByType(commandType: DroneCommandType, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據發送者查詢指令
     * 
     * @param {number} issuedBy - 發送者 ID
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 指定發送者的指令陣列
     */
    getCommandsByIssuedBy(issuedBy: number, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 根據時間範圍查詢指令
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {number} limit - 限制筆數，預設為 100
     * @returns {Promise<DroneCommandAttributes[]>} 指定時間範圍的指令陣列
     */
    getCommandsByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得無人機的待執行指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes[]>} 待執行的指令陣列（按發送時間排序）
     */
    getPendingCommandsByDroneId(droneId: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得正在執行的指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 正在執行的指令或 null
     */
    getExecutingCommandByDroneId(droneId: number): Promise<DroneCommandAttributes | null>;

    /**
     * 取得最新的指令記錄
     * 
     * @param {number} limit - 限制筆數，預設為 20
     * @returns {Promise<DroneCommandAttributes[]>} 最新的指令記錄陣列
     */
    getLatestCommands(limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得特定無人機的最新指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 最新的指令記錄或 null
     */
    getLatestCommandByDroneId(droneId: number): Promise<DroneCommandAttributes | null>;

    /**
     * 取得失敗的指令
     * 
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 失敗的指令陣列
     */
    getFailedCommands(limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得超時的指令
     * 
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @param {number} limit - 限制筆數，預設為 50
     * @returns {Promise<DroneCommandAttributes[]>} 超時的指令陣列
     */
    getTimeoutCommands(timeoutMinutes: number, limit?: number): Promise<DroneCommandAttributes[]>;

    /**
     * 取得指令統計資料
     * 
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<CommandStatistics>} 指令統計資料
     */
    getCommandStatistics(startDate?: Date, endDate?: Date): Promise<CommandStatistics>;

    /**
     * 取得指令類型統計
     * 
     * @param {Date} startDate - 開始時間（可選）
     * @param {Date} endDate - 結束時間（可選）
     * @returns {Promise<CommandTypeStatistics[]>} 指令類型統計陣列
     */
    getCommandTypeStatistics(startDate?: Date, endDate?: Date): Promise<CommandTypeStatistics[]>;

    /**
     * 取得無人機指令執行摘要
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandSummary>} 無人機指令執行摘要
     */
    getDroneCommandSummary(droneId: number): Promise<DroneCommandSummary>;

    /**
     * 發送起飛指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { altitude, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendTakeoffCommand(droneId: number, issuedBy: number, commandData: { altitude: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送降落指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendLandCommand(droneId: number, issuedBy: number, commandData?: { speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送移動指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { latitude, longitude, altitude, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendMoveCommand(droneId: number, issuedBy: number, commandData: { latitude: number; longitude: number; altitude: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送懸停指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { duration }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendHoverCommand(droneId: number, issuedBy: number, commandData?: { duration?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送返航指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendReturnCommand(droneId: number, issuedBy: number, commandData?: { speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送飛行到指定位置指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { latitude, longitude, altitude, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendFlyToCommand(droneId: number, issuedBy: number, commandData: { latitude: number; longitude: number; altitude: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送前進指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendMoveForwardCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送後退指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendMoveBackwardCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送左移指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendMoveLeftCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送右移指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { distance, speed }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendMoveRightCommand(droneId: number, issuedBy: number, commandData?: { distance?: number; speed?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送左轉指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { angle }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendRotateLeftCommand(droneId: number, issuedBy: number, commandData?: { angle?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送右轉指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { angle }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendRotateRightCommand(droneId: number, issuedBy: number, commandData?: { angle?: number }): Promise<CommandExecutionResult>;

    /**
     * 發送緊急指令
     * 
     * @param {number} droneId - 無人機 ID
     * @param {number} issuedBy - 發送者 ID
     * @param {object} commandData - 指令參數 { action }
     * @returns {Promise<CommandExecutionResult>} 指令執行結果
     */
    sendEmergencyCommand(droneId: number, issuedBy: number, commandData?: { action?: 'stop' | 'land' }): Promise<CommandExecutionResult>;

    /**
     * 執行指令（標記為執行中）
     * 
     * @param {number} commandId - 指令 ID
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    executeCommand(commandId: number): Promise<CommandExecutionResult>;

    /**
     * 完成指令
     * 
     * @param {number} commandId - 指令 ID
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    completeCommand(commandId: number): Promise<CommandExecutionResult>;

    /**
     * 標記指令失敗
     * 
     * @param {number} commandId - 指令 ID
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    failCommand(commandId: number, errorMessage: string): Promise<CommandExecutionResult>;

    /**
     * 取消待執行指令
     * 
     * @param {number} commandId - 指令 ID
     * @param {string} reason - 取消原因
     * @returns {Promise<CommandExecutionResult>} 執行結果
     */
    cancelCommand(commandId: number, reason: string): Promise<CommandExecutionResult>;

    /**
     * 驗證指令資料
     * 
     * @param {DroneCommandCreationAttributes} data - 指令資料
     * @returns {Promise<boolean>} 是否有效
     */
    validateCommandData(data: DroneCommandCreationAttributes): Promise<boolean>;

    /**
     * 驗證指令參數
     * 
     * @param {DroneCommandType} commandType - 指令類型
     * @param {object} commandData - 指令參數
     * @returns {Promise<boolean>} 是否有效
     */
    validateCommandParameters(commandType: DroneCommandType, commandData: any): Promise<boolean>;

    /**
     * 檢查無人機是否可以接收新指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<boolean>} 是否可以接收新指令
     */
    canReceiveNewCommand(droneId: number): Promise<boolean>;

    /**
     * 檢查指令衝突
     * 
     * @param {number} droneId - 無人機 ID
     * @param {DroneCommandType} commandType - 新指令類型
     * @returns {Promise<boolean>} 是否有衝突
     */
    checkCommandConflict(droneId: number, commandType: DroneCommandType): Promise<boolean>;

    /**
     * 處理超時指令
     * 
     * @param {number} timeoutMinutes - 超時時間（分鐘）
     * @returns {Promise<number>} 處理的指令數量
     */
    handleTimeoutCommands(timeoutMinutes: number): Promise<number>;

    /**
     * 清理舊指令記錄
     * 
     * @param {Date} beforeDate - 清理此時間之前的記錄
     * @param {boolean} onlyCompleted - 是否只清理已完成的指令
     * @returns {Promise<number>} 清理的記錄數
     */
    cleanupOldCommands(beforeDate: Date, onlyCompleted?: boolean): Promise<number>;

    /**
     * 取得下一個待執行指令
     * 
     * @param {number} droneId - 無人機 ID
     * @returns {Promise<DroneCommandAttributes | null>} 下一個待執行指令或 null
     */
    getNextPendingCommand(droneId: number): Promise<DroneCommandAttributes | null>;

    /**
     * 批量更新指令狀態
     * 
     * @param {number[]} commandIds - 指令 ID 陣列
     * @param {DroneCommandStatus} status - 新狀態
     * @param {string} errorMessage - 錯誤訊息（可選）
     * @returns {Promise<number>} 更新的指令數量
     */
    batchUpdateCommandStatus(commandIds: number[], status: DroneCommandStatus, errorMessage?: string): Promise<number>;

    /**
     * 重試失敗的指令
     * 
     * @param {number} commandId - 指令 ID
     * @param {number} issuedBy - 重試發起者 ID
     * @returns {Promise<CommandExecutionResult>} 重試結果
     */
    retryFailedCommand(commandId: number, issuedBy: number): Promise<CommandExecutionResult>;
}