/**
 * @fileoverview 系統初始化路由配置
 *
 * 此文件定義了系統初始化相關的路由端點，包括：
 * - RBAC 演示資料初始化
 * - RTK 演示資料初始化
 * - 管理員帳號創建
 * - 壓力測試資料生成
 *
 * 這些路由主要用於系統初始化和開發階段的資料準備。
 *
 * @module Routes/InitRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { InitController } from '../controllers/InitController.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * 初始化路由類別
 *
 * 負責配置和管理所有系統初始化相關的路由端點
 */
class InitRoutes {
  private router: Router;
  private initController: InitController;

  constructor() {
    this.router = Router();
    this.initController = new InitController();
    this.initializeRoutes();
  }

  /**
   * 初始化所有初始化路由
   */
  private initializeRoutes(): void {
    this.setupRbacDemoRoute();
    this.setupRtkDemoRoute();
    this.setupAdminUserRoute();
    this.setupStressTestDataRoute();
  }

  /**
   * 設定 RBAC 演示資料初始化路由
   *
   * 此端點用於一次性插入 RBAC (Role-Based Access Control) 演示資料，
   * 包括角色、權限和使用者資料等。如果資料已存在，不會重複建立，
   * 確保資料的唯一性。
   *
   * @route POST /api/init/rbac-demo
   * @group Init - 系統初始化相關端點
   * @returns {Object} 200 - 成功回應
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupRbacDemoRoute(): void {
    this.router.post('/api/init/rbac-demo',
      this.initController.seedRbacDemo
    );
  }

  /**
   * 設定 RTK 演示資料初始化路由
   *
   * 此端點用於一次性插入 RTK (Redux Toolkit) 演示資料，
   * 包括待辦事項清單、使用者互動記錄等範例資料。
   * 如果資料已存在，不會重複建立，確保資料的唯一性。
   *
   * @route POST /api/init/rtk-demo
   * @group Init - 系統初始化相關端點
   * @returns {Object} 200 - 成功回應
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupRtkDemoRoute(): void {
    this.router.post('/api/init/rtk-demo',
      this.initController.seedRTKDemo
    );
  }

  /**
   * 設定系統管理員帳號創建路由
   *
   * 此端點用於創建系統預設管理員帳號，用於系統初始化和管理。
   * 預設帳號資訊：用戶名為 "admin"，密碼為 "admin"，
   * 具有完整的系統管理權限。
   *
   * @route POST /api/init/admin-user
   * @group Init - 系統初始化相關端點
   * @returns {Object} 200 - 成功回應
   * @returns {Object} 409 - 管理員帳號已存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupAdminUserRoute(): void {
    this.router.post('/api/init/admin-user',
      this.initController.createAdminUser
    );
  }

  /**
   * 設定壓力測試資料生成路由
   *
   * 此端點用於生成大量測試資料供系統壓力測試使用。
   * 包含 5000 筆 RTK 資料和 5000 筆使用者資料，
   * 返回 taskId 供進度追蹤使用。
   *
   * @route POST /api/init/stress-test-data
   * @group Init - 系統初始化相關端點
   * @returns {Object} 200 - 成功回應，包含 taskId
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupStressTestDataRoute(): void {
    this.router.post('/api/init/stress-test-data',
      this.initController.createStressTestData
    );
  }

  /**
   * 取得路由器實例
   *
   * @returns {Router} Express 路由器實例
   */
  public getRouter(): Router {
    return this.router;
  }
}

/**
 * 匯出初始化路由實例
 */
export const initRoutes = new InitRoutes().getRouter();