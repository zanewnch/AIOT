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
 * 定義無人機狀態變更歷史的完整屬性結構，包含所有必要的欄位定義。
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
     * 無人機外鍵
     * @type {number} 關聯到 drones_status 表的外鍵
     */
    drone_id: number;
    
    /** 
     * 狀態變更
     * @type {DroneStatus} 變更後的狀態
     */
    status: DroneStatus;
    
    /** 
     * 前一狀態
     * @type {DroneStatus | null} 變更前的狀態，初始狀態時為 null
     */
    previous_status: DroneStatus | null;
    
    /** 
     * 變更原因
     * @type {string} 狀態變更的原因說明
     */
    reason: string;
    
    /** 
     * 詳細資訊
     * @type {object | null} JSON 格式的詳細資訊，可包含任意結構化資料
     */
    details: object | null;
    
    /** 
     * 狀態變更時間
     * @type {Date} 狀態變更發生的時間戳記
     */
    timestamp: Date;
    
    /** 
     * 操作者
     * @type {number | null} 執行狀態變更的用戶ID，可選欄位
     */
    created_by: number | null;
    
    /** 
     * 建立時間
     * @type {Date} 記錄建立時間戳記
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} 記錄的最後更新時間戳記
     */
    updatedAt: Date;
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
export type DroneStatusArchiveCreationAttributes = Optional<DroneStatusArchiveAttributes, 'id' | 'createdAt' | 'updatedAt'>;

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
@Table({ tableName: 'drone_status_archive', timestamps: true }) // 設定資料表名稱為 'drone_status_archive'，啟用時間戳記
export class DroneStatusArchiveModel extends Model<DroneStatusArchiveAttributes, DroneStatusArchiveCreationAttributes> implements DroneStatusArchiveAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆狀態變更記錄的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量歷史資料儲存。
     * 
     * @type {number}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 無人機外鍵
     * 
     * 關聯到 drones_status 表的外鍵，標識此狀態變更屬於哪台無人機。
     * 
     * @type {number}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @ForeignKey(() => DroneStatusModel) // 設定外鍵關聯
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare drone_id: number;

    /**
     * 狀態變更
     * 
     * 無人機變更後的狀態，包含 active（活躍）、inactive（非活躍）、
     * maintenance（維護中）、flying（飛行中）。
     * 
     * @type {DroneStatus}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Column(DataType.ENUM(...Object.values(DroneStatus)))                      // 定義為 ENUM 型態
    declare status: DroneStatus;

    /**
     * 前一狀態
     * 
     * 無人機變更前的狀態，初始狀態變更時此欄位為 null。
     * 
     * @type {DroneStatus | null}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)                                                            // 允許空值
    @Column(DataType.ENUM(...Object.values(DroneStatus)))                      // 定義為 ENUM 型態
    declare previous_status: DroneStatus | null;

    /**
     * 變更原因
     * 
     * 狀態變更的原因說明，用於記錄為什麼進行此次狀態變更。
     * 
     * @type {string}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)           // 設定為必填欄位
    @Column(DataType.STRING)    // 定義為 STRING 型態
    declare reason: string;

    /**
     * 詳細資訊
     * 
     * JSON 格式的詳細資訊，可包含任意結構化資料，如任務ID、天氣條件、
     * 維護項目等相關資訊。
     * 
     * @type {object | null}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.JSON)     // 定義為 JSON 型態
    declare details: object | null;

    /**
     * 狀態變更時間
     * 
     * 狀態變更發生的精確時間戳記，用於時間序列分析和狀態追蹤。
     * 
     * @type {Date}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare timestamp: Date;

    /**
     * 操作者
     * 
     * 執行狀態變更的用戶ID，關聯到 users 表。
     * 此欄位為可選，允許系統自動變更狀態的情況。
     * 
     * @type {number | null}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @AllowNull(true)          // 允許空值
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare created_by: number | null;

    /**
     * 建立時間
     * 
     * 狀態變更記錄的建立時間戳記，由 Sequelize 自動管理。
     * 此欄位用於記錄何時將此變更寫入資料庫。
     * 
     * @type {Date}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     * 
     * 狀態變更記錄的最後更新時間戳記，由 Sequelize 自動管理。
     * 
     * @type {Date}
     * @memberof DroneStatusArchiveModel
     * @since 1.0.0
     */
    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;

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