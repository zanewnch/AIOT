/**
 * @fileoverview 歸檔任務管理表模型
 * 
 * 本文件定義了歸檔任務管理系統的資料模型，
 * 用於管理和追蹤資料歸檔作業的執行狀態，包含位置、指令、狀態等各類資料歸檔任務。
 * 提供完整的歸檔任務監控和狀態追蹤功能，適用於自動化資料生命週期管理。
 * 
 * @module ArchiveTaskModel
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
    Default,      // 預設值裝飾器
    CreatedAt,    // 建立時間裝飾器
    UpdatedAt,    // 更新時間裝飾器
    Index,        // 索引裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

/**
 * 歸檔任務類型枚舉
 * 
 * 定義支援的歸檔任務類型
 * 
 * @enum {string}
 */
export enum ArchiveJobType {
    POSITIONS = 'positions',    // 位置資料歸檔
    COMMANDS = 'commands',      // 指令資料歸檔
    STATUS = 'status'           // 狀態資料歸檔
}

/**
 * 歸檔任務狀態枚舉
 * 
 * 定義歸檔任務的執行狀態
 * 
 * @enum {string}
 */
export enum ArchiveTaskStatus {
    PENDING = 'pending',       // 待執行
    RUNNING = 'running',       // 執行中
    COMPLETED = 'completed',   // 已完成
    FAILED = 'failed'          // 執行失敗
}

/**
 * 歸檔任務資料屬性介面
 * 
 * 定義歸檔任務的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface ArchiveTaskAttributes
 * @since 1.0.0
 */
export type ArchiveTaskAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 歸檔任務類型
     * @type {ArchiveJobType} 歸檔任務的類型（positions/commands/status）
     */
    job_type: ArchiveJobType;
    
    /** 
     * 目標資料表名稱
     * @type {string} 需要進行歸檔的來源資料表名稱
     */
    table_name: string;
    
    /** 
     * 歸檔表名稱
     * @type {string} 歸檔資料的目標表名稱
     */
    archive_table_name: string;
    
    /** 
     * 歸檔資料起始時間
     * @type {Date} 歸檔資料的時間範圍起始點
     */
    date_range_start: Date;
    
    /** 
     * 歸檔資料結束時間
     * @type {Date} 歸檔資料的時間範圍結束點
     */
    date_range_end: Date;
    
    /** 
     * 歸檔批次識別碼
     * @type {string} 歸檔作業的批次識別碼
     */
    batch_id: string;
    
    /** 
     * 總歸檔記錄數
     * @type {number} 需要歸檔的總記錄數量
     */
    total_records: number;
    
    /** 
     * 已歸檔記錄數
     * @type {number} 已成功歸檔的記錄數量
     */
    archived_records: number;
    
    /** 
     * 歸檔狀態
     * @type {ArchiveTaskStatus} 歸檔任務當前的執行狀態
     */
    status: ArchiveTaskStatus;
    
    /** 
     * 開始時間
     * @type {Date | null} 歸檔任務開始執行的時間戳記
     */
    started_at: Date | null;
    
    /** 
     * 完成時間
     * @type {Date | null} 歸檔任務完成的時間戳記
     */
    completed_at: Date | null;
    
    /** 
     * 錯誤訊息
     * @type {string | null} 歸檔任務失敗時的錯誤訊息
     */
    error_message: string | null;
    
    /** 
     * 創建者
     * @type {string} 創建歸檔任務的來源（system 或 user_id）
     */
    created_by: string;
    
    /** 
     * 建立時間
     * @type {Date} 歸檔任務記錄的建立時間戳記
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} 歸檔任務記錄的最後更新時間戳記
     */
    updatedAt: Date;
};

/**
 * 歸檔任務資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 ArchiveTaskAttributes 並將 id 設為可選屬性。
 * 
 * @interface ArchiveTaskCreationAttributes
 * @extends {Optional<ArchiveTaskAttributes, 'id'>}
 * @since 1.0.0
 */
export type ArchiveTaskCreationAttributes = Optional<ArchiveTaskAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 歸檔任務模型類別
 * 
 * 實作歸檔任務管理的 Sequelize 模型，提供歸檔任務建立、狀態追蹤和執行監控功能。
 * 此模型對應資料庫中的 archive_tasks 資料表，支援 CRUD 操作和自動時間戳記。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - job_type: 歸檔任務類型（ENUM, 必填）
 * - table_name: 目標資料表名稱（VARCHAR, 必填）
 * - archive_table_name: 歸檔表名稱（VARCHAR, 必填）
 * - date_range_start: 歸檔資料起始時間（DATETIME, 必填）
 * - date_range_end: 歸檔資料結束時間（DATETIME, 必填）
 * - batch_id: 歸檔批次識別碼（VARCHAR, 必填）
 * - total_records: 總歸檔記錄數（BIGINT, 預設0）
 * - archived_records: 已歸檔記錄數（BIGINT, 預設0）
 * - status: 歸檔狀態（ENUM, 預設pending）
 * - started_at: 開始時間（DATETIME, 可空）
 * - completed_at: 完成時間（DATETIME, 可空）
 * - error_message: 錯誤訊息（TEXT, 可空）
 * - created_by: 創建者（VARCHAR, 必填）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * @class ArchiveTaskModel
 * @extends {Model<ArchiveTaskAttributes, ArchiveTaskCreationAttributes>}
 * @implements {ArchiveTaskAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立位置資料歸檔任務
 * const positionArchiveTask = await ArchiveTaskModel.create({
 *   job_type: ArchiveJobType.POSITIONS,
 *   table_name: 'drone_positions',
 *   archive_table_name: 'drone_positions_archive',
 *   date_range_start: new Date('2025-07-01T00:00:00Z'),
 *   date_range_end: new Date('2025-07-28T23:59:59Z'),
 *   batch_id: 'POS_BATCH_20250729_001',
 *   total_records: 0,
 *   archived_records: 0,
 *   status: ArchiveTaskStatus.PENDING,
 *   started_at: null,
 *   completed_at: null,
 *   error_message: null,
 *   created_by: 'system'
 * });
 * 
 * // 建立指令資料歸檔任務
 * const commandArchiveTask = await ArchiveTaskModel.create({
 *   job_type: ArchiveJobType.COMMANDS,
 *   table_name: 'drone_commands',
 *   archive_table_name: 'drone_commands_archive',
 *   date_range_start: new Date('2025-07-25T00:00:00Z'),
 *   date_range_end: new Date('2025-07-27T23:59:59Z'),
 *   batch_id: 'CMD_BATCH_20250729_001',
 *   total_records: 0,
 *   archived_records: 0,
 *   status: ArchiveTaskStatus.PENDING,
 *   created_by: 'user_123'
 * });
 * 
 * // 查詢執行中的歸檔任務
 * const runningTasks = await ArchiveTaskModel.findAll({
 *   where: { status: ArchiveTaskStatus.RUNNING },
 *   order: [['started_at', 'ASC']]
 * });
 * 
 * // 更新任務狀態
 * await positionArchiveTask.update({
 *   status: ArchiveTaskStatus.RUNNING,
 *   started_at: new Date(),
 *   total_records: 5000
 * });
 * ```
 */
@Table({ 
    tableName: 'archive_tasks', 
    timestamps: true,  // 啟用自動時間戳記
    indexes: [
        // 為查詢效能建立複合索引
        { fields: ['status', 'job_type'] },
        { fields: ['batch_id'] },
        { fields: ['date_range_start', 'date_range_end'] },
        { fields: ['created_by'] },
        { fields: ['started_at'] },
        { fields: ['completed_at'] }
    ]
})
export class ArchiveTaskModel extends Model<ArchiveTaskAttributes, ArchiveTaskCreationAttributes> implements ArchiveTaskAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆歸檔任務記錄的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量歷史資料儲存。
     * 
     * @type {number}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 歸檔任務類型
     * 
     * 歸檔任務的類型，包含 positions（位置資料）、commands（指令資料）、
     * status（狀態資料）。
     * 
     * @type {ArchiveJobType}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Index                                                                      // 建立索引以提升查詢效能
    @Column(DataType.ENUM(...Object.values(ArchiveJobType)))                   // 定義為 ENUM 型態
    declare job_type: ArchiveJobType;

    /**
     * 目標資料表名稱
     * 
     * 需要進行歸檔的來源資料表名稱，如 drone_positions、drone_commands 等。
     * 
     * @type {string}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.STRING)  // 定義為 STRING 型態
    declare table_name: string;

    /**
     * 歸檔表名稱
     * 
     * 歸檔資料的目標表名稱，如 drone_positions_archive、drone_commands_archive 等。
     * 
     * @type {string}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.STRING)  // 定義為 STRING 型態
    declare archive_table_name: string;

    /**
     * 歸檔資料起始時間
     * 
     * 歸檔資料的時間範圍起始點，用於定義哪些資料需要被歸檔。
     * 
     * @type {Date}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升時間查詢效能
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare date_range_start: Date;

    /**
     * 歸檔資料結束時間
     * 
     * 歸檔資料的時間範圍結束點，與起始時間一起定義歸檔範圍。
     * 
     * @type {Date}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升時間查詢效能
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare date_range_end: Date;

    /**
     * 歸檔批次識別碼
     * 
     * 歸檔作業的批次識別碼，格式如 POS_BATCH_YYYYMMDD_NNN，用於追蹤相關資料。
     * 
     * @type {string}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升批次查詢效能
    @Column(DataType.STRING)  // 定義為 STRING 型態
    declare batch_id: string;

    /**
     * 總歸檔記錄數
     * 
     * 需要歸檔的總記錄數量，在任務開始時計算並設定。
     * 
     * @type {number}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Default(0)               // 設定預設值為 0
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態以支援大數量
    declare total_records: number;

    /**
     * 已歸檔記錄數
     * 
     * 已成功歸檔的記錄數量，用於追蹤歸檔進度。
     * 
     * @type {number}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Default(0)               // 設定預設值為 0
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態以支援大數量
    declare archived_records: number;

    /**
     * 歸檔狀態
     * 
     * 歸檔任務當前的執行狀態，包含 pending（待執行）、running（執行中）、
     * completed（已完成）、failed（執行失敗）。
     * 
     * @type {ArchiveTaskStatus}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Default(ArchiveTaskStatus.PENDING)                                         // 設定預設值為 pending
    @Index                                                                      // 建立索引以提升查詢效能
    @Column(DataType.ENUM(...Object.values(ArchiveTaskStatus)))                // 定義為 ENUM 型態
    declare status: ArchiveTaskStatus;

    /**
     * 開始時間
     * 
     * 歸檔任務開始執行的時間戳記，任務開始時設定。
     * 
     * @type {Date | null}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(true)          // 允許空值
    @Index                    // 建立索引以提升時間查詢效能
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare started_at: Date | null;

    /**
     * 完成時間
     * 
     * 歸檔任務完成的時間戳記，無論成功或失敗都會設定。
     * 
     * @type {Date | null}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(true)          // 允許空值
    @Index                    // 建立索引以提升時間查詢效能
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare completed_at: Date | null;

    /**
     * 錯誤訊息
     * 
     * 當歸檔任務失敗時記錄的錯誤訊息，用於故障診斷和問題分析。
     * 
     * @type {string | null}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.TEXT)     // 定義為 TEXT 型態以支援較長的錯誤訊息
    declare error_message: string | null;

    /**
     * 創建者
     * 
     * 創建歸檔任務的來源，可以是 'system'（系統自動創建）或具體的用戶ID。
     * 
     * @type {string}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升創建者查詢效能
    @Column(DataType.STRING)  // 定義為 STRING 型態
    declare created_by: string;

    /**
     * 建立時間
     * 
     * 歸檔任務記錄的建立時間戳記，由 Sequelize 自動管理。
     * 此欄位用於記錄何時將此任務寫入資料庫。
     * 
     * @type {Date}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     * 
     * 歸檔任務記錄的最後更新時間戳記，由 Sequelize 自動管理。
     * 當任務狀態發生變化時會自動更新此欄位。
     * 
     * @type {Date}
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;

    /**
     * 計算歸檔進度百分比
     * 
     * 計算當前歸檔任務的完成進度百分比。
     * 
     * @returns {number} 進度百分比（0-100）
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    getProgressPercentage(): number {
        if (this.total_records === 0) return 0;
        return Math.round((this.archived_records / this.total_records) * 100);
    }

    /**
     * 計算任務執行時間
     * 
     * 計算從開始到完成（或當前時間）的執行時間（毫秒）。
     * 
     * @returns {number | null} 執行時間（毫秒），未開始時返回 null
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    getExecutionTime(): number | null {
        if (!this.started_at) return null;
        const endTime = this.completed_at || new Date();
        return endTime.getTime() - this.started_at.getTime();
    }

    /**
     * 檢查任務是否已完成
     * 
     * 檢查任務是否處於完成狀態（completed 或 failed）。
     * 
     * @returns {boolean} 任務是否已完成
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    isCompleted(): boolean {
        return this.status === ArchiveTaskStatus.COMPLETED || this.status === ArchiveTaskStatus.FAILED;
    }

    /**
     * 檢查任務是否成功
     * 
     * 檢查任務是否成功完成。
     * 
     * @returns {boolean} 任務是否成功
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    isSuccessful(): boolean {
        return this.status === ArchiveTaskStatus.COMPLETED;
    }

    /**
     * 格式化任務摘要
     * 
     * 生成易讀的任務執行摘要。
     * 
     * @returns {string} 任務摘要
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    getSummary(): string {
        const typeMap = {
            [ArchiveJobType.POSITIONS]: '位置資料',
            [ArchiveJobType.COMMANDS]: '指令資料',
            [ArchiveJobType.STATUS]: '狀態資料'
        };
        
        const statusMap = {
            [ArchiveTaskStatus.PENDING]: '待執行',
            [ArchiveTaskStatus.RUNNING]: '執行中',
            [ArchiveTaskStatus.COMPLETED]: '已完成',
            [ArchiveTaskStatus.FAILED]: '執行失敗'
        };
        
        let summary = `${typeMap[this.job_type]}歸檔任務 - ${statusMap[this.status]}`;
        
        if (this.status === ArchiveTaskStatus.RUNNING || this.status === ArchiveTaskStatus.COMPLETED) {
            const progress = this.getProgressPercentage();
            summary += ` (進度: ${progress}% - ${this.archived_records}/${this.total_records})`;
        }
        
        const executionTime = this.getExecutionTime();
        if (executionTime && this.isCompleted()) {
            summary += ` (耗時: ${(executionTime / 1000).toFixed(1)}秒)`;
        }
        
        if (this.error_message) {
            summary += ` - 錯誤: ${this.error_message}`;
        }
        
        return summary;
    }

    /**
     * 更新任務進度
     * 
     * 更新歸檔任務的進度資訊。
     * 
     * @param {number} archivedCount - 新的已歸檔記錄數
     * @returns {Promise<ArchiveTaskModel>} 更新後的模型實例
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    async updateProgress(archivedCount: number): Promise<ArchiveTaskModel> {
        return await this.update({
            archived_records: archivedCount,
            status: archivedCount >= this.total_records ? 
                ArchiveTaskStatus.COMPLETED : 
                ArchiveTaskStatus.RUNNING
        });
    }

    /**
     * 標記任務為失敗
     * 
     * 將任務狀態標記為失敗並記錄錯誤訊息。
     * 
     * @param {string} errorMessage - 錯誤訊息
     * @returns {Promise<ArchiveTaskModel>} 更新後的模型實例
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    async markAsFailed(errorMessage: string): Promise<ArchiveTaskModel> {
        return await this.update({
            status: ArchiveTaskStatus.FAILED,
            completed_at: new Date(),
            error_message: errorMessage
        });
    }

    /**
     * 開始執行任務
     * 
     * 將任務狀態標記為執行中並設定開始時間。
     * 
     * @param {number} totalRecords - 總記錄數
     * @returns {Promise<ArchiveTaskModel>} 更新後的模型實例
     * @memberof ArchiveTaskModel
     * @since 1.0.0
     */
    async startExecution(totalRecords: number): Promise<ArchiveTaskModel> {
        return await this.update({
            status: ArchiveTaskStatus.RUNNING,
            started_at: new Date(),
            total_records: totalRecords
        });
    }
}