/**
 * @fileoverview 無人機指令佇列表模型
 * 
 * 本文件定義了無人機指令佇列系統的資料模型，
 * 用於管理批次指令執行、條件式執行和智能衝突檢測功能。
 * 提供完整的佇列狀態追蹤和執行監控功能。
 * 
 * @module DroneCommandQueueModel
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
    CreatedAt,    // 建立時間裝飾器
    UpdatedAt,    // 更新時間裝飾器
    HasMany,      // 一對多關聯裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

// 引入相關模型
// 使用延遲載入避免循環引用

/**
 * 無人機指令佇列狀態枚舉
 * 
 * 定義佇列的執行狀態
 * 
 * @enum {string}
 */
export enum DroneCommandQueueStatus {
    PENDING = 'pending',       // 待執行
    RUNNING = 'running',       // 執行中
    PAUSED = 'paused',         // 已暫停
    COMPLETED = 'completed',   // 已完成
    FAILED = 'failed'          // 執行失敗
}

/**
 * 條件類型介面
 */
export interface CommandCondition {
    type: 'battery' | 'altitude' | 'time' | 'position';
    operator: '>=' | '<=' | '==' | '!=' | '>' | '<';
    value: number | string;
    unit?: string;
}

/**
 * 無人機指令佇列資料屬性介面
 * 
 * 定義無人機指令佇列的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DroneCommandQueueAttributes
 * @since 1.0.0
 */
export type DroneCommandQueueAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 佇列名稱
     * @type {string} 佇列的顯示名稱
     */
    name: string;
    
    /** 
     * 佇列狀態
     * @type {DroneCommandQueueStatus} 佇列當前的執行狀態
     */
    status: DroneCommandQueueStatus;
    
    /** 
     * 當前執行索引
     * @type {number} 當前正在執行或待執行的指令索引
     */
    current_index: number;
    
    /** 
     * 自動執行
     * @type {boolean} 是否自動執行佇列中的指令
     */
    auto_execute: boolean;
    
    /** 
     * 執行條件
     * @type {CommandCondition[] | null} 佇列執行的條件陣列
     */
    execution_conditions: CommandCondition[] | null;
    
    /** 
     * 迴圈計數
     * @type {number | null} 當前執行的迴圈次數
     */
    loop_count: number | null;
    
    /** 
     * 最大迴圈次數
     * @type {number | null} 佇列最大執行迴圈次數
     */
    max_loops: number | null;
    
    /** 
     * 建立者
     * @type {number} 建立佇列的用戶ID
     */
    created_by: number;
    
    /** 
     * 開始執行時間
     * @type {Date | null} 佇列開始執行的時間戳記
     */
    started_at: Date | null;
    
    /** 
     * 完成時間
     * @type {Date | null} 佇列完成執行的時間戳記
     */
    completed_at: Date | null;
    
    /** 
     * 錯誤訊息
     * @type {string | null} 佇列執行失敗時的錯誤訊息
     */
    error_message: string | null;
    
    /** 
     * 建立時間
     * @type {Date} 佇列記錄的建立時間戳記
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} 佇列記錄的最後更新時間戳記
     */
    updatedAt: Date;
};

/**
 * 無人機指令佇列資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 
 * @interface DroneCommandQueueCreationAttributes
 * @extends {Optional<DroneCommandQueueAttributes, 'id'>}
 * @since 1.0.0
 */
export type DroneCommandQueueCreationAttributes = Optional<DroneCommandQueueAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 無人機指令佇列模型類別
 * 
 * 實作無人機指令佇列管理的 Sequelize 模型，提供批次指令規劃、條件式執行和智能衝突檢測功能。
 * 此模型對應資料庫中的 drone_command_queues 資料表。
 * 
 * @class DroneCommandQueueModel
 * @extends {Model<DroneCommandQueueAttributes, DroneCommandQueueCreationAttributes>}
 * @implements {DroneCommandQueueAttributes}
 * @since 1.0.0
 */
@Table({ tableName: 'drone_command_queues', timestamps: true })
export class DroneCommandQueueModel extends Model<DroneCommandQueueAttributes, DroneCommandQueueCreationAttributes> implements DroneCommandQueueAttributes {
    /**
     * 主鍵識別碼
     */
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    declare id: number;

    /**
     * 佇列名稱
     */
    @AllowNull(false)
    @Column(DataType.STRING(255))
    declare name: string;

    /**
     * 佇列狀態
     */
    @AllowNull(false)
    @Column(DataType.ENUM(...Object.values(DroneCommandQueueStatus)))
    declare status: DroneCommandQueueStatus;

    /**
     * 當前執行索引
     */
    @AllowNull(false)
    @Column(DataType.INTEGER)
    declare current_index: number;

    /**
     * 自動執行
     */
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    declare auto_execute: boolean;

    /**
     * 執行條件
     */
    @AllowNull(true)
    @Column(DataType.JSON)
    declare execution_conditions: CommandCondition[] | null;

    /**
     * 迴圈計數
     */
    @AllowNull(true)
    @Column(DataType.INTEGER)
    declare loop_count: number | null;

    /**
     * 最大迴圈次數
     */
    @AllowNull(true)
    @Column(DataType.INTEGER)
    declare max_loops: number | null;

    /**
     * 建立者
     */
    @AllowNull(false)
    @Column(DataType.BIGINT)
    declare created_by: number;

    /**
     * 開始執行時間
     */
    @AllowNull(true)
    @Column(DataType.DATE)
    declare started_at: Date | null;

    /**
     * 完成時間
     */
    @AllowNull(true)
    @Column(DataType.DATE)
    declare completed_at: Date | null;

    /**
     * 錯誤訊息
     */
    @AllowNull(true)
    @Column(DataType.TEXT)
    declare error_message: string | null;

    /**
     * 建立時間
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     */
    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;

    /**
     * 關聯到指令表
     * 
     * 建立與 DroneCommandModel 的一對多關聯關係。
     * 使用延遲載入避免循環引用。
     */
    @HasMany(() => require('./DroneCommandModel.js').DroneCommandModel, {
        foreignKey: 'queue_id',
        as: 'commands'
    })
    declare commands: any[];

    /**
     * 計算佇列執行時間
     */
    getExecutionTime(): number | null {
        if (!this.started_at || !this.completed_at) return null;
        return this.completed_at.getTime() - this.started_at.getTime();
    }

    /**
     * 檢查佇列是否已完成
     */
    isCompleted(): boolean {
        return this.status === DroneCommandQueueStatus.COMPLETED || this.status === DroneCommandQueueStatus.FAILED;
    }

    /**
     * 檢查佇列是否成功
     */
    isSuccessful(): boolean {
        return this.status === DroneCommandQueueStatus.COMPLETED;
    }

    /**
     * 檢查佇列是否正在執行
     */
    isRunning(): boolean {
        return this.status === DroneCommandQueueStatus.RUNNING;
    }

    /**
     * 檢查佇列是否已暫停
     */
    isPaused(): boolean {
        return this.status === DroneCommandQueueStatus.PAUSED;
    }
}