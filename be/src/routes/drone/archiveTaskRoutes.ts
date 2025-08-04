/**
 * @fileoverview 歸檔任務路由定義
 * 
 * 此文件定義了歸檔任務相關的 HTTP 路由，
 * 提供歸檔任務管理的 RESTful API 端點。
 * 
 * @module Routes/ArchiveTaskRoutes
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from 'express';
import { ArchiveTaskController } from '../controllers/ArchiveTaskController';
import { createLogger } from '../utils/logger';

const logger = createLogger('ArchiveTaskRoutes');

/**
 * 歸檔任務路由類別
 * 
 * 負責配置和管理所有歸檔任務相關的路由端點
 */
class ArchiveTaskRoutes {
  private router: Router;
  private controller: ArchiveTaskController;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    ROOT: '/',
    DATA: '/data',
    BY_ID: '/:id',
    
    // 統計功能
    STATISTICS: '/statistics',
    
    // 批次操作
    BATCH: '/batch',
    CLEANUP: '/cleanup',
    
    // 任務控制
    EXECUTE: '/:id/execute',
    CANCEL: '/:id/cancel',
    RETRY: '/:id/retry'
  } as const;

  constructor() {
    this.router = Router();
    this.controller = new ArchiveTaskController();
    
    this.setupQueryRoutes();
    this.setupCreateRoutes();
    this.setupControlRoutes();
    this.setupCleanupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /data - 獲取歸檔任務資料（用於前端表格顯示）
    this.router.get(this.ROUTES.DATA, 
      (req, res) => {
        logger.debug('歸檔任務資料查詢路由被調用', { path: '/data' });
        this.controller.getTasksData(req, res);
      }
    );

    // GET /statistics - 獲取歸檔任務統計資訊
    this.router.get(this.ROUTES.STATISTICS, 
      (req, res) => {
        logger.debug('歸檔任務統計查詢路由被調用', { path: '/statistics' });
        this.controller.getTaskStatistics(req, res);
      }
    );

    // GET / - 獲取所有歸檔任務
    this.router.get(this.ROUTES.ROOT, 
      (req, res) => {
        logger.debug('歸檔任務列表查詢路由被調用', { 
          path: '/',
          query: req.query 
        });
        this.controller.getAllTasks(req, res);
      }
    );

    // GET /:id - 根據 ID 獲取歸檔任務
    this.router.get(this.ROUTES.BY_ID, 
      (req, res) => {
        logger.debug('歸檔任務詳情查詢路由被調用', { 
          path: '/:id',
          taskId: req.params.id 
        });
        this.controller.getTaskById(req, res);
      }
    );
  };

  /**
   * 設定創建路由
   */
  private setupCreateRoutes = (): void => {
    // POST /batch - 批次創建歸檔任務
    this.router.post(this.ROUTES.BATCH, 
      (req, res) => {
        logger.debug('批次創建歸檔任務路由被調用', { 
          path: '/batch',
          requestCount: req.body?.length 
        });
        this.controller.createBatchTasks(req, res);
      }
    );

    // POST / - 創建新的歸檔任務
    this.router.post(this.ROUTES.ROOT, 
      (req, res) => {
        logger.debug('創建歸檔任務路由被調用', { 
          path: '/',
          jobType: req.body?.jobType,
          tableName: req.body?.tableName 
        });
        this.controller.createTask(req, res);
      }
    );
  };

  /**
   * 設定任務控制路由
   */
  private setupControlRoutes = (): void => {
    // POST /:id/execute - 執行歸檔任務
    this.router.post(this.ROUTES.EXECUTE, 
      (req, res) => {
        logger.debug('執行歸檔任務路由被調用', { 
          path: '/:id/execute',
          taskId: req.params.id 
        });
        this.controller.executeTask(req, res);
      }
    );

    // POST /:id/cancel - 取消歸檔任務
    this.router.post(this.ROUTES.CANCEL, 
      (req, res) => {
        logger.debug('取消歸檔任務路由被調用', { 
          path: '/:id/cancel',
          taskId: req.params.id,
          reason: req.body?.reason 
        });
        this.controller.cancelTask(req, res);
      }
    );

    // POST /:id/retry - 重試歸檔任務
    this.router.post(this.ROUTES.RETRY, 
      (req, res) => {
        logger.debug('重試歸檔任務路由被調用', { 
          path: '/:id/retry',
          taskId: req.params.id 
        });
        this.controller.retryTask(req, res);
      }
    );
  };

  /**
   * 設定清理路由
   */
  private setupCleanupRoutes = (): void => {
    // DELETE /cleanup - 清理舊的歸檔任務記錄
    this.router.delete(this.ROUTES.CLEANUP, 
      (req, res) => {
        logger.debug('清理舊歸檔任務記錄路由被調用', { 
          path: '/cleanup',
          daysOld: req.query.daysOld,
          status: req.query.status 
        });
        this.controller.cleanupOldTasks(req, res);
      }
    );
  };

  /**
   * 設定錯誤處理中間件
   */
  private setupErrorHandling = (): void => {
    this.router.use((error: any, req: any, res: any, next: any) => {
      logger.error('歸檔任務路由處理錯誤', {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        data: null,
        message: `路由處理錯誤: ${error.message}`
      });
    });
  };

  /**
   * 取得路由器實例
   * 
   * @returns {Router} Express 路由器實例
   */
  public getRouter(): Router {
    // 記錄路由初始化完成
    logger.info('歸檔任務路由初始化完成', {
      routes: [
        'GET /data',
        'GET /statistics', 
        'GET /',
        'GET /:id',
        'POST /batch',
        'POST /:id/execute',
        'POST /:id/cancel',
        'POST /:id/retry',
        'POST /',
        'DELETE /cleanup'
      ]
    });

    return this.router;
  }
}

/**
 * 匯出歸檔任務路由實例
 */
export const archiveTaskRoutes = new ArchiveTaskRoutes().getRouter();

// 為了向下相容，也匯出預設實例
export default archiveTaskRoutes;