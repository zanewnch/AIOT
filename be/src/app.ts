import express from 'express';
import { ErrorHandleMiddleware } from './middleware/errorHandleMiddleware.js';
import { createSequelizeInstance } from './configs/dbConfig.js';
import { RabbitMQManager } from './configs/rabbitmqConfig.js';
import { setupPassportJWT } from './configs/authConfig.js';
import { redisConfig } from './configs/redisConfig.js';
import { authRoutes } from './routes/authRoutes.js';
import { initRoutes } from './routes/initRoutes.js';
import { progressRoutes } from './routes/progressRoutes.js';
import { rtkRoutes } from './routes/rtkRoutes.js';
import { swaggerRoutes } from './routes/swaggerRoutes.js';
import { rbacRoutes } from './routes/rbacRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { setupExpressMiddleware } from './configs/serverConfig.js';

/**
 * Express 應用程式配置類別
 * 
 * 負責 Express 應用程式的配置、中間件設定、路由配置，
 * 以及數據庫、Redis、RabbitMQ 等外部服務的初始化。
 * 
 * @class App
 */
export class App {
  public app: express.Application;
  private sequelize: any;
  private rabbitMQManager: RabbitMQManager;

  constructor() {
    this.app = express();
    this.rabbitMQManager = new RabbitMQManager();
    
    // 初始化配置
    this.setupSequelize();
    this.setupPassport();
    this.setupMiddleware();
  }

  /**
   * 初始化 Sequelize 資料庫連線
   * @private
   */
  private setupSequelize(): void {
    this.sequelize = createSequelizeInstance();
  }

  /**
   * 初始化 RabbitMQ 連線
   * @private
   */
  private async setupRabbitMQ(): Promise<void> {
    await this.rabbitMQManager.connect();
  }

  /**
   * 初始化 Redis 連線
   * @private
   */
  private async setupRedis(): Promise<void> {
    await redisConfig.connect();
  }

  /**
   * 設定 Passport JWT 驗證
   * @private
   */
  private setupPassport(): void {
    setupPassportJWT();
  }

  /**
   * 設定 Express 中間件
   * @private
   */
  private setupMiddleware(): void {
    setupExpressMiddleware(this.app);
  }

  /**
   * 設定應用程式路由
   * 
   * 初始化所有控制器並設定對應的 API 路由。包括初始化、JWT 認證、
   * RBAC 權限管理和 Swagger 文檔等控制器的路由設定。
   * 
   * @private
   */
  private async setRoutes(): Promise<void> {
    // 設置路由
    this.app.use('/', initRoutes);
    this.app.use('/', authRoutes);
    this.app.use('/', rtkRoutes);
    this.app.use('/', swaggerRoutes);

    // 設置 RBAC 路由
    this.app.use('/api/rbac', rbacRoutes);

    // 設置進度追蹤路由
    this.app.use('/api/progress', progressRoutes);

    // 設置使用者相關路由 (偏好設定、功能開關、活動追蹤)
    this.app.use('/', userRoutes);

    console.log('✅ All controllers initialized and routes configured');
  }

  /**
   * 設定錯誤處理中間件
   * @private
   */
  private setupErrorHandling(): void {
    this.app.use(ErrorHandleMiddleware.notFound);
    this.app.use(ErrorHandleMiddleware.handle);
  }

  /**
   * 初始化應用程式
   * 
   * 完整的應用程式初始化流程，包括資料庫同步、外部服務連線、
   * 路由設定和錯誤處理配置。
   * 
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    try {
      // 同步資料庫
      await this.sequelize.sync();
      console.log('✅ Database synced');

      // 連線 Redis
      await this.setupRedis();
      console.log('✅ Redis connected');

      // 連線 RabbitMQ
      await this.setupRabbitMQ();
      console.log('✅ RabbitMQ ready');
      this.app.locals.rabbitMQChannel = this.rabbitMQManager.getChannel();

      // 設定路由
      await this.setRoutes();
      
      // 設定錯誤處理（必須在所有路由之後）
      this.setupErrorHandling();

      console.log('✅ App initialized successfully');
    } catch (err) {
      console.error('❌ App initialization failed', err);
      throw err;
    }
  }

  /**
   * 優雅關閉應用程式
   * 
   * 關閉所有外部連線和資源
   * 
   * @returns Promise<void>
   */
  async shutdown(): Promise<void> {
    try {
      console.log('🔌 Closing RabbitMQ connection...');
      await this.rabbitMQManager.close();

      console.log('🔴 Closing Redis connection...');
      await redisConfig.disconnect();

      console.log('🗃️ Closing database connection...');
      await this.sequelize.close();

      console.log('✅ App shutdown successfully');
    } catch (error) {
      console.error('❌ Error during app shutdown:', error);
      throw error;
    }
  }

  /**
   * 獲取 RabbitMQ 管理器實例
   * @returns RabbitMQManager
   */
  getRabbitMQManager(): RabbitMQManager {
    return this.rabbitMQManager;
  }

  /**
   * 獲取 Sequelize 實例
   * @returns any
   */
  getSequelize(): any {
    return this.sequelize;
  }
}