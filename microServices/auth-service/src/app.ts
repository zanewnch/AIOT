/**
 * @fileoverview RBAC 微服務應用程式配置檔案
 *
 * 此檔案定義了 RBAC 微服務的核心應用程式類別 App，負責：
 * - Express 應用程式的建立和配置
 * - 中間件的設定和管理
 * - RBAC 路由的註冊和配置
 * - 外部服務的連線管理（資料庫、Redis）
 * - 應用程式的生命週期管理（初始化、關閉）
 * - 錯誤處理機制的設定
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata'; // InversifyJS 需要的元數據反射
import express from 'express'; // Express 框架，用於建立 HTTP 伺服器應用程式
import { ErrorHandleMiddleware } from './middlewares/ErrorHandleMiddleware.js'; // 錯誤處理中間件
import { createSequelizeInstance } from './configs/dbConfig.js'; // 資料庫連線配置
import { setupPassportJWT } from './configs/authConfig.js'; // JWT 身份驗證配置
import { redisConfig } from 'aiot-shared-packages'; // Redis 快取配置
import { registerRoutes } from './routes/index.js'; // 統一路由管理
import { setupExpressMiddleware } from './configs/serverConfig.js'; // Express 中間件設定
// JWT 黑名單中間件不存在於 auth-service
// InversifyJS 容器和類型
import { container } from './container/container.js';
// Consul 服務註冊
import { ConsulConfig } from './configs/consulConfig.js';

/**
 * Express 應用程式配置類別
 *
 * 此類別是 RBAC 微服務的核心應用程式類別，負責管理整個 Express 應用程式的生命週期，包括：
 *
 * **核心功能：**
 * - Express 應用程式實例的建立和配置
 * - 中間件的設定和管理（CORS、日誌、解析等）
 * - API 路由的註冊和配置
 * - 身份驗證和授權機制的設定
 * - 錯誤處理機制的配置
 *
 * **外部服務整合：**
 * - 資料庫連線管理（Sequelize ORM）
 * - Redis 快取服務連線
 *
 * **生命週期管理：**
 * - 應用程式初始化流程
 * - 優雅關閉機制
 * - 資源清理和連線釋放
 *
 * @class App
 * @example
 * ```typescript
 * const app = new App();
 * await app.initialize();
 * // 使用 app.app 作為 HTTP 伺服器的處理器
 * ```
 *
 * @since 1.0.0
 * @public
 */
export class App {
    /**
     * Express 應用程式實例
     * 此屬性暴露給外部使用，通常用於建立 HTTP 伺服器
     * @public
     * @type {express.Application}
     */
    public app: express.Application;

    /**
     * 資料庫連線實例（Sequelize）
     * 負責 ORM 操作和資料庫連線管理
     * @private
     * @type {any}
     */
    private sequelize: any;

    /**
     * Redis 連線實例
     * 用於快取和會話管理
     * @private
     * @type {any}
     */
    private redis: any;

    /**
     * 應用程式是否已初始化的標記
     * 避免重複初始化造成的資源浪費和錯誤
     * @private
     * @type {boolean}
     */
    private initialized: boolean = false;

    /**
     * Consul 服務註冊實例
     * @private
     * @type {ConsulService}
     */
    private consulConfig: ConsulConfig;

    /**
     * App 類別建構函數
     * 建立 Express 應用程式實例，但不進行初始化
     * 實際的服務初始化需要呼叫 initialize() 方法
     */
    constructor() {
        // 建立基本的 Express 應用程式實例
        this.app = express();
        // 初始化 Consul 服務
        this.consulConfig = new ConsulConfig();
        console.log('🏗️  Express application instance created');
    }

    /**
     * 應用程式初始化方法
     *
     * **執行順序：**
     * 1. 檢查重複初始化
     * 2. 初始化外部服務連線（資料庫、Redis）
     * 3. 設定 Express 中間件
     * 4. 設定身份驗證（Passport JWT）
     * 5. 註冊 API 路由
     * 6. 設定錯誤處理中間件
     * 7. 標記初始化完成
     *
     * @async
     * @method initialize
     * @returns {Promise<void>} 初始化完成的 Promise
     * @throws {Error} 當任何初始化步驟失敗時拋出錯誤
     *
     * @example
     * ```typescript
     * const app = new App();
     * await app.initialize();
     * console.log('✅ Application ready to serve requests');
     * ```
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('⚠️  Application already initialized, skipping...');
            return;
        }

        try {
            console.log('🚀 Initializing RBAC application...');

            // 步驟 1：初始化外部服務連線
            await this.initializeServices();

            // 步驟 2：設定 Express 中間件
            await this.setMiddleware();

            // 步驟 3：設定身份驗證
            await this.setAuthentication();

            // 步驟 4：註冊 API 路由
            await this.setRoutes();

            // 步驟 5：設定錯誤處理中間件
            await this.setErrorHandling();

            // 標記初始化完成
            this.initialized = true;

            // 註冊到 Consul
            await this.consulConfig.registerService();

            console.log('✅ Auth application initialization completed successfully');
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            throw error; // 重新拋出錯誤，讓呼叫者知道初始化失敗
        }
    }

    /**
     * 初始化外部服務連線
     *
     * 建立和配置所有外部服務的連線，包括：
     * - 資料庫連線（Sequelize ORM）
     * - Redis 快取連線
     *
     * @private
     * @async
     * @method initializeServices
     * @returns {Promise<void>} 服務初始化完成的 Promise
     * @throws {Error} 當任何服務連線失敗時拋出錯誤
     */
    private async initializeServices(): Promise<void> {
        console.log('🔧 Initializing external services...');

        try {
            // 初始化資料庫連線
            console.log('📊 Connecting to database...');
            this.sequelize = createSequelizeInstance();
            await this.sequelize.authenticate();
            console.log('✅ Database connection established');

            // 初始化 Redis 連線
            console.log('💾 Connecting to Redis...');
            await redisConfig.connect();
            this.redis = redisConfig;
            console.log('✅ Redis connection established');

            // 初始化 JWT 黑名單服務
            console.log('🔐 Initializing JWT blacklist service...');
            // JWT 黑名單功能已移至 Gateway 層
            console.log('✅ JWT blacklist service initialized');

            console.log('✅ All external services initialized');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * 設定 Express 中間件
     *
     * 配置所有必要的 Express 中間件，包括：
     * - CORS 設定
     * - JSON 和 URL 編碼解析器
     * - Cookie 解析器
     * - 請求記錄
     * - 靜態檔案服務（如需要）
     *
     * @private
     * @async
     * @method setMiddleware
     * @returns {Promise<void>} 中間件設定完成的 Promise
     */
    private async setMiddleware(): Promise<void> {
        console.log('⚙️  Setting up Express middleware...');
        setupExpressMiddleware(this.app);
        console.log('✅ Express middleware configured');
    }

    /**
     * 設定身份驗證機制
     *
     * 初始化和配置身份驗證相關組件：
     * - Passport JWT 策略設定
     * - 身份驗證中間件註冊
     *
     * @private
     * @async
     * @method setAuthentication
     * @returns {Promise<void>} 身份驗證設定完成的 Promise
     */
    private async setAuthentication(): Promise<void> {
        console.log('🔐 Setting up authentication...');
        setupPassportJWT();
        console.log('✅ Authentication configured');
    }

    /**
     * 設定 API 路由
     *
     * 註冊所有 RBAC 相關的 API 路由端點：
     * - 使用者管理路由
     * - 角色管理路由
     * - 權限管理路由
     * - 認證路由
     *
     * @private
     * @async
     * @method setRoutes
     * @returns {Promise<void>} 路由設定完成的 Promise
     */
    private async setRoutes(): Promise<void> {
        console.log('🛣️  Setting up API routes...');
        registerRoutes(this.app, container);
        console.log('✅ API routes configured');
    }

    /**
     * 設定錯誤處理中間件
     *
     * 配置全域錯誤處理機制，確保所有未捕獲的錯誤都能被適當處理和記錄
     *
     * @private
     * @async
     * @method setErrorHandling
     * @returns {Promise<void>} 錯誤處理設定完成的 Promise
     */
    private async setErrorHandling(): Promise<void> {
        console.log('🛡️  Setting up error handling...');
        this.app.use(ErrorHandleMiddleware.handle);
        console.log('✅ Error handling configured');
    }

    /**
     * 優雅關閉應用程式
     *
     * 依序關閉所有服務連線和清理資源：
     * 1. 關閉 Redis 連線
     * 2. 關閉資料庫連線
     * 3. 清理其他資源
     *
     * **注意：** 此方法會等待所有進行中的操作完成後才關閉連線
     *
     * @async
     * @method shutdown
     * @returns {Promise<void>} 關閉完成的 Promise
     *
     * @example
     * ```typescript
     * process.on('SIGTERM', async () => {
     *   await app.shutdown();
     *   process.exit(0);
     * });
     * ```
     */
    async shutdown(): Promise<void> {
        console.log('🛑 Gracefully shutting down application...');

        try {
            // 步驟 1：從 Consul 註銷服務
            if (this.consulConfig) {
                console.log('🗂️  Deregistering from Consul...');
                await this.consulConfig.deregisterService();
            }

            // 步驟 2：關閉 Redis 連線
            if (this.redis) {
                console.log('💾 Closing Redis connection...');
                await this.redis.quit();
                console.log('✅ Redis connection closed');
            }

            // 步驟 2：關閉資料庫連線
            if (this.sequelize) {
                console.log('📊 Closing database connection...');
                await this.sequelize.close();
                console.log('✅ Database connection closed');
            }

            // 標記應用程式為未初始化狀態
            this.initialized = false;

            console.log('✅ Application shutdown completed');
        } catch (error) {
            console.error('❌ Error during application shutdown:', error);
            throw error;
        }
    }

    /**
     * 檢查應用程式是否已初始化
     *
     * @method isInitialized
     * @returns {boolean} true 如果應用程式已初始化，否則為 false
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 獲取容器實例
     *
     * 提供對 IoC 容器的存取，用於獲取已註冊的服務實例
     *
     * @method getContainer
     * @returns {Container} InversifyJS 容器實例
     */
    getContainer() {
        return container;
    }

    /**
     * 獲取容器統計資訊
     *
     * 提供容器中已註冊服務的統計資訊，用於監控和除錯
     *
     * @method getContainerStats
     * @returns {object} 容器統計資訊
     */
    getContainerStats() {
        return {
            registeredServices: container.isBound.length || 0,
            timestamp: new Date().toISOString()
        };
    }
}