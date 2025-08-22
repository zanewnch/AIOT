/**
 * @fileoverview AIOT 系統應用程式主體配置檔案
 *
 * 此檔案定義了 AIOT 系統的核心應用程式類別 App，負責：
 * - Express 應用程式的建立和配置
 * - 中間件的設定和管理
 * - 路由的註冊和配置
 * - 外部服務的連線管理（資料庫、Redis、RabbitMQ）
 * - 應用程式的生命週期管理（初始化、關閉）
 * - 錯誤處理機制的設定
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata'; // InversifyJS 需要的元數據反射
import express from 'express'; // Express 框架，用於建立 HTTP 伺服器應用程式
import { injectable, inject } from 'inversify'; // InversifyJS 依賴注入裝飾器
import { ErrorHandleMiddleware } from './middlewares/ErrorHandleMiddleware.js'; // 錯誤處理中間件
import { setupExpressMiddleware } from './configs/serverConfig.js'; // Express 中間件配置
import { redisConfig } from 'aiot-shared-packages'; // Redis 連線配置
import { RouteManager } from './routes/index.js'; // 統一路由管理
// InversifyJS 容器和類型
import { ContainerUtils } from './container/container.js';
import { TYPES } from './container/types.js';
// 業務服務類型
import { RabbitMQManager } from './configs/rabbitmqConfig.js';
import { ConsulConfig } from './configs/consulConfig.js';
// WebSocket 功能已遷移到 drone-websocket-service
// import type {
//     IDroneEventHandler,
//     IWebSocketService,
//     IWebSocketAuthMiddleware
// } from './types/websocket-interfaces.js';
import { DronePositionQueriesSvc } from './services/queries/DronePositionQueriesSvc.js';
import { DronePositionCommandsSvc } from './services/commands/DronePositionCommandsSvc.js';

/**
 * Express 應用程式配置類別 (重構版 - 使用 InversifyJS 依賴注入)
 *
 * 此類別是 AIOT 系統的核心應用程式類別，負責管理整個 Express 應用程式的生命週期，包括：
 *
 * **核心功能：**
 * - Express 應用程式實例的建立和配置
 * - 中間件的設定和管理（CORS、日誌、解析等）
 * - API 路由的註冊和配置
 * - 身份驗證和授權機制的設定
 * - 錯誤處理機制的配置
 *
 * **外部服務整合：**
 * - 資料庫連線管理（Sequelize ORM）- 透過依賴注入
 * - Redis 快取服務連線
 * - RabbitMQ 訊息佇列服務連線 - 透過依賴注入
 * - Consul 服務註冊 - 透過依賴注入
 *
 * **生命週期管理：**
 * - 應用程式初始化流程
 * - 優雅關閉機制
 * - 資源清理和連線釋放
 *
 * **重構改進：**
 * - 使用 InversifyJS 進行依賴注入，提升可測試性
 * - 移除直接實例化依賴的構造方式
 * - 統一通過 IoC 容器管理所有外部服務
 *
 * @class App
 * @example
 * ```typescript
 * // 透過容器創建 App 實例
 * const app = container.get<App>(TYPES.App);
 * await app.initialize();
 * ```
 *
 * @since 1.0.0
 * @public
 */
@injectable()
export class App {
    /**
     * Express 應用程式實例
     * 此屬性暴露給外部使用，通常用於建立 HTTP 伺服器
     * @public
     * @type {express.Application}
     */
    public app: express.Application;

    /**
     * 建構函式 - 使用依賴注入初始化 Express 應用程式
     *
     * **重構改進：**
     * - 透過 InversifyJS 注入所有外部依賴
     * - 移除手動實例化依賴的方式
     * - 提高可測試性和鬆耦合度
     *
     * @constructor
     * @param {any} sequelize - Sequelize 資料庫 ORM 實例（透過依賴注入）
     * @param {RabbitMQManager} rabbitMQManager - RabbitMQ 訊息佇列管理器（透過依賴注入）  
     * @param {ConsulConfig} consulConfig - Consul 服務註冊配置（透過依賴注入）
     * @throws {Error} 當任何初始化步驟失敗時拋出錯誤
     */
    constructor(
        @inject(TYPES.DatabaseConnection) private sequelize: any,
        @inject(TYPES.RabbitMQManager) private rabbitMQManager: RabbitMQManager,
        @inject(TYPES.ConsulConfig) private consulConfig: ConsulConfig
    ) {
        this.app = express(); // 建立 Express 應用程式實例

        // 執行基本配置設定
        this.setupMiddleware(); // 設定基本中間件  
        this.initializeBusinessServices(); // 初始化業務服務實例
    }

    /**
     * 初始化業務服務實例
     * 
     * WebSocket 功能已移到獨立的 drone-websocket-service，
     * 此服務專注於 HTTP API 和資料處理功能
     *
     * @private
     */
    private initializeBusinessServices(): void {
        console.log('🔧 Initializing business services...');
        console.log('ℹ️  WebSocket functionality moved to drone-websocket-service');
        console.log('✅ Business services initialized');
    }


    /**
     * 初始化 RabbitMQ 連線
     *
     * 連線到 RabbitMQ 伺服器並建立訊息佇列通道。
     * 此方法會在應用程式初始化過程中執行。
     *
     * @private
     * @async
     * @method setupRabbitMQ
     * @returns {Promise<void>} 連線完成的 Promise
     * @throws {Error} 當連線失敗時拋出錯誤
     */
    private async setupRabbitMQ(): Promise<void> {
        await this.rabbitMQManager.connect(); // 連線到 RabbitMQ 伺服器
    }

    /**
     * 初始化 Redis 連線
     *
     * 連線到 Redis 伺服器，用於快取和 session 管理。
     * 此方法會在應用程式初始化過程中執行。
     *
     * @private
     * @async
     * @method setupRedis
     * @returns {Promise<void>} 連線完成的 Promise
     * @throws {Error} 當連線失敗時拋出錯誤
     */
    private async setupRedis(): Promise<void> {
        await redisConfig.connect(); // 連線到 Redis 伺服器
    }


    /**
     * 設定 Express 中間件
     *
     * 配置 Express 應用程式的基本中間件，包括：
     * - CORS 設定
     * - 請求解析器（JSON、URL-encoded）
     * - 日誌記錄
     * - 安全性中間件
     *
     * @private
     * @method setupMiddleware
     * @returns {void}
     */
    private setupMiddleware(): void {
        setupExpressMiddleware(this.app); // 設定 Express 中間件
    }

    /**
     * 設定應用程式路由
     *
     * 使用統一的路由管理系統註冊所有 API 路由到 Express 應用程式中。
     * 路由註冊邏輯已集中管理在 routes/index.ts 中，包括：
     *
     * **基礎路由：**
     * - 首頁路由、初始化路由、身份驗證路由等
     * - RTK 路由、Swagger API 文件路由等
     *
     * **功能路由：**
     * - RBAC 角色權限管理 API
     * - 進度追蹤路由、使用者管理路由等
     *
     * **開發工具路由：**
     * - 僅在開發環境中註冊的開發工具路由
     *
     * @private
     * @async
     * @method setRoutes
     * @returns {Promise<void>} 路由設定完成的 Promise
     */
    private async setRoutes(): Promise<void> {
        // 使用 IoC 容器獲取路由管理器並註冊所有路由
        const routeManager = ContainerUtils.get<RouteManager>(TYPES.RouteManager);
        routeManager.registerAllRoutes(this.app);
    }

    /**
     * 設定錯誤處理中間件
     *
     * 註冊全域錯誤處理中間件，必須在所有路由註冊之後執行。
     * 包括：
     * - 404 錯誤處理：處理找不到路由的請求
     * - 全域錯誤處理：處理應用程式中的所有錯誤
     *
     * @private
     * @method setupErrorHandling
     * @returns {void}
     */
    private setupErrorHandling(): void {
        this.app.use(ErrorHandleMiddleware.notFound); // 註冊 404 錯誤處理中間件
        this.app.use(ErrorHandleMiddleware.handle); // 註冊全域錯誤處理中間件
    }


    /**
     * 初始化應用程式
     *
     * 執行完整的應用程式初始化流程，此方法會依序執行以下步驟：
     *
     * **1. 資料庫初始化：**
     * - 同步 Sequelize 資料庫結構
     * - 建立必要的資料表和關聯
     *
     * **2. 外部服務連線：**
     * - 連線到 Redis 快取服務
     * - 連線到 RabbitMQ 訊息佇列服務
     * - 將 RabbitMQ 通道設定為應用程式全域變數
     *
     * **3. 應用程式配置：**
     * - 註冊所有 API 路由
     * - 設定錯誤處理中間件
     *
     * **注意：** WebSocket 功能已移到獨立的 drone-websocket-service
     *
     * @public
     * @async
     * @method initialize
     * @returns {Promise<void>} 初始化完成的 Promise
     * @throws {Error} 當任何初始化步驟失敗時拋出錯誤
     *
     * @example
     * ```typescript
     * const app = new App();
     * await app.initialize();
     * console.log('Application ready to serve requests');
     * ```
     */
    async initialize(): Promise<void> {
        try {
            // 步驟 1：同步資料庫結構
            await this.sequelize.sync(); // 同步 Sequelize 資料庫模型到實際資料庫
            console.log('✅ Database synced'); // 輸出資料庫同步完成訊息

            // 步驟 2：連線 Redis 快取服務
            await this.setupRedis(); // 建立 Redis 連線
            console.log('✅ Redis connected'); // 輸出 Redis 連線成功訊息

            // 步驟 3：連線 RabbitMQ 訊息佇列服務
            await this.setupRabbitMQ(); // 建立 RabbitMQ 連線
            console.log('✅ RabbitMQ ready'); // 輸出 RabbitMQ 準備就緒訊息
            this.app.locals.rabbitMQChannel = this.rabbitMQManager.getChannel(); // 將 RabbitMQ 通道設為全域變數

            // 步驟 4：設定應用程式路由
            await this.setRoutes(); // 註冊所有 API 路由

            // 步驟 5：設定錯誤處理（必須在所有路由之後）
            this.setupErrorHandling(); // 註冊錯誤處理中間件

            // 步驟 6：註冊到 Consul
            await this.consulConfig.registerService();

            console.log('✅ App initialized successfully'); // 輸出應用程式初始化完成訊息
        } catch (err) {
            console.error('❌ App initialization failed', err); // 輸出初始化失敗錯誤
            throw err; // 重新拋出錯誤供上層處理
        }
    }

    /**
     * 優雅關閉應用程式
     *
     * 執行有序的應用程式關閉程序，確保所有外部連線和資源都被正確清理。
     * 關閉順序很重要，通常遵循以下原則：
     * 1. 先關閉訊息佇列服務（停止處理新任務）
     * 2. 再關閉快取服務
     * 3. 最後關閉資料庫連線
     *
     * 此方法確保系統能夠安全地終止，避免資料遺失或資源洩漏。
     *
     * @public
     * @async
     * @method shutdown
     * @returns {Promise<void>} 關閉完成的 Promise
     * @throws {Error} 當關閉過程發生錯誤時拋出
     *
     * @example
     * ```typescript
     * // 在伺服器關閉時呼叫
     * await app.shutdown();
     * ```
     */
    async shutdown(): Promise<void> {
        try {
            // 步驟 1：從 Consul 註銷服務
            if (this.consulConfig) {
                console.log('🗂️  Deregistering from Consul...');
                await this.consulConfig.deregisterService();
            }


            // 步驟 1：關閉 RabbitMQ 連線
            console.log('🔌 Closing RabbitMQ connection...');
            await this.rabbitMQManager.close(); // 關閉 RabbitMQ 連線和通道

            // 步驟 2：關閉 Redis 連線
            console.log('🔴 Closing Redis connection...');
            await redisConfig.disconnect(); // 斷開 Redis 連線

            // 步驟 3：關閉資料庫連線
            console.log('🗃️ Closing database connection...');
            await this.sequelize.close(); // 關閉 Sequelize 資料庫連線

            console.log('✅ App shutdown successfully'); // 輸出成功關閉訊息
        } catch (error) {
            console.error('❌ Error during app shutdown:', error); // 輸出關閉錯誤訊息
            throw error; // 重新拋出錯誤供上層處理
        }
    }

    /**
     * 獲取 RabbitMQ 管理器實例
     *
     * 提供對 RabbitMQ 管理器的外部存取，用於訊息佇列操作。
     *
     * @public
     * @method getRabbitMQManager
     * @returns {RabbitMQManager} RabbitMQ 管理器實例
     *
     * @example
     * ```typescript
     * const rabbitmq = app.getRabbitMQManager();
     * const channel = rabbitmq.getChannel();
     * ```
     */
    getRabbitMQManager(): RabbitMQManager {
        return this.rabbitMQManager; // 返回 RabbitMQ 管理器實例
    }

    /**
     * 獲取 Sequelize 實例
     *
     * 提供對 Sequelize ORM 實例的外部存取，用於資料庫操作。
     *
     * @public
     * @method getSequelize
     * @returns {any} Sequelize 實例
     *
     * @example
     * ```typescript
     * const sequelize = app.getSequelize();
     * await sequelize.transaction(async (t) => {
     *   // 執行資料庫交易
     * });
     * ```
     */
    getSequelize(): any {
        return this.sequelize; // 返回 Sequelize 實例
    }


    /**
     * 無人機命令服務已重構為 CQRS 模式
     * 請使用 DroneCommandQueriesSvc 和 DroneCommandCommandsSvc
     */

    /**
     * 獲取無人機位置查詢服務實例（透過 IoC 容器）
     *
     * @public
     * @method getDronePositionQueriesSvc
     * @returns {DronePositionQueriesSvc} 無人機位置查詢服務實例
     */
    getDronePositionQueriesSvc(): DronePositionQueriesSvc {
        return ContainerUtils.get<DronePositionQueriesSvc>(TYPES.DronePositionQueriesSvc);
    }

    /**
     * 獲取無人機位置命令服務實例（透過 IoC 容器）
     *
     * @public
     * @method getDronePositionCommandsSvc
     * @returns {DronePositionCommandsSvc} 無人機位置命令服務實例
     */
    getDronePositionCommandsSvc(): DronePositionCommandsSvc {
        return ContainerUtils.get<DronePositionCommandsSvc>(TYPES.DronePositionCommandsSvc);
    }

    /**
     * 獲取無人機狀態服務實例（透過 IoC 容器）
     * TODO: 需要定義 IDroneStatusService 介面
     *
     * @public
     * @method getDroneStatusService
     * @returns {any} 無人機狀態服務實例
     */
    // getDroneStatusService(): any {
    //     return ContainerUtils.get<any>(TYPES.DroneStatusService);
    // }
}