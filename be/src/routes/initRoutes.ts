import { Router } from 'express';
import { InitController } from '../controller/InitController.js';
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js';

/**
 * 系統初始化相關路由配置
 * 
 * 處理系統初始化功能的路由設定，包括演示資料初始化、
 * 管理員帳號創建、壓力測試資料生成等功能。
 * 
 * @module Routes
 */

const router = Router();
const initController = new InitController();

/**
 * POST /api/init/rbac-demo
 * -------------------------------------------------
 * 一次性插入 RBAC demo 資料。
 * 如果資料已存在，不會重覆建立，仍回傳 200。
 */
router.post('/api/init/rbac-demo', 
  initController.seedRbacDemo
);

/**
 * POST /api/init/rtk-demo
 * -------------------------------------------------
 * 一次性插入 RTK demo 資料。
 * 如果資料已存在，不會重覆建立，仍回傳 200。
 */
router.post('/api/init/rtk-demo', 
  initController.seedRTKDemo
);

/**
 * POST /api/init/admin-user
 * -------------------------------------------------
 * 創建系統管理員帳號。
 * 用戶名：admin，密碼：admin，具有完整系統權限。
 */
router.post('/api/init/admin-user', 
  initController.createAdminUser
);

/**
 * POST /api/init/stress-test-data
 * -------------------------------------------------
 * 生成大量測試資料供壓力測試使用。
 * 包含 5000 筆 RTK 資料和 5000 筆使用者資料。
 * 返回 taskId 供進度追蹤使用。
 */
router.post('/api/init/stress-test-data', 
  initController.createStressTestData
);

export { router as initRoutes };