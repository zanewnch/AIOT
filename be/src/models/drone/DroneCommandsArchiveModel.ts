/**
 * @fileoverview 無人機指令歷史歸檔表模型
 *
 * 本文件定義了無人機指令歷史歸檔系統的資料模型，
 * 用於長期儲存無人機的歷史指令資料，包含完整的指令執行記錄和結果。
 * 提供指令歷史管理和執行分析功能，適用於無人機操作記錄保存和性能分析。
 *
 * @module DroneCommandsArchiveModel
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

// 引入 Sequelize TypeScript 裝飾器和模型相關功能
import {
    Table,        // 資料表定義裝飾器
    Column,       // 欄位定義裝飾器
    Model,        // 基礎模型類別
    DataType,     // 資料型態定義
    PrimaryKey,   // 主鍵裝飾器
    AutoIncrement, // 自動遞增裝飾器
    AllowNull,    // 允許空值設定裝飾器
    ForeignKey,   // 外鍵裝飾器
    BelongsTo,    // 關聯裝飾器
    Index,        // 索引裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

// 引入相關模型和枚舉
import { DroneStatusModel } from './DroneStatusModel.js';
import { DroneCommandType, DroneCommandStatus } from './DroneCommandModel.js';

/**
 * 無人機指令歷史歸檔資料屬性介面
 *
 * 定義無人機指令歷史歸檔資料的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 *
 * @interface DroneCommandsArchiveAttributes
 * @since 1.0.0
 */
export type DroneCommandsArchiveAttributes = {
    /**
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;

    /**
     * 原始資料表的 ID
     * @type {number} 保留對原始 drone_commands 表記錄的追蹤
     */
    original_id: number;

    /**
     * 無人機外鍵
     * @type {number} 關聯到 drones_status 表的外鍵
     */
    drone_id: number;

    /**
     * 指令類型
     * @type {DroneCommandType} 指令的類型（起飛、降落、移動等）
     */
    command_type: DroneCommandType;

    /**
     * 指令參數
     * @type {object | null} JSON 格式的指令參數，根據指令類型包含不同參數
     */
    command_data: object | null;

    /**
     * 指令狀態
     * @type {DroneCommandStatus} 指令的執行狀態
     */
    status: DroneCommandStatus;

    /**
     * 發送者
     * @type {number} 發送指令的用戶ID，關聯到 users 表
     */
    issued_by: number;

    /**
     * 指令發送時間
     * @type {Date} 指令被發送的時間戳記
     */
    issued_at: Date;

    /**
     * 指令執行時間
     * @type {Date | null} 指令開始執行的時間戳記，未執行時為 null
     */
    executed_at: Date | null;

    /**
     * 指令完成時間
     * @type {Date | null} 指令完成的時間戳記，未完成時為 null
     */
    completed_at: Date | null;

    /**
     * 錯誤訊息
     * @type {string | null} 指令執行失敗時的錯誤訊息
     */
    error_message: string | null;

    /**
     * 歸檔時間
     * @type {Date} 指令資料被歸檔的時間戳記
     */
    archived_at: Date;

    /**
     * 歸檔批次識別碼
     * @type {string} 歸檔作業的批次識別碼，用於追蹤批次歸檔操作
     */
    archive_batch_id: string;

    /**
     * 原始記錄建立時間
     * @type {Date} 原始資料在 drone_commands 表中的建立時間
     */
    created_at: Date;
};

/**
 * 無人機指令歷史歸檔資料建立屬性介面
 *
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 DroneCommandsArchiveAttributes 並將 id 設為可選屬性。
 *
 * @interface DroneCommandsArchiveCreationAttributes
 * @extends {Optional<DroneCommandsArchiveAttributes, 'id'>}
 * @since 1.0.0
 */
export type DroneCommandsArchiveCreationAttributes = Optional<DroneCommandsArchiveAttributes, 'id'>;

/**
 * 無人機指令歷史歸檔模型類別
 *
 * 實作無人機指令歷史歸檔的 Sequelize 模型，提供歷史指令資料的長期儲存和查詢功能。
 * 此模型對應資料庫中的 drone_commands_archive 資料表，支援指令執行分析和性能統計。
 *
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - original_id: 原始資料ID（BIGINT, 必填）
 * - drone_id: 無人機外鍵（BIGINT, 必填）
 * - command_type: 指令類型（ENUM, 必填）
 * - command_data: 指令參數（JSON, 可空）
 * - status: 指令狀態（ENUM, 必填）
 * - issued_by: 發送者（BIGINT, 必填）
 * - issued_at: 指令發送時間（DATETIME, 必填）
 * - executed_at: 指令執行時間（DATETIME, 可空）
 * - completed_at: 指令完成時間（DATETIME, 可空）
 * - error_message: 錯誤訊息（TEXT, 可空）
 * - archived_at: 歸檔時間（DATETIME, 必填）
 * - archive_batch_id: 歸檔批次ID（VARCHAR, 必填）
 * - created_at: 原始建立時間（DATETIME, 必填）
 *
 * @class DroneCommandsArchiveModel
 * @extends {Model<DroneCommandsArchiveAttributes, DroneCommandsArchiveCreationAttributes>}
 * @implements {DroneCommandsArchiveAttributes}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // 歸檔指令資料
 * const archivedCommand = await DroneCommandsArchiveModel.create({
 *   original_id: 12345,
 *   drone_id: 1,
 *   command_type: DroneCommandType.TAKEOFF,
 *   command_data: { altitude: 50, speed: 2.5 },
 *   status: DroneCommandStatus.COMPLETED,
 *   issued_by: 1,
 *   issued_at: new Date('2025-07-29T08:10:00Z'),
 *   executed_at: new Date('2025-07-29T08:10:15Z'),
 *   completed_at: new Date('2025-07-29T08:10:45Z'),
 *   error_message: null,
 *   archived_at: new Date(),
 *   archive_batch_id: 'CMD_BATCH_20250729_001',
 *   created_at: new Date('2025-07-29T08:10:00Z')
 * });
 *
 * // 查詢特定時間範圍的指令歷史
 * const commandHistory = await DroneCommandsArchiveModel.findAll({
 *   where: {
 *     drone_id: 1,
 *     issued_at: {
 *       [Op.between]: [startDate, endDate]
 *     }
 *   },
 *   order: [['issued_at', 'ASC']]
 * });
 *
 * // 分析指令執行統計
 * const stats = await DroneCommandsArchiveModel.findAll({
 *   where: { archive_batch_id: 'CMD_BATCH_20250729_001' },
 *   attributes: [
 *     'command_type',
 *     'status',
 *     [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
 *     [sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(SECOND, executed_at, completed_at)')), 'avg_execution_time']
 *   ],
 *   group: ['command_type', 'status']
 * });
 * ```
 */
@Table({
    tableName: 'drone_commands_archive',
    timestamps: false,  // 不使用自動時間戳記，因為我們有自定義的時間欄位
    indexes: [
        // 為查詢效能建立複合索引
        { fields: ['drone_id', 'issued_at'] },
        { fields: ['command_type', 'status'] },
        { fields: ['archive_batch_id'] },
        { fields: ['archived_at'] },
        { fields: ['original_id'] },
        { fields: ['issued_by'] }
    ]
})
export class DroneCommandsArchiveModel extends Model<DroneCommandsArchiveAttributes, DroneCommandsArchiveCreationAttributes> implements DroneCommandsArchiveAttributes {
    /**
     * 主鍵識別碼
     *
     * 唯一識別每筆歸檔指令記錄的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量歷史資料儲存。
     *
     * @type {number}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 原始資料表的 ID
     *
     * 保留對原始 drone_commands 表記錄的追蹤，用於資料溯源和完整性檢查。
     *
     * @type {number}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升查詢效能
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare original_id: number;

    /**
     * 無人機外鍵
     *
     * 關聯到 drones_status 表的外鍵，標識此指令針對哪台無人機。
     *
     * @type {number}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @ForeignKey(() => DroneStatusModel) // 設定外鍵關聯
    @Index                    // 建立索引以提升查詢效能
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare drone_id: number;

    /**
     * 指令類型
     *
     * 指令的類型，包含 takeoff（起飛）、land（降落）、move（移動）、
     * hover（懸停）、return（返航）。
     *
     * @type {DroneCommandType}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Index                                                                      // 建立索引以提升查詢效能
    @Column(DataType.ENUM(...Object.values(DroneCommandType)))                 // 定義為 ENUM 型態
    declare command_type: DroneCommandType;

    /**
     * 指令參數
     *
     * JSON 格式的指令參數，根據不同指令類型包含不同的參數：
     * - takeoff: { altitude, speed }
     * - move: { latitude, longitude, altitude, speed }
     * - hover: { duration }
     * - land: { speed }
     * - return: { speed }
     *
     * @type {object | null}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.JSON)     // 定義為 JSON 型態
    declare command_data: object | null;

    /**
     * 指令狀態
     *
     * 指令的執行狀態，包含 pending（待執行）、executing（執行中）、
     * completed（已完成）、failed（執行失敗）。
     *
     * @type {DroneCommandStatus}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Index                                                                      // 建立索引以提升查詢效能
    @Column(DataType.ENUM(...Object.values(DroneCommandStatus)))               // 定義為 ENUM 型態
    declare status: DroneCommandStatus;

    /**
     * 發送者
     *
     * 發送指令的用戶ID，關聯到 users 表，用於追蹤指令的發起者。
     *
     * @type {number}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升用戶查詢效能
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare issued_by: number;

    /**
     * 指令發送時間
     *
     * 指令被發送到系統的時間戳記，用於指令排序和執行時間分析。
     *
     * @type {Date}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Index                     // 建立索引以提升時間查詢效能
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare issued_at: Date;

    /**
     * 指令執行時間
     *
     * 指令開始執行的時間戳記，未開始執行時為 null。
     * 用於計算指令的等待時間和執行延遲。
     *
     * @type {Date | null}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare executed_at: Date | null;

    /**
     * 指令完成時間
     *
     * 指令完成執行的時間戳記，未完成時為 null。
     * 用於計算指令的執行時間和系統性能分析。
     *
     * @type {Date | null}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare completed_at: Date | null;

    /**
     * 錯誤訊息
     *
     * 當指令執行失敗時記錄的錯誤訊息，用於故障診斷和問題分析。
     *
     * @type {string | null}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.TEXT)     // 定義為 TEXT 型態以支援較長的錯誤訊息
    declare error_message: string | null;

    /**
     * 歸檔時間
     *
     * 指令資料被歸檔的時間戳記，用於追蹤歸檔作業和資料生命週期管理。
     *
     * @type {Date}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升歸檔查詢效能
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare archived_at: Date;

    /**
     * 歸檔批次識別碼
     *
     * 歸檔作業的批次識別碼，用於追蹤和管理批次歸檔操作，格式如 CMD_BATCH_YYYYMMDD_NNN。
     *
     * @type {string}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升批次查詢效能
    @Column(DataType.STRING)  // 定義為 STRING 型態
    declare archive_batch_id: string;

    /**
     * 原始記錄建立時間
     *
     * 原始資料在 drone_commands 表中的建立時間，保持資料的時間溯源。
     *
     * @type {Date}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare created_at: Date;

    /**
     * 關聯到無人機狀態表
     *
     * 建立與 DroneStatusModel 的多對一關聯關係。
     *
     * @type {DroneStatusModel}
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    @BelongsTo(() => DroneStatusModel)
    declare drone: DroneStatusModel;

    /**
     * 計算指令等待時間
     *
     * 計算從指令發送到開始執行的等待時間（毫秒）。
     *
     * @returns {number | null} 等待時間（毫秒），未執行時返回 null
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    getWaitTime(): number | null {
        if (!this.executed_at) return null;
        return this.executed_at.getTime() - this.issued_at.getTime();
    }

    /**
     * 計算指令執行時間
     *
     * 計算從開始執行到完成的執行時間（毫秒）。
     *
     * @returns {number | null} 執行時間（毫秒），未完成時返回 null
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    getExecutionTime(): number | null {
        if (!this.executed_at || !this.completed_at) return null;
        return this.completed_at.getTime() - this.executed_at.getTime();
    }

    /**
     * 計算指令總時間
     *
     * 計算從發送到完成的總時間（毫秒）。
     *
     * @returns {number | null} 總時間（毫秒），未完成時返回 null
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    getTotalTime(): number | null {
        if (!this.completed_at) return null;
        return this.completed_at.getTime() - this.issued_at.getTime();
    }

    /**
     * 檢查指令是否已完成
     *
     * 檢查指令是否處於完成狀態（completed 或 failed）。
     *
     * @returns {boolean} 指令是否已完成
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    isCompleted(): boolean {
        return this.status === DroneCommandStatus.COMPLETED || this.status === DroneCommandStatus.FAILED;
    }

    /**
     * 檢查指令是否成功
     *
     * 檢查指令是否成功完成。
     *
     * @returns {boolean} 指令是否成功
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    isSuccessful(): boolean {
        return this.status === DroneCommandStatus.COMPLETED;
    }

    /**
     * 獲取指令執行效率等級
     *
     * 根據執行時間評估指令執行效率。
     *
     * @returns {string} 效率等級：excellent/good/fair/poor
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    getEfficiencyRating(): string {
        const executionTime = this.getExecutionTime();
        if (!executionTime) return 'unknown';

        // 根據指令類型設定不同的效率標準（秒）
        const thresholds = {
            [DroneCommandType.TAKEOFF]: { excellent: 30, good: 60, fair: 120 },
            [DroneCommandType.LAND]: { excellent: 45, good: 90, fair: 180 },
            [DroneCommandType.MOVE]: { excellent: 60, good: 120, fair: 300 },
            [DroneCommandType.HOVER]: { excellent: 5, good: 10, fair: 20 },
            [DroneCommandType.RETURN]: { excellent: 120, good: 240, fair: 480 }
        };

        const threshold = thresholds[this.command_type];
        const timeInSeconds = executionTime / 1000;

        if (timeInSeconds <= threshold.excellent) return 'excellent';
        if (timeInSeconds <= threshold.good) return 'good';
        if (timeInSeconds <= threshold.fair) return 'fair';
        return 'poor';
    }

    /**
     * 格式化指令摘要
     *
     * 生成易讀的指令執行摘要。
     *
     * @returns {string} 指令摘要
     * @memberof DroneCommandsArchiveModel
     * @since 1.0.0
     */
    getSummary(): string {
        const typeMap = {
            [DroneCommandType.TAKEOFF]: '起飛',
            [DroneCommandType.LAND]: '降落',
            [DroneCommandType.MOVE]: '移動',
            [DroneCommandType.HOVER]: '懸停',
            [DroneCommandType.RETURN]: '返航'
        };

        const statusMap = {
            [DroneCommandStatus.PENDING]: '待執行',
            [DroneCommandStatus.EXECUTING]: '執行中',
            [DroneCommandStatus.COMPLETED]: '已完成',
            [DroneCommandStatus.FAILED]: '執行失敗'
        };

        let summary = `${typeMap[this.command_type]}指令 - ${statusMap[this.status]}`;

        const totalTime = this.getTotalTime();
        if (totalTime) {
            summary += ` (耗時: ${(totalTime / 1000).toFixed(1)}秒)`;
        }

        if (this.error_message) {
            summary += ` - 錯誤: ${this.error_message}`;
        }

        return summary;
    }
}