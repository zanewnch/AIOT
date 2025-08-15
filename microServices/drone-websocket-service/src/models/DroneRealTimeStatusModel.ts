/**
 * @fileoverview 無人機即時狀態資料表模型
 * 
 * 本文件定義了無人機即時狀態系統的資料模型，
 * 用於儲存無人機的即時動態狀態資訊，包括電量、連線狀態、飛行參數等。
 * 提供高頻率更新的即時狀態追蹤功能，適用於無人機監控和管理系統。
 * 
 * 資料表欄位 (Table Columns):
 * - id: 主鍵識別碼 (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
 * - drone_id: 無人機外鍵 (BIGINT, NOT NULL, FOREIGN KEY) - 關聯到drones_status表
 * - current_battery_level: 即時電量百分比 (FLOAT, NOT NULL) - 當前電池電量 0-100%
 * - current_status: 即時狀態 (ENUM, NOT NULL) - idle/flying/charging/maintenance/offline/error
 * - last_seen: 最後連線時間 (TIMESTAMP, NOT NULL) - 最後一次接收到信號的時間
 * - current_altitude: 當前高度 (FLOAT, NULL) - 當前飛行高度，單位公尺
 * - current_speed: 當前速度 (FLOAT, NULL) - 當前飛行速度，單位 m/s
 * - current_heading: 當前航向 (FLOAT, NULL) - 當前航向角度 0-360度
 * - signal_strength: GPS信號強度 (FLOAT, NULL) - GPS接收信號強度指標
 * - is_connected: 是否在線 (BOOLEAN, NOT NULL) - 設備連線狀態
 * - error_message: 錯誤訊息 (TEXT, NULL) - 錯誤或警告訊息
 * - temperature: 設備溫度 (FLOAT, NULL) - 設備工作溫度，單位攝氏度
 * - flight_time_today: 今日飛行時間 (INT, DEFAULT 0) - 今日累計飛行秒數
 * - createdAt: 建立時間 (TIMESTAMP, AUTO) - 記錄建立時間戳記，自動管理
 * - updatedAt: 更新時間 (TIMESTAMP, AUTO) - 記錄更新時間戳記，自動維護
 * 
 * @module DroneRealTimeStatusModel
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
    Default,      // 預設值裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

// 引入關聯的模型
import { DroneStatusModel } from './DroneStatusModel';

/**
 * 無人機即時狀態枚舉
 * 
 * 定義無人機的即時狀態值，與基本狀態表分離以支援更細緻的狀態管理
 * 
 * @enum {string}
 */
export enum DroneRealTimeStatus {
    IDLE = 'idle',              // 待機中
    FLYING = 'flying',          // 飛行中
    CHARGING = 'charging',      // 充電中
    MAINTENANCE = 'maintenance', // 維護中
    OFFLINE = 'offline',        // 離線
    ERROR = 'error'             // 錯誤狀態
}

/**
 * 無人機即時狀態資料屬性介面
 * 
 * 定義無人機即時狀態的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DroneRealTimeStatusAttributes
 * @since 1.0.0
 */
export type DroneRealTimeStatusAttributes = {
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
     * 即時電量百分比
     * @type {number} 當前電池電量，範圍 0-100%
     */
    current_battery_level: number;
    
    /** 
     * 即時狀態
     * @type {DroneRealTimeStatus} 無人機當前的即時狀態
     */
    current_status: DroneRealTimeStatus;
    
    /** 
     * 最後連線時間
     * @type {Date} 最後一次接收到設備信號的時間戳記
     */
    last_seen: Date;
    
    /** 
     * 當前高度
     * @type {number | null} 當前飛行高度，單位為公尺，可為空
     */
    current_altitude: number | null;
    
    /** 
     * 當前速度
     * @type {number | null} 當前飛行速度，單位為 m/s，可為空
     */
    current_speed: number | null;
    
    /** 
     * 當前航向
     * @type {number | null} 當前航向角度，範圍 0-360 度，可為空
     */
    current_heading: number | null;
    
    /** 
     * GPS信號強度
     * @type {number | null} GPS 接收信號的強度指標，可為空
     */
    signal_strength: number | null;
    
    /** 
     * 是否在線
     * @type {boolean} 設備當前的連線狀態
     */
    is_connected: boolean;
    
    /** 
     * 錯誤訊息
     * @type {string | null} 錯誤或警告訊息，可為空
     */
    error_message: string | null;
    
    /** 
     * 設備溫度
     * @type {number | null} 設備工作溫度，單位攝氏度，可為空
     */
    temperature: number | null;
    
    /** 
     * 今日飛行時間
     * @type {number} 今日累計飛行時間，單位秒
     */
    flight_time_today: number;
    
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
 * 無人機即時狀態資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，部分欄位為可選因為會自動產生或有預設值。
 * 
 * @interface DroneRealTimeStatusCreationAttributes
 * @extends {Optional<DroneRealTimeStatusAttributes, 'id' | 'createdAt' | 'updatedAt' | 'flight_time_today'>}
 * @since 1.0.0
 */
export type DroneRealTimeStatusCreationAttributes = Optional<
    DroneRealTimeStatusAttributes, 
    'id' | 'createdAt' | 'updatedAt' | 'flight_time_today'
>;

/**
 * 無人機即時狀態資料模型類別
 * 
 * 實作無人機即時狀態的 Sequelize 模型，提供即時狀態資料的儲存和查詢功能。
 * 此模型對應資料庫中的 drone_real_time_status 資料表，支援高頻率更新和 CRUD 操作。
 * 
 * @class DroneRealTimeStatusModel
 * @extends {Model<DroneRealTimeStatusAttributes, DroneRealTimeStatusCreationAttributes>}
 * @implements {DroneRealTimeStatusAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立新的無人機即時狀態記錄
 * const realtimeStatus = await DroneRealTimeStatusModel.create({
 *   drone_id: 1,
 *   current_battery_level: 85.5,
 *   current_status: DroneRealTimeStatus.FLYING,
 *   last_seen: new Date(),
 *   current_altitude: 150.0,
 *   current_speed: 12.5,
 *   current_heading: 270.0,
 *   signal_strength: 92.3,
 *   is_connected: true,
 *   error_message: null,
 *   temperature: 35.2
 * });
 * 
 * // 查詢所有在線的無人機
 * const onlineDrones = await DroneRealTimeStatusModel.findAll({
 *   where: { is_connected: true }
 * });
 * ```
 */
@Table({ tableName: 'drone_real_time_status', timestamps: true })
export class DroneRealTimeStatusModel extends Model<DroneRealTimeStatusAttributes, DroneRealTimeStatusCreationAttributes> implements DroneRealTimeStatusAttributes {
    /**
     * 主鍵識別碼
     */
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    declare id: number;

    /**
     * 無人機外鍵
     */
    @ForeignKey(() => DroneStatusModel)
    @AllowNull(false)
    @Column(DataType.BIGINT)
    declare drone_id: number;

    /**
     * 即時電量百分比
     */
    @AllowNull(false)
    @Column(DataType.FLOAT)
    declare current_battery_level: number;

    /**
     * 即時狀態
     */
    @AllowNull(false)
    @Column(DataType.ENUM(...Object.values(DroneRealTimeStatus)))
    declare current_status: DroneRealTimeStatus;

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
     * 當前航向
     */
    @AllowNull(true)
    @Column(DataType.FLOAT)
    declare current_heading: number | null;

    /**
     * GPS信號強度
     */
    @AllowNull(true)
    @Column(DataType.FLOAT)
    declare signal_strength: number | null;

    /**
     * 是否在線
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare is_connected: boolean;

    /**
     * 錯誤訊息
     */
    @AllowNull(true)
    @Column(DataType.TEXT)
    declare error_message: string | null;

    /**
     * 設備溫度
     */
    @AllowNull(true)
    @Column(DataType.FLOAT)
    declare temperature: number | null;

    /**
     * 今日飛行時間
     */
    @AllowNull(false)
    @Default(0)
    @Column(DataType.INTEGER)
    declare flight_time_today: number;

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
     * 關聯到無人機基本資料
     */
    @BelongsTo(() => DroneStatusModel, 'drone_id')
    declare droneStatus: DroneStatusModel;
}