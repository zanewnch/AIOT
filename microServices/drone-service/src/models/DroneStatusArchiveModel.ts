/**
 * @fileoverview 無人機狀態歷史表模型
 * 
 * 本文件定義了無人機狀態變更歷史的資料模型，
 * 用於追蹤無人機狀態的變化記錄，包含變更原因、詳細資訊和操作者。
 * 提供完整的狀態變更審計功能，適用於無人機狀態監控和歷史分析。
 * 
 * 資料表欄位 (Table Columns):
 * - id: 主鍵識別碼 (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
 * - drone_id: 無人機外鍵 (BIGINT, NOT NULL, FOREIGN KEY) - 關聯到drones_status表
 * - status: 變更後狀態 (ENUM, NOT NULL) - active/inactive/maintenance/flying
 * - previous_status: 變更前狀態 (ENUM, NULL) - 前一個狀態，初始狀態時為null
 * - reason: 變更原因 (VARCHAR, NOT NULL) - 狀態變更的原因說明
 * - details: 詳細資訊 (JSON, NULL) - 結構化詳細資訊，如任務ID、天氣條件等
 * - timestamp: 狀態變更時間 (DATETIME, NOT NULL) - 狀態變更發生的精確時間
 * - created_by: 操作者 (BIGINT, NULL) - 執行變更的用戶ID，可為系統自動變更
 * - createdAt: 建立時間 (DATETIME, AUTO) - 記錄建立時間戳記，自動管理
 * - updatedAt: 更新時間 (DATETIME, AUTO) - 記錄更新時間戳記，自動維護
 * 
 * @module DroneStatusArchiveModel
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
    ForeignKey,   // 外鍵裝飾器
    BelongsTo,    // 關聯裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

// 引入相關模型
import { DroneStatusModel } from './DroneStatusModel.js';

// 引入無人機狀態枚舉
import { DroneStatus } from './DroneStatusModel.js';

/**
 * 無人機狀態歷史資料屬性介面
 * 
 * 定義無人機狀態歷史歸檔的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DroneStatusArchiveAttributes
 * @since 1.0.0
 */
export type DroneStatusArchiveAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 原始資料表的 ID
     * @type {number} 保留對原始 drone_statuses 表記錄的追蹤
     */
    original_id: number;
    
    /** 
     * 無人機外鍵
     * @type {number} 關聯到 drones_status 表的外鍵
     */
    drone_id: number;
    
    /** 
     * 當前電池電量
     * @type {number} 無人機電池電量，範圍 0-100%
     */
    current_battery_level: number;
    
    /** 
     * 當前狀態
     * @type {DroneStatus} 無人機的當前狀態
     */
    current_status: DroneStatus;
    
    /** 
     * 最後連線時間
     * @type {Date} 無人機最後一次連線的時間戳記
     */
    last_seen: Date;
    
    /** 
     * 當前高度
     * @type {number | null} 無人機的當前高度，可選欄位
     */
    current_altitude: number | null;
    
    /** 
     * 當前速度
     * @type {number | null} 無人機的當前速度，可選欄位
     */
    current_speed: number | null;
    
    /** 
     * 是否連線
     * @type {boolean} 無人機是否處於連線狀態
     */
    is_connected: boolean;
    
    /** 
     * 歸檔時間
     * @type {Date} 資料被歸檔的時間戳記
     */
    archived_at: Date;
    
    /** 
     * 歸檔批次識別碼
     * @type {string} 歸檔作業的批次識別碼，用於追蹤批次歸檔操作
     */
    archive_batch_id: string;
    
    /** 
     * 原始記錄建立時間
     * @type {Date} 原始資料在 drone_statuses 表中的建立時間
     */
    created_at: Date;
};

/**
 * 無人機狀態歷史資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 DroneStatusArchiveAttributes 並將 id 設為可選屬性。
 * 
 * @interface DroneStatusArchiveCreationAttributes
 * @extends {Optional<DroneStatusArchiveAttributes, 'id'>}
 * @since 1.0.0
 */
export type DroneStatusArchiveCreationAttributes = Optional<DroneStatusArchiveAttributes, 'id'>;

/**
 * 無人機狀態歷史模型類別
 * 
 * 實作無人機狀態變更歷史的 Sequelize 模型，提供狀態變更追蹤和歷史查詢功能。
 * 此模型對應資料庫中的 drone_archive 資料表，支援 CRUD 操作和自動時間戳記。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - drone_id: 無人機外鍵（BIGINT, 必填）
 * - status: 變更後狀態（ENUM, 必填）
 * - previous_status: 變更前狀態（ENUM, 可空）
 * - reason: 變更原因（VARCHAR, 必填）
 * - details: 詳細資訊（JSON, 可空）
 * - timestamp: 狀態變更時間（DATETIME, 必填）
 * - created_by: 操作者（BIGINT, 可空）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * @class DroneStatusArchiveModel
 * @extends {Model<DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes>}
 * @implements {DroneStatusArchiveAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 記錄無人機狀態變更
 * const statusChange = await DroneStatusArchiveModel.create({
 *   drone_id: 1,
 *   status: DroneStatus.FLYING,
 *   previous_status: DroneStatus.ACTIVE,
 *   reason: '開始執行任務',
 *   details: { 
 *     mission_id: 'M001',
 *     pilot_id: 123,
 *     weather_condition: 'sunny' 
 *   },
 *   timestamp: new Date(),
 *   created_by: 1
 * });
 * 
 * // 查詢特定無人機的狀態歷史
 * const history = await DroneStatusArchiveModel.findAll({
 *   where: { drone_id: 1 },
 *   order: [['timestamp', 'DESC']],
 *   limit: 10
 * });
 * ```
 */
@Table({ tableName: 'drone_status_archive', timestamps: false }) // 設定資料表名稱為 'drone_status_archive'，不使用自動時間戳記
export class DroneStatusArchiveModel extends Model<DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes> implements DroneStatusArchiveAttributes {
    /**
     * 主鍵識別碼
     */
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    declare id: number;

    /**
     * 原始資料表的 ID
     */
    @AllowNull(false)
    @Column(DataType.BIGINT)
    declare original_id: number;

    /**
     * 無人機外鍵
     */
    @AllowNull(false)
    @ForeignKey(() => DroneStatusModel)
    @Column(DataType.BIGINT)
    declare drone_id: number;

    /**
     * 當前電池電量
     */
    @AllowNull(false)
    @Column(DataType.FLOAT)
    declare current_battery_level: number;

    /**
     * 當前狀態
     */
    @AllowNull(false)
    @Column(DataType.ENUM('idle', 'flying', 'charging', 'maintenance', 'offline', 'error'))
    declare current_status: DroneStatus;

    /**
     * 最後連線時間
     */
    @AllowNull(false)
    @Column(DataType.DATE)
    declare last_seen: Date;

    /**
     * 當前高度
     */
    @AllowNull(true)
    @Column(DataType.FLOAT)
    declare current_altitude: number | null;

    /**
     * 當前速度
     */
    @AllowNull(true)
    @Column(DataType.FLOAT)
    declare current_speed: number | null;

    /**
     * 是否連線
     */
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    declare is_connected: boolean;

    /**
     * 歸檔時間
     */
    @AllowNull(false)
    @Column(DataType.DATE)
    declare archived_at: Date;

    /**
     * 歸檔批次識別碼
     */
    @AllowNull(false)
    @Column(DataType.STRING)
    declare archive_batch_id: string;

    /**
     * 原始記錄建立時間
     */
    @AllowNull(false)
    @Column(DataType.DATE)
    declare created_at: Date;

    /**
     * 關聯到無人機狀態表
     * 
     * 建立與 DroneStatusModel 的多對一關聯關係。
     * 
     * @type {DroneStatusModel}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @BelongsTo(() => DroneStatusModel)
    declare drone: DroneStatusModel;
}