/**
 * @fileoverview 無人機位置資料歸檔表模型
 * 
 * 本文件定義了無人機位置資料歸檔系統的資料模型，
 * 用於長期儲存無人機的歷史位置資料，包含完整的飛行軌跡和環境資訊。
 * 提供資料歸檔管理和歷史分析功能，適用於無人機飛行記錄保存和數據分析。
 * 
 * @module DronePositionsArchiveModel
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

// 引入相關模型
import { DroneStatusModel } from './DroneStatusModel.js';

/**
 * 無人機位置歸檔資料屬性介面
 * 
 * 定義無人機位置歸檔資料的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DronePositionsArchiveAttributes
 * @since 1.0.0
 */
export type DronePositionsArchiveAttributes = {
    /** 
     * 主鍵識別碼
     * @type {number} 唯一識別碼，由資料庫自動生成
     */
    id: number;
    
    /** 
     * 原始資料表的 ID
     * @type {number} 保留對原始 drone_positions 表記錄的追蹤
     */
    original_id: number;
    
    /** 
     * 無人機外鍵
     * @type {number} 關聯到 drones_status 表的外鍵
     */
    drone_id: number;
    
    /** 
     * 緯度座標
     * @type {number} WGS84 座標系統的緯度值，範圍 -90 到 90 度
     */
    latitude: number;
    
    /** 
     * 經度座標
     * @type {number} WGS84 座標系統的經度值，範圍 -180 到 180 度
     */
    longitude: number;
    
    /** 
     * 海拔高度
     * @type {number} 距離海平面的高度，單位為公尺（meter）
     */
    altitude: number;
    
    /** 
     * 資料時間戳記
     * @type {Date} 位置資料的記錄時間戳記，精確到毫秒
     */
    timestamp: Date;
    
    /** 
     * GPS信號強度 - 暫時註解，資料庫表中不存在此欄位
     * @type {number} GPS 接收信號的強度指標，範圍 0-100
     */
    // signal_strength: number;
    
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
     * 溫度
     * @type {number} 環境溫度，單位為攝氏度
     */
    temperature: number;
    
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
     * @type {Date} 原始資料在 drone_positions 表中的建立時間
     */
    created_at: Date;
};

/**
 * 無人機位置歸檔資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 DronePositionsArchiveAttributes 並將 id 設為可選屬性。
 * 
 * @interface DronePositionsArchiveCreationAttributes
 * @extends {Optional<DronePositionsArchiveAttributes, 'id'>}
 * @since 1.0.0
 */
export type DronePositionsArchiveCreationAttributes = Optional<DronePositionsArchiveAttributes, 'id'>;

/**
 * 無人機位置歸檔模型類別
 * 
 * 實作無人機位置資料歸檔的 Sequelize 模型，提供歷史位置資料的長期儲存和查詢功能。
 * 此模型對應資料庫中的 drone_positions_archive 資料表，支援大量歷史資料的高效查詢。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - original_id: 原始資料ID（BIGINT, 必填）
 * - drone_id: 無人機外鍵（BIGINT, 必填）
 * - latitude: 緯度座標（FLOAT, 必填）
 * - longitude: 經度座標（FLOAT, 必填）
 * - altitude: 海拔高度（FLOAT, 必填）
 * - timestamp: 資料時間戳記（DATETIME(3), 必填）
 * - signal_strength: GPS信號強度（FLOAT, 必填）
 * - speed: 飛行速度（FLOAT, 必填）
 * - heading: 航向角度（FLOAT, 必填）
 * - battery_level: 電池電量（FLOAT, 必填）
 * - temperature: 溫度（FLOAT, 必填）
 * - archived_at: 歸檔時間（DATETIME, 必填）
 * - archive_batch_id: 歸檔批次ID（VARCHAR, 必填）
 * - created_at: 原始建立時間（DATETIME, 必填）
 * 
 * @class DronePositionsArchiveModel
 * @extends {Model<DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes>}
 * @implements {DronePositionsArchiveAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 歸檔位置資料
 * const archivedPosition = await DronePositionsArchiveModel.create({
 *   original_id: 12345,
 *   drone_id: 1,
 *   latitude: 25.033964,
 *   longitude: 121.564468,
 *   altitude: 100.5,
 *   timestamp: new Date('2025-07-29T10:30:00.123Z'),
 *   signal_strength: 95.5,
 *   speed: 15.2,
 *   heading: 180.0,
 *   battery_level: 85.0,
 *   temperature: 28.5,
 *   archived_at: new Date(),
 *   archive_batch_id: 'BATCH_20250729_001',
 *   created_at: new Date('2025-07-29T10:30:00.123Z')
 * });
 * 
 * // 查詢特定時間範圍的歷史軌跡
 * const trajectory = await DronePositionsArchiveModel.findAll({
 *   where: {
 *     drone_id: 1,
 *     timestamp: {
 *       [Op.between]: [startDate, endDate]
 *     }
 *   },
 *   order: [['timestamp', 'ASC']]
 * });
 * 
 * // 查詢特定歸檔批次的資料
 * const batchData = await DronePositionsArchiveModel.findAll({
 *   where: { archive_batch_id: 'BATCH_20250729_001' },
 *   include: [{ model: DroneStatusModel, as: 'drone' }]
 * });
 * ```
 */
@Table({ 
    tableName: 'drone_positions_archive', 
    timestamps: false,  // 不使用自動時間戳記，因為我們有自定義的時間欄位
    indexes: [
        // 為查詢效能建立複合索引
        { fields: ['drone_id', 'timestamp'] },
        { fields: ['archive_batch_id'] },
        { fields: ['archived_at'] },
        { fields: ['original_id'] }
    ]
})
export class DronePositionsArchiveModel extends Model<DronePositionsArchiveAttributes, DronePositionsArchiveCreationAttributes> implements DronePositionsArchiveAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆歸檔位置記錄的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量歷史資料儲存。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 原始資料表的 ID
     * 
     * 保留對原始 drone_positions 表記錄的追蹤，用於資料溯源和完整性檢查。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升查詢效能
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare original_id: number;

    /**
     * 無人機外鍵
     * 
     * 關聯到 drones_status 表的外鍵，標識此位置資料屬於哪台無人機。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @ForeignKey(() => DroneStatusModel) // 設定外鍵關聯
    @Index                    // 建立索引以提升查詢效能
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare drone_id: number;

    /**
     * 緯度座標
     * 
     * 使用 WGS84 大地座標系統的緯度值，單位為度（degree）。
     * 有效範圍為 -90 到 90 度，正值表示北緯，負值表示南緯。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
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
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態，提供足夠精度
    declare longitude: number;

    /**
     * 海拔高度
     * 
     * 距離海平面的高度，單位為公尺（meter）。
     * 用於提供完整的 3D 定位資訊，適用於無人機飛行高度分析。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態，提供足夠精度
    declare altitude: number;

    /**
     * 資料時間戳記
     * 
     * 位置資料的記錄時間戳記，精確到毫秒，用於時間序列分析和軌跡重建。
     * 
     * @type {Date}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升時間查詢效能
    @Column(DataType.DATE(3)) // 定義為 DATE 型態，支援毫秒精度
    declare timestamp: Date;

    /**
     * GPS信號強度
     * 
     * GPS 接收信號的強度指標，範圍 0-100，用於評估位置資料的可靠性。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    // 暫時註解，資料庫表中不存在此欄位
    // @AllowNull(false)         // 設定為必填欄位
    // @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    // declare signal_strength: number;

    /**
     * 飛行速度
     * 
     * 無人機的飛行速度，單位為 m/s（公尺/秒）。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
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
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare heading: number;

    /**
     * 電池電量百分比
     * 
     * 無人機電池電量，範圍 0-100%，用於分析飛行能耗和電池性能。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare battery_level: number;

    /**
     * 溫度
     * 
     * 環境溫度，單位為攝氏度，用於環境條件分析和設備性能評估。
     * 
     * @type {number}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.FLOAT)   // 定義為 FLOAT 型態
    declare temperature: number;

    /**
     * 歸檔時間
     * 
     * 資料被歸檔的時間戳記，用於追蹤歸檔作業和資料生命週期管理。
     * 
     * @type {Date}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升歸檔查詢效能
    @Column(DataType.DATE)    // 定義為 DATE 型態
    declare archived_at: Date;

    /**
     * 歸檔批次識別碼
     * 
     * 歸檔作業的批次識別碼，用於追蹤和管理批次歸檔操作，格式如 BATCH_YYYYMMDD_NNN。
     * 
     * @type {string}
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Index                    // 建立索引以提升批次查詢效能
    @Column(DataType.STRING)  // 定義為 STRING 型態
    declare archive_batch_id: string;

    /**
     * 原始記錄建立時間
     * 
     * 原始資料在 drone_positions 表中的建立時間，保持資料的時間溯源。
     * 
     * @type {Date}
     * @memberof DronePositionsArchiveModel
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
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    @BelongsTo(() => DroneStatusModel)
    declare drone: DroneStatusModel;

    /**
     * 計算與指定座標的距離
     * 
     * 使用 Haversine 公式計算此位置與指定座標的直線距離（公尺）。
     * 
     * @param {number} targetLat - 目標緯度
     * @param {number} targetLng - 目標經度
     * @returns {number} 距離（公尺）
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    getDistanceFrom(targetLat: number, targetLng: number): number {
        const R = 6371000; // 地球半徑（公尺）
        const φ1 = this.latitude * Math.PI / 180;
        const φ2 = targetLat * Math.PI / 180;
        const Δφ = (targetLat - this.latitude) * Math.PI / 180;
        const Δλ = (targetLng - this.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    /**
     * 檢查GPS信號品質
     * 
     * 根據信號強度評估GPS信號品質等級。
     * 
     * @returns {string} 信號品質等級：excellent/good/fair/poor
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    // 暫時註解，signal_strength 欄位不存在
    // getSignalQuality(): string {
    //     if (this.signal_strength >= 90) return 'excellent';
    //     if (this.signal_strength >= 70) return 'good';
    //     if (this.signal_strength >= 50) return 'fair';
    //     return 'poor';
    // }

    /**
     * 檢查電池狀態
     * 
     * 根據電池電量評估電池狀態。
     * 
     * @returns {string} 電池狀態：high/medium/low/critical
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    getBatteryStatus(): string {
        if (this.battery_level >= 80) return 'high';
        if (this.battery_level >= 50) return 'medium';
        if (this.battery_level >= 20) return 'low';
        return 'critical';
    }

    /**
     * 格式化航向方位
     * 
     * 將航向角度轉換為方位描述。
     * 
     * @returns {string} 方位描述：N/NE/E/SE/S/SW/W/NW
     * @memberof DronePositionsArchiveModel
     * @since 1.0.0
     */
    getHeadingDirection(): string {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(this.heading / 45) % 8;
        return directions[index];
    }
}