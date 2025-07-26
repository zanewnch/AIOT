/**
 * @fileoverview RTK 即時動態定位資料表模型
 * 
 * 本文件定義了 RTK（Real-Time Kinematic）即時動態定位系統的資料模型，
 * 用於儲存高精度的 GPS 定位資料。RTK 技術可提供公分級的定位精度，
 * 適用於精密測量、自動化設備定位和精確導航系統。
 * 
 * @module RTKDataModel
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
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

/**
 * RTK 資料屬性介面
 * 
 * 定義 RTK 定位資料的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface RTKDataAttributes
 * @since 1.0.0
 */
export type RTKDataAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 緯度座標（度）
     * @type {number} WGS84 座標系統的緯度值，範圍 -90 到 90 度
     */
    latitude: number;
    
    /** 
     * 經度座標（度）
     * @type {number} WGS84 座標系統的經度值，範圍 -180 到 180 度
     */
    longitude: number;
    
    /** 
     * 建立時間
     * @type {Date} RTK 資料記錄的建立時間戳記，用於資料分區和時間查詢
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} RTK 資料記錄的最後更新時間戳記
     */
    updatedAt: Date;
};

/**
 * RTK 資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 RTKDataAttributes 並將 id 設為可選屬性。
 * 
 * @interface RTKDataCreationAttributes
 * @extends {Optional<RTKDataAttributes, 'id'>}
 * @since 1.0.0
 */
export type RTKDataCreationAttributes = Optional<RTKDataAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * RTK 資料模型類別
 * 
 * 實作 RTK 即時動態定位資料的 Sequelize 模型，提供高精度 GPS 定位資料的儲存和查詢功能。
 * 此模型對應資料庫中的 rtk_data 資料表，支援 CRUD 操作和自動時間戳記。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - latitude: 緯度座標（FLOAT, 必填）
 * - longitude: 經度座標（FLOAT, 必填）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * @class RTKDataModel
 * @extends {Model<RTKDataAttributes, RTKDataCreationAttributes>}
 * @implements {RTKDataAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立新的 RTK 資料記錄
 * const rtkData = await RTKDataModel.create({
 *   latitude: 25.033964,  // 台北市政府緯度
 *   longitude: 121.564468 // 台北市政府經度
 * });
 * 
 * // 查詢最新的定位資料
 * const latestData = await RTKDataModel.findOne({
 *   order: [['createdAt', 'DESC']]
 * });
 * ```
 */
@Table({ tableName: 'rtk_data', timestamps: true }) // 設定資料表名稱為 'rtk_data'，啟用時間戳記
export class RTKDataModel extends Model<RTKDataAttributes, RTKDataCreationAttributes> implements RTKDataAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆 RTK 定位資料的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量資料儲存。
     * 
     * @type {number}
     * @memberof RTKDataModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 緯度座標
     * 
     * 使用 WGS84 大地座標系統的緯度值，單位為度（degree）。
     * 有效範圍為 -90 到 90 度，正值表示北緯，負值表示南緯。
     * 
     * @type {number}
     * @memberof RTKDataModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態，提供足夠精度
    declare latitude: number;

    /**
     * 經度座標
     * 
     * 使用 WGS84 大地座標系統的經度值，單位為度（degree）。
     * 有效範圍為 -180 到 180 度，正值表示東經，負值表示西經。
     * 
     * @type {number}
     * @memberof RTKDataModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態，提供足夠精度
    declare longitude: number;

    /**
     * 建立時間
     * 
     * RTK 資料記錄的建立時間戳記，由 Sequelize 自動管理。
     * 此欄位用於時間查詢和資料分區（partitioning）。
     * 
     * @type {Date}
     * @memberof RTKDataModel
     * @since 1.0.0
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     * 
     * RTK 資料記錄的最後更新時間戳記，由 Sequelize 自動管理。
     * 
     * @type {Date}
     * @memberof RTKDataModel
     * @since 1.0.0
     */
    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;
}