/**
 * @fileoverview 無人機指令表模型
 * 
 * 本文件定義了無人機指令系統的資料模型，
 * 用於管理無人機的各種指令，包含起飛、降落、移動、懸停、返航等操作。
 * 提供完整的指令狀態追蹤和執行監控功能，適用於無人機遠程控制系統。
 * 
 * 資料表欄位 (Table Columns):
 * - id: 主鍵識別碼 (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
 * - drone_id: 無人機外鍵 (BIGINT, NOT NULL, FOREIGN KEY) - 關聯到drones_status表
 * - queue_id: 佇列外鍵 (BIGINT, NULL, FOREIGN KEY) - 關聯到drone_command_queues表
 * - command_type: 指令類型 (ENUM, NOT NULL) - takeoff/land/hover/flyTo/moveForward/moveBackward/moveLeft/moveRight/rotateLeft/rotateRight/return/emergency
 * - command_data: 指令參數 (JSON, NULL) - 根據指令類型包含不同參數，如座標、距離、角度、速度等
 * - status: 指令狀態 (ENUM, NOT NULL) - pending/executing/completed/failed
 * - issued_by: 發送者 (BIGINT, NOT NULL) - 發送指令的使用者ID
 * - issued_at: 指令發送時間 (TIMESTAMP, NOT NULL) - 指令發送的時間戳記
 * - executed_at: 指令執行時間 (TIMESTAMP, NULL) - 指令開始執行的時間戳記
 * - completed_at: 指令完成時間 (TIMESTAMP, NULL) - 指令完成的時間戳記
 * - error_message: 錯誤訊息 (TEXT, NULL) - 執行失敗時的錯誤訊息
 * - createdAt: 建立時間 (TIMESTAMP, AUTO) - 記錄建立時間戳記，自動管理
 * - updatedAt: 更新時間 (TIMESTAMP, AUTO) - 記錄更新時間戳記，自動維護
 * 
 * @module DroneCommandModel
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

/**
 * 無人機指令類型枚舉
 * 
 * 定義無人機支援的指令類型，涵蓋基本飛行操作和高級控制功能
 * 
 * @enum {string}
 */
export enum DroneCommandType {
    // 基本飛行操作
    TAKEOFF = 'takeoff',         // 起飛
    LAND = 'land',               // 降落
    HOVER = 'hover',             // 懸停
    
    // 位置控制
    FLY_TO = 'flyTo',            // 飛行到指定座標位置
    RETURN = 'return',           // 返航到起飛點
    
    // 方向移動控制
    MOVE_FORWARD = 'moveForward',   // 前進
    MOVE_BACKWARD = 'moveBackward', // 後退
    MOVE_LEFT = 'moveLeft',         // 左移
    MOVE_RIGHT = 'moveRight',       // 右移
    
    // 旋轉控制
    ROTATE_LEFT = 'rotateLeft',     // 左轉（逆時針旋轉）
    ROTATE_RIGHT = 'rotateRight',   // 右轉（順時針旋轉）
    
    // 緊急控制
    EMERGENCY = 'emergency'         // 緊急停止/緊急降落
}

/**
 * 無人機指令狀態枚舉
 * 
 * 定義指令的執行狀態
 * 
 * @enum {string}
 */
export enum DroneCommandStatus {
    PENDING = 'pending',       // 待執行
    EXECUTING = 'executing',   // 執行中
    COMPLETED = 'completed',   // 已完成
    FAILED = 'failed'          // 執行失敗
}

/**
 * 無人機指令資料屬性介面
 * 
 * 定義無人機指令的完整屬性結構，包含所有必要的欄位定義。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface DroneCommandAttributes
 * @since 1.0.0
 */
export type DroneCommandAttributes = {
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
     * 佇列外鍵 - 暫時移除，資料庫表中不存在此欄位
     * @type {number | null} 關聯到 drone_command_queues 表的外鍵，可為空表示獨立指令
     */
    // queue_id: number | null;
    
    /** 
     * 指令類型
     * @type {DroneCommandType} 指令的類型（起飛、降落、移動等）
     */
    command_type: DroneCommandType;
    
    /** 
     * 指令參數
     * @type {object | null} JSON 格式的指令參數，根據不同指令類型包含不同的參數結構
     */
    command_data: object | null;
    
    /** 
     * 指令狀態
     * @type {DroneCommandStatus} 指令當前的執行狀態
     */
    status: DroneCommandStatus;
    
    /** 
     * 發送者
     * @type {number} 發送指令的用戶ID，關聯到 users 表
     */
    issued_by: number;
    
    /** 
     * 指令發送時間
     * @type {Date} 指令被發送的時間戳記
     */
    issued_at: Date;
    
    /** 
     * 指令執行時間
     * @type {Date | null} 指令開始執行的時間戳記，未執行時為 null
     */
    executed_at: Date | null;
    
    /** 
     * 指令完成時間
     * @type {Date | null} 指令完成的時間戳記，未完成時為 null
     */
    completed_at: Date | null;
    
    /** 
     * 錯誤訊息
     * @type {string | null} 指令執行失敗時的錯誤訊息
     */
    error_message: string | null;
    
    /** 
     * 建立時間
     * @type {Date} 指令記錄的建立時間戳記
     */
    createdAt: Date;
    
    /** 
     * 更新時間
     * @type {Date} 指令記錄的最後更新時間戳記
     */
    updatedAt: Date;
};

/**
 * 無人機指令資料建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 DroneCommandAttributes 並將 id 設為可選屬性。
 * 
 * @interface DroneCommandCreationAttributes
 * @extends {Optional<DroneCommandAttributes, 'id'>}
 * @since 1.0.0
 */
export type DroneCommandCreationAttributes = Optional<DroneCommandAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 無人機指令模型類別
 * 
 * 實作無人機指令管理的 Sequelize 模型，提供指令發送、狀態追蹤和執行監控功能。
 * 此模型對應資料庫中的 drone_commands 資料表，支援 CRUD 操作和自動時間戳記。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - drone_id: 無人機外鍵（BIGINT, 必填）
 * - command_type: 指令類型（ENUM, 必填）
 * - command_data: 指令參數（JSON, 可空）
 * - status: 指令狀態（ENUM, 必填）
 * - issued_by: 發送者（BIGINT, 必填）
 * - issued_at: 指令發送時間（DATETIME, 必填）
 * - executed_at: 指令執行時間（DATETIME, 可空）
 * - completed_at: 指令完成時間（DATETIME, 可空）
 * - error_message: 錯誤訊息（VARCHAR, 可空）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * @class DroneCommandModel
 * @extends {Model<DroneCommandAttributes, DroneCommandCreationAttributes>}
 * @implements {DroneCommandAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 1. 發送起飛指令
 * const takeoffCommand = await DroneCommandModel.create({
 *   drone_id: 1,
 *   command_type: DroneCommandType.TAKEOFF,
 *   command_data: { 
 *     altitude: 50,        // 起飛到50米高度
 *     speed: 2.5          // 起飛速度 2.5 m/s
 *   },
 *   status: DroneCommandStatus.PENDING,
 *   issued_by: 1,
 *   issued_at: new Date()
 * });
 * 
 * // 2. 發送飛行到指定位置指令
 * const flyToCommand = await DroneCommandModel.create({
 *   drone_id: 1,
 *   command_type: DroneCommandType.FLY_TO,
 *   command_data: {
 *     latitude: 25.033964,   // 台北101座標
 *     longitude: 121.564468,
 *     altitude: 100,         // 飛行高度100米
 *     speed: 5.0            // 飛行速度 5.0 m/s
 *   },
 *   status: DroneCommandStatus.PENDING,
 *   issued_by: 2,
 *   issued_at: new Date()
 * });
 * 
 * // 3. 發送方向移動指令
 * const moveForwardCommand = await DroneCommandModel.create({
 *   drone_id: 1,
 *   command_type: DroneCommandType.MOVE_FORWARD,
 *   command_data: {
 *     distance: 100,         // 前進100米
 *     speed: 3.0            // 移動速度 3.0 m/s
 *   },
 *   status: DroneCommandStatus.PENDING,
 *   issued_by: 1,
 *   issued_at: new Date()
 * });
 * 
 * // 4. 發送旋轉指令
 * const rotateCommand = await DroneCommandModel.create({
 *   drone_id: 1,
 *   command_type: DroneCommandType.ROTATE_RIGHT,
 *   command_data: {
 *     angle: 45             // 右轉45度
 *   },
 *   status: DroneCommandStatus.PENDING,
 *   issued_by: 1,
 *   issued_at: new Date()
 * });
 * 
 * // 5. 發送緊急停止指令
 * const emergencyCommand = await DroneCommandModel.create({
 *   drone_id: 1,
 *   command_type: DroneCommandType.EMERGENCY,
 *   command_data: {
 *     action: 'land'        // 緊急降落
 *   },
 *   status: DroneCommandStatus.PENDING,
 *   issued_by: 1,
 *   issued_at: new Date()
 * });
 * 
 * // 6. 查詢特定無人機的待執行指令
 * const pendingCommands = await DroneCommandModel.findAll({
 *   where: { 
 *     drone_id: 1,
 *     status: DroneCommandStatus.PENDING 
 *   },
 *   order: [['issued_at', 'ASC']]
 * });
 * 
 * // 7. 查詢特定類型的指令
 * const movementCommands = await DroneCommandModel.findAll({
 *   where: {
 *     drone_id: 1,
 *     command_type: {
 *       [Op.in]: [
 *         DroneCommandType.MOVE_FORWARD,
 *         DroneCommandType.MOVE_BACKWARD,
 *         DroneCommandType.MOVE_LEFT,
 *         DroneCommandType.MOVE_RIGHT
 *       ]
 *     }
 *   }
 * });
 * 
 * // 8. 統計指令執行情況
 * const commandStats = await DroneCommandModel.findAll({
 *   attributes: [
 *     'command_type',
 *     'status',
 *     [fn('COUNT', col('id')), 'count']
 *   ],
 *   where: { drone_id: 1 },
 *   group: ['command_type', 'status'],
 *   raw: true
 * });
 * ```
 */
@Table({ tableName: 'drone_commands', timestamps: true }) // 設定資料表名稱為 'drone_commands'，啟用時間戳記
export class DroneCommandModel extends Model<DroneCommandAttributes, DroneCommandCreationAttributes> implements DroneCommandAttributes {
    /**
     * 主鍵識別碼
     * 
     * 唯一識別每筆指令記錄的主鍵，由資料庫自動遞增生成。
     * 使用 BIGINT 型態以支援大量指令資料儲存。
     * 
     * @type {number}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @PrimaryKey              // 標記為主鍵
    @AutoIncrement           // 設定自動遞增
    @Column(DataType.BIGINT) // 定義為 BIGINT 型態
    declare id: number;

    /**
     * 無人機外鍵
     * 
     * 關聯到 drones_status 表的外鍵，標識此指令針對哪台無人機。
     * 
     * @type {number}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @ForeignKey(() => DroneStatusModel) // 設定外鍵關聯
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare drone_id: number;

    /**
     * 佇列外鍵
     * 
     * 關聯到 drone_command_queues 表的外鍵，可為空表示獨立指令。
     * 
     * @type {number | null}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    // 暫時註解掉，資料庫表中不存在此欄位
    // @AllowNull(true)          // 允許空值，表示可以是獨立指令
    // @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    // declare queue_id: number | null;

    /**
     * 指令類型
     * 
     * 指令的類型，包含 takeoff（起飛）、land（降落）、move（移動）、
     * hover（懸停）、return（返航）。
     * 
     * @type {DroneCommandType}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Column(DataType.ENUM(...Object.values(DroneCommandType)))                 // 定義為 ENUM 型態
    declare command_type: DroneCommandType;

    /**
     * 指令參數
     * 
     * JSON 格式的指令參數，根據不同指令類型包含不同的參數結構：
     * - takeoff: { altitude: number, speed?: number } - 起飛高度和速度
     * - land: { speed?: number } - 降落速度
     * - hover: { duration?: number } - 懸停持續時間（秒）
     * - flyTo: { latitude: number, longitude: number, altitude?: number, speed?: number } - 目標座標和飛行參數
     * - moveForward/moveBackward/moveLeft/moveRight: { distance?: number, speed?: number } - 移動距離和速度
     * - rotateLeft/rotateRight: { angle?: number } - 旋轉角度（度）
     * - return: { speed?: number } - 返航速度
     * - emergency: { action?: 'stop' | 'land' } - 緊急操作類型
     * 
     * @type {object | null}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.JSON)     // 定義為 JSON 型態
    declare command_data: object | null;

    /**
     * 指令狀態
     * 
     * 指令當前的執行狀態，包含 pending（待執行）、executing（執行中）、
     * completed（已完成）、failed（執行失敗）。
     * 
     * @type {DroneCommandStatus}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(false)                                                           // 設定為必填欄位
    @Column(DataType.ENUM(...Object.values(DroneCommandStatus)))               // 定義為 ENUM 型態
    declare status: DroneCommandStatus;

    /**
     * 發送者
     * 
     * 發送指令的用戶ID，關聯到 users 表，用於追蹤指令的發起者。
     * 
     * @type {number}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(false)         // 設定為必填欄位
    @Column(DataType.BIGINT)  // 定義為 BIGINT 型態
    declare issued_by: number;

    /**
     * 指令發送時間
     * 
     * 指令被發送到系統的時間戳記，用於指令排序和執行時間分析。
     * 
     * @type {Date}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(false)          // 設定為必填欄位
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare issued_at: Date;

    /**
     * 指令執行時間
     * 
     * 指令開始執行的時間戳記，未開始執行時為 null。
     * 用於計算指令的等待時間和執行延遲。
     * 
     * @type {Date | null}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare executed_at: Date | null;

    /**
     * 指令完成時間
     * 
     * 指令完成執行的時間戳記，未完成時為 null。
     * 用於計算指令的執行時間和系統性能分析。
     * 
     * @type {Date | null}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.DATE)     // 定義為 DATE 型態
    declare completed_at: Date | null;

    /**
     * 錯誤訊息
     * 
     * 當指令執行失敗時記錄的錯誤訊息，用於故障診斷和問題分析。
     * 
     * @type {string | null}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @AllowNull(true)           // 允許空值
    @Column(DataType.TEXT)     // 定義為 TEXT 型態以支援較長的錯誤訊息
    declare error_message: string | null;

    /**
     * 建立時間
     * 
     * 指令記錄的建立時間戳記，由 Sequelize 自動管理。
     * 此欄位用於記錄何時將此指令寫入資料庫。
     * 
     * @type {Date}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    /**
     * 更新時間
     * 
     * 指令記錄的最後更新時間戳記，由 Sequelize 自動管理。
     * 當指令狀態發生變化時會自動更新此欄位。
     * 
     * @type {Date}
     * @memberof DroneCommandModel
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
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    @BelongsTo(() => DroneStatusModel)
    declare drone: DroneStatusModel;

    /**
     * 關聯到指令佇列表
     * 
     * 建立與 DroneCommandQueueModel 的多對一關聯關係。
     * 使用延遲載入避免循環引用。
     * 
     * @type {any}
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    // @BelongsTo(() => DroneCommandQueueModel, { foreignKey: 'queue_id' })
    // declare queue: any;

    /**
     * 計算指令等待時間
     * 
     * 計算從指令發送到開始執行的等待時間（毫秒）。
     * 
     * @returns {number | null} 等待時間（毫秒），未執行時返回 null
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    getWaitTime(): number | null {
        if (!this.executed_at) return null;
        return this.executed_at.getTime() - this.issued_at.getTime();
    }

    /**
     * 計算指令執行時間
     * 
     * 計算從開始執行到完成的執行時間（毫秒）。
     * 
     * @returns {number | null} 執行時間（毫秒），未完成時返回 null
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    getExecutionTime(): number | null {
        if (!this.executed_at || !this.completed_at) return null;
        return this.completed_at.getTime() - this.executed_at.getTime();
    }

    /**
     * 計算指令總時間
     * 
     * 計算從發送到完成的總時間（毫秒）。
     * 
     * @returns {number | null} 總時間（毫秒），未完成時返回 null
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    getTotalTime(): number | null {
        if (!this.completed_at) return null;
        return this.completed_at.getTime() - this.issued_at.getTime();
    }

    /**
     * 檢查指令是否已完成
     * 
     * 檢查指令是否處於完成狀態（completed 或 failed）。
     * 
     * @returns {boolean} 指令是否已完成
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    isCompleted(): boolean {
        return this.status === DroneCommandStatus.COMPLETED || this.status === DroneCommandStatus.FAILED;
    }

    /**
     * 檢查指令是否成功
     * 
     * 檢查指令是否成功完成。
     * 
     * @returns {boolean} 指令是否成功
     * @memberof DroneCommandModel
     * @since 1.0.0
     */
    isSuccessful(): boolean {
        return this.status === DroneCommandStatus.COMPLETED;
    }
}