/**
 * RTKDataModel – RTK 即時動態定位資料表 Model
 * ============================================
 * 用於儲存 RTK（Real-Time Kinematic）全球定位系統的精確座標資料。
 * RTK 技術可提供公分級的定位精度，適用於精密測量和自動化設備定位。
 *
 * Table: rtk_data
 * ───────────────
 * id          BIGINT          – 主鍵，資料記錄唯一識別碼
 * latitude    FLOAT           – 緯度座標（度為單位，範圍 -90 到 90）
 * longitude   FLOAT           – 經度座標（度為單位，範圍 -180 到 180）
 * createdAt   TIMESTAMP       – 資料建立時間戳記
 * updatedAt   TIMESTAMP       – 資料最後更新時間戳記
 *
 * 使用範例：
 *   const rtkData = await RTKDataModel.create({
 *     latitude: 25.033964,
 *     longitude: 121.564468
 *   });
 *
 * 注意事項：
 * - 座標使用 WGS84 大地座標系統
 * - FLOAT 精度約為 7 位數，可滿足公分級定位需求
 * - 建議定期清理過期的歷史定位資料以節省儲存空間
 */
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    AllowNull,
} from 'sequelize-typescript';

import type { Optional } from 'sequelize';

/**
 * RTK 資料屬性介面
 * 定義 RTK 定位資料的完整屬性結構
 */
export type RTKDataAttributes = {
    /** 主鍵識別碼 */
    id: number;
    /** 緯度座標（度） */
    latitude: number;
    /** 經度座標（度） */
    longitude: number;
};

/**
 * RTK 資料建立屬性介面
 * 建立新記錄時 id 欄位為可選（自動產生）
 */
export type RTKDataCreationAttributes = Optional<RTKDataAttributes, 'id'>;

@Table({ tableName: 'rtk_data', timestamps: true })
export class RTKDataModel extends Model<RTKDataAttributes, RTKDataCreationAttributes> implements RTKDataAttributes {
    /**
     * 主鍵識別碼
     * 自動遞增的唯一識別碼
     */
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    declare id: number;

    /**
     * 緯度座標
     * 使用 WGS84 座標系統，範圍 -90 到 90 度
     */
    @AllowNull(false)
    @Column(DataType.FLOAT)
    declare latitude: number;

    /**
     * 經度座標
     * 使用 WGS84 座標系統，範圍 -180 到 180 度
     */
    @AllowNull(false)
    @Column(DataType.FLOAT)
    declare longitude: number;
}