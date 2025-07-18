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

import { Router } from 'express'; // 引入 Express 路由器模組
import { InitController } from '../controller/InitController.js'; // 引入初始化控制器
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js'; // 引入錯誤處理中間件

/**
 * 創建 Express 路由器實例
 * 用於定義系統初始化相關的路由端點
 */
const router = Router();

/**
 * 創建初始化控制器實例
 * 處理系統初始化相關的業務邏輯
 */
const initController = new InitController();

/**
 * 初始化 RBAC 演示資料
 * 
 * 此端點用於一次性插入 RBAC (Role-Based Access Control) 演示資料，
 * 包括角色、權限和使用者資料等。如果資料已存在，不會重複建立，
 * 確保資料的唯一性。
 * 
 * @route POST /api/init/rbac-demo
 * @group Init - 系統初始化相關端點
 * @returns {Object} 200 - 成功回應
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/init/rbac-demo
 * 
 * Response:
 * {
 *   "message": "RBAC demo data initialized successfully",
 *   "success": true
 * }
 */
router.post('/api/init/rbac-demo', 
  initController.seedRbacDemo // 執行 RBAC 演示資料種子資料初始化
);

/**
 * 初始化 RTK 演示資料
 * 
 * 此端點用於一次性插入 RTK (Redux Toolkit) 演示資料，
 * 包括待辦事項清單、使用者互動記錄等範例資料。
 * 如果資料已存在，不會重複建立，確保資料的唯一性。
 * 
 * @route POST /api/init/rtk-demo
 * @group Init - 系統初始化相關端點
 * @returns {Object} 200 - 成功回應
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/init/rtk-demo
 * 
 * Response:
 * {
 *   "message": "RTK demo data initialized successfully",
 *   "success": true
 * }
 */
router.post('/api/init/rtk-demo', 
  initController.seedRTKDemo // 執行 RTK 演示資料種子資料初始化
);

/**
 * 創建系統管理員帳號
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
 * 
 * @example
 * POST /api/init/admin-user
 * 
 * Response:
 * {
 *   "message": "Admin user created successfully",
 *   "success": true,
 *   "user": {
 *     "username": "admin",
 *     "role": "admin"
 *   }
 * }
 */
router.post('/api/init/admin-user', 
  initController.createAdminUser // 執行系統管理員帳號創建
);

/**
 * 生成壓力測試資料
 * 
 * 此端點用於生成大量測試資料供系統壓力測試使用。
 * 包含 5000 筆 RTK 資料和 5000 筆使用者資料，
 * 返回 taskId 供進度追蹤使用。
 * 
 * @route POST /api/init/stress-test-data
 * @group Init - 系統初始化相關端點
 * @returns {Object} 200 - 成功回應，包含 taskId
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/init/stress-test-data
 * 
 * Response:
 * {
 *   "message": "Stress test data generation started",
 *   "success": true,
 *   "taskId": "task_1234567890",
 *   "estimatedTime": "5 minutes"
 * }
 */
router.post('/api/init/stress-test-data', 
  initController.createStressTestData // 執行壓力測試資料生成
);

/**
 * 匯出初始化路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有系統初始化相關的端點。
 */
export { router as initRoutes };