/**
 * @fileoverview 無人機基本資訊表模型
 * 
 * 本文件定義了無人機基本資訊系統的資料模型，
 * 用於儲存無人機的基本規格、狀態資訊和擁有者資料。
 * 提供完整的無人機管理功能，適用於無人機fleet管理系統。
 * 
 * 資料表欄位 (Table Columns):
 * - id: 主鍵識別碼 (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
 * - drone_serial: 無人機序號 (VARCHAR, NOT NULL, UNIQUE) - 無人機唯一識別序號
 * - drone_name: 無人機名稱 (VARCHAR, NOT NULL) - 顯示名稱
 * - model: 型號 (VARCHAR, NOT NULL) - 無人機產品型號
 * - manufacturer: 製造商 (VARCHAR, NOT NULL) - 製造商名稱
 * - owner_user_id: 擁有者用戶ID (BIGINT, NOT NULL, FOREIGN KEY) - 關聯到users表
 * - status: 狀態 (ENUM, NOT NULL) - active/inactive/maintenance/flying
 * - max_altitude: 最大飛行高度 (INT, NOT NULL) - 最大飛行高度限制，單位公尺
 * - max_range: 最大飛行距離 (INT, NOT NULL) - 最大飛行距離，單位公尺
 * - battery_capacity: 電池容量 (INT, NOT NULL) - 電池容量，單位mAh
 * - weight: 重量 (INT, NOT NULL) - 無人機重量，單位公克
 * - createdAt: 建立時間 (DATE, AUTO) - 記錄建立時間戳記，自動管理
 * - updatedAt: 更新時間 (DATE, AUTO) - 記錄更新時間戳記，自動維護
 * 
 * @module DroneStatusModel
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
    Unique,       // 唯一值裝飾器
    ForeignKey,   // 外鍵裝飾器
    BelongsTo,    // 關聯裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

/**
 * 無人機狀態枚舉
 * 
 * 定義無人機的可能狀態值
 * 
 * @enum {string}
 */
export enum DroneStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    MAINTENANCE = 'maintenance',
    FLYING = 'flying'
}

/**
 * 無人機資料屬性介面
 * 
 * 定義無人機基本資訊的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DroneStatusAttributes
 * @since 1.0.0
 */
export type DroneStatusAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 無人機序號
     * @type {string} 無人機的唯一識別序號
     */
    drone_serial: string;
    
    /** 
     * 無人機名稱
     * @type {string} 無人機的顯示名稱
     */
    drone_name: string;
    
    /** 
     * 型號
     * @type {string} 無人機的型號資訊
     */
    model: string;
    
    /** 
     * 製造商
     * @type {string} 無人機的製造商
     */
    manufacturer: string;
    
    /** 
     * 擁有者用戶ID
     * @type {number} 關聯到 users 表的外鍵
     */
    owner_user_id: number;
    
    /** 
     * 狀態
     * @type {DroneStatus} 無人機當前的狀態
     */
    status: DroneStatus;
    
    /** 
     * 最大飛行高度
     * @type {number} 最大飛行高度，單位為公尺
     */
    max_altitude: number;
    
    /** 
     * 最大飛行距離
     * @type {number} 最大飛行距離，單位為公尺
     */
    max_range: number;
    
    /** 
     * 電池容量
     * @type {number} 電池容量，單位為 mAh
     */
    battery_capacity: number;
    
    /** 
     * 重量
     * @type {number} 無人機重量，單位為公克
     */
    weight: number;
    
    /** 
     * 建立時間
     * @type {Date} 無人機資料記錄的建立時間戳記
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} 無人機資料記錄的最後更新時間戳記
     */
    updatedAt: Date;
};

/**
 * 無人機資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 DroneStatusAttributes 並將 id 設為可選屬性。
 * 
 * @interface DroneStatusCreationAttributes
 * @extends {Optional<DroneStatusAttributes, 'id'>}
 * @since 1.0.0
 */
export type DroneStatusCreationAttributes = Optional<DroneStatusAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 無人機狀態資料模型類別
 * 
 * 實作無人機基本資訊的 Sequelize 模型，提供無人機資料的儲存和查詢功能。
 * 此模型對應資料庫中的 drones_status 資料表，支援 CRUD 操作和自動時間戳記。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - drone_serial: 無人機序號（VARCHAR, 必填, 唯一）
 * - drone_name: 無人機名稱（VARCHAR, 必填）
 * - model: 型號（VARCHAR, 必填）
 * - manufacturer: 製造商（VARCHAR, 必填）
 * - owner_user_id: 擁有者ID（BIGINT, 必填, 外鍵）
 * - status: 狀態（ENUM, 必填）
 * - max_altitude: 最大飛行高度（INT, 必填）
 * - max_range: 最大飛行距離（INT, 必填）
 * - battery_capacity: 電池容量（INT, 必填）
 * - weight: 重量（INT, 必填）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * @class DroneStatusModel
 * @extends {Model<DroneStatusAttributes, DroneStatusCreationAttributes>}
 * @implements {DroneStatusAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立新的無人機資料記錄
 * const drone = await DroneStatusModel.create({
 *   drone_serial: 'DJI-001',
 *   drone_name: 'Sky Patrol 1',
 *   model: 'DJI Mavic Air 2',
 *   manufacturer: 'DJI',
 *   owner_user_id: 1,
 *   status: DroneStatus.ACTIVE,
 *   max_altitude: 500,
 *   max_range: 10000,
 *   battery_capacity: 3500,
 *   weight: 570
 * });
 * 
 * // 查詢特定狀態的無人機
 * const activeDrones = await DroneStatusModel.findAll({
 *   where: { status: DroneStatus.ACTIVE }
 * });
 * ```
 */
@Table({ tableName: 'drones_status', timestamps: true }) // 設定資料表名稱為 'drones_status'，啟用時間戳記
export class DroneStatusModel extends Model<DroneStatusAttributes, DroneStatusCreationAttributes> implements DroneStatusAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆無人機資料的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量資料儲存。
     * 
     * @type {number}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 無人機序號
     * 
     * 無人機的唯一識別序號，用於區分不同的無人機設備。
     * 
     * @type {string}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)           // 設定為必填欄位
    @Unique                     // 設定為唯一值
    @Column(DataType.STRING)    // 定義為 STRING 型態
    declare drone_serial: string;

    /**
     * 無人機名稱
     * 
     * 無人機的顯示名稱，用於用戶介面顯示和識別。
     * 
     * @type {string}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)           // 設定為必填欄位
    @Column(DataType.STRING)    // 定義為 STRING 型態
    declare drone_name: string;

    /**
     * 型號
     * 
     * 無人機的型號資訊，標識無人機的具體產品型號。
     * 
     * @type {string}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)           // 設定為必填欄位
    @Column(DataType.STRING)    // 定義為 STRING 型態
    declare model: string;

    /**
     * 製造商
     * 
     * 無人機的製造商名稱。
     * 
     * @type {string}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)           // 設定為必填欄位
    @Column(DataType.STRING)    // 定義為 STRING 型態
    declare manufacturer: string;

    /**
     * 擁有者用戶ID
     * 
     * 關聯到 users 表的外鍵，標識無人機的擁有者。
     * 
     * @type {number}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare owner_user_id: number;

    /**
     * 狀態
     * 
     * 無人機的當前狀態，包含 active（活躍）、inactive（非活躍）、
     * maintenance（維護中）、flying（飛行中）。
     * 
     * @type {DroneStatus}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Column(DataType.ENUM(...Object.values(DroneStatus)))                      // 定義為 ENUM 型態
    declare status: DroneStatus;

    /**
     * 最大飛行高度
     * 
     * 無人機的最大飛行高度限制，單位為公尺。
     * 
     * @type {number}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Column(DataType.INTEGER)  // 定義為 INTEGER 型態
    declare max_altitude: number;

    /**
     * 最大飛行距離
     * 
     * 無人機的最大飛行距離，單位為公尺。
     * 
     * @type {number}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Column(DataType.INTEGER)  // 定義為 INTEGER 型態
    declare max_range: number;

    /**
     * 電池容量
     * 
     * 無人機電池的容量，單位為 mAh（毫安時）。
     * 
     * @type {number}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Column(DataType.INTEGER)  // 定義為 INTEGER 型態
    declare battery_capacity: number;

    /**
     * 重量
     * 
     * 無人機的重量，單位為公克。
     * 
     * @type {number}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Column(DataType.INTEGER)  // 定義為 INTEGER 型態
    declare weight: number;

    /**
     * 建立時間
     * 
     * 無人機資料記錄的建立時間戳記，由 Sequelize 自動管理。
     * 此欄位用於時間查詢和資料分區（partitioning）。
     * 
     * @type {Date}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     * 
     * 無人機資料記錄的最後更新時間戳記，由 Sequelize 自動管理。
     * 
     * @type {Date}
     * @memberof DroneStatusModel
     * @since 1.0.0
     */
    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;
}