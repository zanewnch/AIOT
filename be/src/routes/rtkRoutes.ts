/**
 * @fileoverview RTK 定位資料路由配置
 *
 * 此文件定義了 RTK (Real-Time Kinematic) 定位資料相關的路由端點，包括：
 * - RTK 定位資料查詢
 * - RTK 定位資料更新
 * - 支援即時定位資料處理
 *
 * RTK 是一種高精度的 GPS 定位技術，能提供公分級的定位精度。
 * 所有端點都需要 JWT 認證。
 *
 * @module Routes/RtkRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { RTKController } from '../controllers/RTKController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * RTK 路由類別
 *
 * 負責配置和管理所有 RTK 定位資料相關的路由端點
 */
class RtkRoutes {
  private router: Router;
  private rtkController: RTKController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.rtkController = new RTKController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  /**
   * 初始化所有 RTK 路由
   */
  private initializeRoutes(): void {
    this.setupGetRTKDataRoute();
    this.setupUpdateRTKDataRoute();
  }

  /**
   * 設定取得 RTK 定位資料路由
   *
   * 此端點用於獲取系統中所有的 RTK 定位資料，包括經緯度、高度和時間戳記。
   * 支援分頁和過濾功能，適用於地理資訊系統和定位追蹤應用。
   * 需要 JWT 認證。
   *
   * @route GET /api/rtk/data
   * @group RTK - RTK 定位資料相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @returns {Array<Object>} 200 - RTK 定位資料列表
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupGetRTKDataRoute(): void {
    this.router.get('/api/rtk/data',
      this.authMiddleware.authenticate,
      this.rtkController.getAllRTKData
    );
  }

  /**
   * 設定更新 RTK 定位資料路由
   *
   * 此端點用於更新指定 ID 的 RTK 定位資料，包括經緯度、高度和時間戳記。
   * 適用於定位資料的修正和校準操作。需要 JWT 認證。
   *
   * @route PUT /api/rtk/data/:id
   * @param {string} id - RTK 資料唯一識別碼
   * @group RTK - RTK 定位資料相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @param {Object} body - 更新的 RTK 定位資料
   * @returns {Object} 200 - RTK 資料更新成功
   * @returns {Object} 400 - 請求參數錯誤
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 404 - RTK 資料不存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupUpdateRTKDataRoute(): void {
    this.router.put('/api/rtk/data/:id',
      this.authMiddleware.authenticate,
      this.rtkController.updateRTKData
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
 * 匯出 RTK 路由實例
 */
export const rtkRoutes = new RtkRoutes().getRouter();