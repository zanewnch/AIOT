/**
 * @fileoverview 無人機即時位置資料表模型
 * 
 * 本文件定義了無人機即時位置系統的資料模型，
 * 用於儲存無人機的 GPS 定位資料、飛行狀態和系統資訊。
 * 提供完整的 3D 定位資訊和飛行參數，適用於無人機追蹤和監控系統。
 * 
 * 資料表欄位 (Table Columns):
 * - id: 主鍵識別碼 (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
 * - drone_id: 無人機外鍵 (BIGINT, NOT NULL)
 * - latitude: 緯度座標 (FLOAT, NOT NULL) - WGS84 座標系統，範圍 -90 到 90 度
 * - longitude: 經度座標 (FLOAT, NOT NULL) - WGS84 座標系統，範圍 -180 到 180 度
 * - altitude: 海拔高度 (FLOAT, NOT NULL) - 距離海平面高度，單位公尺
 * - timestamp: 資料時間戳記 (DATE, NOT NULL) - 位置資料記錄時間，精確到毫秒
 * - signal_strength: GPS信號強度 (FLOAT, NOT NULL) - GPS 接收信號強度指標
 * - speed: 飛行速度 (FLOAT, NOT NULL) - 無人機飛行速度，單位 m/s
 * - heading: 航向角度 (FLOAT, NOT NULL) - 無人機航向，範圍 0-360 度
 * - battery_level: 電池電量百分比 (FLOAT, NOT NULL) - 電池電量，範圍 0-100%
 * - createdAt: 建立時間 (DATE, AUTO) - 記錄建立時間戳記，自動管理
 * - updatedAt: 更新時間 (DATE, AUTO) - 記錄更新時間戳記，自動維護
 * 
 * @module DronePositionModel
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
 * 無人機位置資料屬性介面
 * 
 * 定義無人機位置資料的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DronePositionAttributes
 * @since 1.0.0
 */
export type DronePositionAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 無人機外鍵
     * @type {number} 關聯到無人機資料表的外鍵
     */
    drone_id: number;
    
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
     * 海拔高度（公尺）
     * @type {number} 距離海平面的高度，單位為公尺（meter）
     */
    altitude: number;
    
    /** 
     * 資料時間戳記
     * @type {Date} 位置資料的記錄時間戳記（精確到毫秒）
     */
    timestamp: Date;
    
    /** 
     * GPS信號強度
     * @type {number} GPS 接收信號的強度指標
     */
    signal_strength: number;
    
    /** 
     * 飛行速度
     * @type {number} 無人機的飛行速度，單位為 m/s
     */
    speed: number;
    
    /** 
     * 航向角度
     * @type {number} 無人機的航向角度，範圍 0-360 度
     */
    heading: number;
    
    /** 
     * 電池電量百分比
     * @type {number} 無人機電池電量，範圍 0-100%
     */
    battery_level: number;
    
    /** 
     * 建立時間
     * @type {Date} 記錄建立時間戳記，用於資料分區和時間查詢
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} 記錄的最後更新時間戳記
     */
    updatedAt: Date;
};

/**
 * 無人機位置資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 DronePositionAttributes 並將 id 設為可選屬性。
 * 
 * @interface DronePositionCreationAttributes
 * @extends {Optional<DronePositionAttributes, 'id'>}
 * @since 1.0.0
 */
export type DronePositionCreationAttributes = Optional<DronePositionAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 無人機位置資料模型類別
 * 
 * 實作無人機即時位置資料的 Sequelize 模型，提供 GPS 定位資料和飛行狀態的儲存和查詢功能。
 * 此模型對應資料庫中的 drone_positions 資料表，支援 CRUD 操作和自動時間戳記。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - drone_id: 無人機外鍵（BIGINT, 必填）
 * - latitude: 緯度座標（FLOAT, 必填）
 * - longitude: 經度座標（FLOAT, 必填）
 * - altitude: 海拔高度（FLOAT, 必填）
 * - timestamp: 資料時間戳記（DATE, 必填）
 * - signal_strength: GPS信號強度（FLOAT, 必填）
 * - speed: 飛行速度（FLOAT, 必填）
 * - heading: 航向角度（FLOAT, 必填）
 * - battery_level: 電池電量百分比（FLOAT, 必填）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * @class DronePositionModel
 * @extends {Model<DronePositionAttributes, DronePositionCreationAttributes>}
 * @implements {DronePositionAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立新的無人機位置資料記錄
 * const dronePosition = await DronePositionModel.create({
 *   drone_id: 1,
 *   latitude: 25.033964,  // 台北市政府緯度
 *   longitude: 121.564468, // 台北市政府經度
 *   altitude: 100.5,      // 海拔高度 100.5 公尺
 *   timestamp: new Date(),
 *   signal_strength: 95.5,
 *   speed: 15.2,
 *   heading: 180.0,
 *   battery_level: 85.0
 * });
 * 
 * // 查詢特定無人機的最新位置資料
 * const latestPosition = await DronePositionModel.findOne({
 *   where: { drone_id: 1 },
 *   order: [['timestamp', 'DESC']]
 * });
 * ```
 */
@Table({ tableName: 'drone_positions', timestamps: true }) // 設定資料表名稱為 'drone_positions'，啟用時間戳記
export class DronePositionModel extends Model<DronePositionAttributes, DronePositionCreationAttributes> implements DronePositionAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆無人機位置資料的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量資料儲存。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 無人機外鍵
     * 
     * 關聯到無人機資料表的外鍵，標識此位置資料屬於哪台無人機。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare drone_id: number;

    /**
     * 緯度座標
     * 
     * 使用 WGS84 大地座標系統的緯度值，單位為度（degree）。
     * 有效範圍為 -90 到 90 度，正值表示北緯，負值表示南緯。
     * 
     * @type {number}
     * @memberof DronePositionModel
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
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態，提供足夠精度
    declare longitude: number;

    /**
     * 海拔高度
     * 
     * 距離海平面的高度，單位為公尺（meter）。
     * 用於提供完整的 3D 定位資訊，適用於無人機飛行高度監控。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態，提供足夠精度
    declare altitude: number;

    /**
     * 資料時間戳記
     * 
     * 位置資料的記錄時間戳記，精確到毫秒，用於時間序列分析。
     * 
     * @type {Date}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare timestamp: Date;

    /**
     * GPS信號強度
     * 
     * GPS 接收信號的強度指標，用於評估定位資料的可靠性。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare signal_strength: number;

    /**
     * 飛行速度
     * 
     * 無人機的飛行速度，單位為 m/s（公尺/秒）。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare speed: number;

    /**
     * 航向角度
     * 
     * 無人機的航向角度，範圍 0-360 度，0 度表示正北方。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare heading: number;

    /**
     * 電池電量百分比
     * 
     * 無人機電池電量，範圍 0-100%，用於監控飛行安全。
     * 
     * @type {number}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare battery_level: number;

    /**
     * 建立時間
     * 
     * 無人機位置記錄的建立時間戳記，由 Sequelize 自動管理。
     * 此欄位用於時間查詢和資料分區（partitioning）。
     * 
     * @type {Date}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     * 
     * 無人機位置記錄的最後更新時間戳記，由 Sequelize 自動管理。
     * 
     * @type {Date}
     * @memberof DronePositionModel
     * @since 1.0.0
     */
    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;
}