/**
 * @fileoverview 使用者活動追蹤控制器 - 提供使用者行為分析和活動記錄功能
 * 
 * 此控制器負責追蹤和分析使用者的活動模式，包括：
 * - 登入次數和最後登入時間
 * - 頁面造訪統計和最常造訪頁面
 * - 會話時間和設備資訊
 * - 活動統計資料的計算和回傳
 * 
 * 特色功能：
 * - 自動建立使用者活動記錄
 * - 即時更新活動追蹤
 * - 設定安全的活動追蹤 Cookie
 * - 詳細的活動統計分析
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response, NextFunction } from 'express'; // 引入 Express 的請求、回應和中間件類型定義
import { UserActivityModel } from '../models/UserActivityModel.js'; // 引入使用者活動資料模型，用於資料庫操作
import { createLogger, logRequest } from '../configs/loggerConfig.js'; // 匯入日誌記錄器
import { ControllerResult } from '../types/ControllerResult.js'; // 匯入控制器結果介面

// 創建控制器專用的日誌記錄器
const logger = createLogger('UserActivityController');

/**
 * 使用者活動追蹤控制器類別
 * 
 * 提供完整的使用者活動追蹤功能，包括：
 * - 取得使用者活動資料
 * - 記錄頁面造訪
 * - 更新會話資訊
 * - 取得活動統計資料
 * 
 * @class UserActivityController
 * @description 處理所有與使用者活動追蹤相關的 HTTP 請求
 */
export class UserActivityController {
  /**
   * 建構函式
   * 
   * 初始化使用者活動追蹤控制器實例
   * 現代化的控制器不再直接處理路由邏輯，而是專注於業務邏輯處理
   * 
   * @constructor
   */
  constructor() {
    // Controller 不再處理路由邏輯，路由配置已移至專門的路由檔案中
  }

  /**
   * 取得使用者活動資料
   * 
   * 此方法負責取得指定使用者的活動記錄，包括：
   * - 登入次數和最後登入時間
   * - 最常造訪的頁面
   * - 會話時間和設備資訊
   * - 自動建立預設活動記錄（如果不存在）
   * - 設定安全的活動追蹤 Cookie
   * 
   * @async
   * @method getUserActivity
   * @param {Request} req - Express 請求物件，包含使用者認證資訊
   * @param {Response} res - Express 回應物件，用於回傳活動資料
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   * 
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   * 
   * @example
   * // GET /api/user-activity
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "userId": 123,
   * //     "lastLoginAt": "2024-01-01T00:00:00.000Z",
   * //     "loginCount": 5,
   * //     "mostVisitedPage": "/dashboard"
   * //   }
   * // }
   */
  public async getUserActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 從請求物件中取得已認證的使用者 ID（透過認證中間件設定）
      const userId = (req as any).user?.id;
      
      logger.info(`Retrieving user activity data for user ID: ${userId}`);
      logRequest(req, `User activity data request for user: ${userId}`, 'info');
      
      // 驗證使用者是否已認證，未認證則回傳 401 未授權錯誤
      if (!userId) {
        logger.warn('User activity request without valid authentication');
        const response: ControllerResult = {
          status: 401,
          message: '未授權的存取'
        };
        res.status(401).json(response);
        return;
      }

      // 從資料庫中查詢使用者的活動記錄
      let activity = await UserActivityModel.findOne({
        where: { userId }
      });

      // 如果沒有活動記錄，建立預設值，這通常發生在使用者第一次登入時
      if (!activity) {
        logger.debug(`Creating new activity record for user ID: ${userId}`);
        activity = await UserActivityModel.create({
          userId, // 使用者 ID
          lastLoginAt: new Date(), // 最後登入時間設為現在
          loginCount: 1, // 登入次數初始化為 1
          lastActiveAt: new Date(), // 最後活動時間設為現在
          mostVisitedPage: '/', // 最常造訪頁面預設為首頁
          pageVisitCounts: {}, // 頁面造訪次數統計初始化為空物件
          sessionDuration: 0, // 會話持續時間初始化為 0
          deviceInfo: req.get('user-agent') || '', // 從請求標頭取得設備資訊
          ipAddress: req.ip || '' // 從請求中取得 IP 地址
        });
        logger.info(`New activity record created for user ID: ${userId}`);
      } else {
        logger.debug(`Existing activity record found for user ID: ${userId}`);
      }

      // 更新最後活動時間為現在，表示使用者正在活動
      await activity.update({ lastActiveAt: new Date() });

      // 設定活動追蹤 cookie，包含重要的活動資訊
      res.cookie('user_activity', JSON.stringify({
        lastLogin: activity.lastLoginAt, // 最後登入時間
        loginCount: activity.loginCount, // 登入次數
        mostVisitedPage: activity.mostVisitedPage // 最常造訪頁面
      }), {
        httpOnly: true, // 防止 XSS 攻擊，只能透過 HTTP 存取
        secure: process.env.NODE_ENV === 'production', // 生產環境下使用 HTTPS
        sameSite: 'strict', // 防止 CSRF 攻擊，限制同站請求
        maxAge: 24 * 60 * 60 * 1000 // Cookie 有效期為 24 小時
      });

      logger.info(`User activity data retrieved successfully for user ID: ${userId}`);
      
      // 回傳成功結果，包含完整的活動資料
      const response: ControllerResult = {
        status: 200,
        message: 'User activity data retrieved successfully',
        data: activity
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error retrieving user activity data:', error);
      
      // 回傳 500 伺服器內部錯誤，不暴露敏感的錯誤細節
      const response: ControllerResult = {
        status: 500,
        message: '伺服器內部錯誤'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 記錄頁面造訪
   * 
   * 此方法負責記錄使用者的頁面造訪行為，包括：
   * - 更新頁面造訪次數統計
   * - 計算和更新最常造訪的頁面
   * - 累積會話持續時間
   * - 自動建立或更新活動記錄
   * 
   * @async
   * @method recordPageVisit
   * @param {Request} req - Express 請求物件，包含使用者資訊和頁面資料
   * @param {Response} res - Express 回應物件，用於回傳記錄結果
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   * 
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {400} 當頁面路徑參數缺失時回傳 400 狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   * 
   * @example
   * // POST /api/user-activity/page-visit
   * // 請求 body: { "page": "/dashboard", "duration": 120 }
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "page": "/dashboard",
   * //     "visitCount": 5,
   * //     "mostVisitedPage": "/dashboard"
   * //   },
   * //   "message": "頁面造訪已記錄"
   * // }
   */
  public async recordPageVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 從請求物件中取得已認證的使用者 ID
      const userId = (req as any).user?.id;
      // 從請求主體中取得頁面路徑和停留時間
      const { page, duration } = req.body;

      logger.info(`Recording page visit for user ID: ${userId}, page: ${page}`);
      logRequest(req, `Page visit recording request - Page: ${page}`, 'info');

      // 驗證使用者是否已認證
      if (!userId) {
        logger.warn('Page visit recording attempted without valid authentication');
        const response: ControllerResult = {
          status: 401,
          message: '未授權的存取'
        };
        res.status(401).json(response);
        return;
      }

      // 驗證頁面路徑是否提供，這是必填欄位
      if (!page) {
        logger.warn(`Page visit recording failed - missing page parameter for user ID: ${userId}`);
        const response: ControllerResult = {
          status: 400,
          message: '頁面路徑為必填欄位'
        };
        res.status(400).json(response);
        return;
      }

      // 使用 findOrCreate 方法確保活動記錄存在，如果不存在則建立新記錄
      const [activity, created] = await UserActivityModel.findOrCreate({
        where: { userId },
        defaults: {
          userId, // 使用者 ID
          lastLoginAt: new Date(), // 最後登入時間
          loginCount: 1, // 登入次數初始化為 1
          lastActiveAt: new Date(), // 最後活動時間
          mostVisitedPage: page, // 最常造訪頁面設為當前頁面
          pageVisitCounts: { [page]: 1 }, // 頁面造訪次數統計，當前頁面設為 1
          sessionDuration: duration || 0, // 會話持續時間
          deviceInfo: req.get('user-agent') || '', // 設備資訊
          ipAddress: req.ip || '' // IP 地址
        }
      });

      // 如果記錄已存在（created 為 false），則更新現有記錄
      if (!created) {
        // 取得當前的頁面造訪次數統計
        const currentCounts = activity.pageVisitCounts;
        // 增加當前頁面的造訪次數
        currentCounts[page] = (currentCounts[page] || 0) + 1;

        // 找出最常造訪的頁面，透過比較所有頁面的造訪次數
        const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
          currentCounts[a] > currentCounts[b] ? a : b
        );

        // 更新活動記錄
        await activity.update({
          lastActiveAt: new Date(), // 更新最後活動時間
          pageVisitCounts: currentCounts, // 更新頁面造訪次數統計
          mostVisitedPage, // 更新最常造訪頁面
          // 如果有提供停留時間，則累加到總會話時間
          ...(duration && { sessionDuration: activity.sessionDuration + duration })
        });
      }

      logger.info(`Page visit recorded successfully for user ID: ${userId}, page: ${page}, visit count: ${activity.pageVisitCounts[page]}`);
      
      // 回傳成功結果，包含頁面造訪統計資訊
      const response: ControllerResult = {
        status: 200,
        message: '頁面造訪已記錄',
        data: {
          page, // 當前造訪的頁面
          visitCount: activity.pageVisitCounts[page], // 該頁面的造訪次數
          mostVisitedPage: activity.mostVisitedPage // 最常造訪的頁面
        }
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error recording page visit:', error);
      
      // 回傳 500 伺服器內部錯誤
      const response: ControllerResult = {
        status: 500,
        message: '伺服器內部錯誤'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 更新會話資訊
   * 
   * 此方法負責更新使用者的會話資訊，包括：
   * - 更新會話持續時間
   * - 更新設備資訊
   * - 更新最後活動時間
   * 
   * @async
   * @method updateSessionInfo
   * @param {Request} req - Express 請求物件，包含會話更新資料
   * @param {Response} res - Express 回應物件，用於回傳更新結果
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   * 
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {404} 當使用者活動記錄不存在時回傳 404 狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   * 
   * @example
   * // PATCH /api/user-activity/session
   * // 請求 body: { "sessionDuration": 300, "deviceInfo": "Mozilla/5.0..." }
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": { ... },
   * //   "message": "會話資訊已更新"
   * // }
   */
  public async updateSessionInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 從請求物件中取得已認證的使用者 ID
      const userId = (req as any).user?.id;
      // 從請求主體中取得會話持續時間和設備資訊
      const { sessionDuration, deviceInfo } = req.body;

      logger.info(`Updating session info for user ID: ${userId}`);
      logRequest(req, `Session info update request for user: ${userId}`, 'info');

      // 驗證使用者是否已認證
      if (!userId) {
        logger.warn('Session info update attempted without valid authentication');
        const response: ControllerResult = {
          status: 401,
          message: '未授權的存取'
        };
        res.status(401).json(response);
        return;
      }

      // 查詢使用者的活動記錄
      const activity = await UserActivityModel.findOne({
        where: { userId }
      });

      // 檢查活動記錄是否存在
      if (!activity) {
        logger.warn(`Session info update failed - activity record not found for user ID: ${userId}`);
        const response: ControllerResult = {
          status: 404,
          message: '使用者活動記錄不存在'
        };
        res.status(404).json(response);
        return;
      }

      // 準備更新資料物件，至少包含最後活動時間
      const updateData: any = {
        lastActiveAt: new Date() // 更新最後活動時間為現在
      };

      // 如果提供了會話持續時間，則更新
      if (sessionDuration !== undefined) {
        updateData.sessionDuration = sessionDuration;
      }

      // 如果提供了設備資訊，則更新
      if (deviceInfo) {
        updateData.deviceInfo = deviceInfo;
      }

      // 執行資料庫更新操作
      await activity.update(updateData);

      logger.info(`Session info updated successfully for user ID: ${userId}`);
      
      // 回傳成功結果，包含更新後的活動資料
      const response: ControllerResult = {
        status: 200,
        message: '會話資訊已更新',
        data: activity
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error updating session info:', error);
      
      // 回傳 500 伺服器內部錯誤
      const response: ControllerResult = {
        status: 500,
        message: '伺服器內部錯誤'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 取得活動統計資料
   * 
   * 此方法負責計算和回傳使用者的活動統計資料，包括：
   * - 登入次數統計
   * - 頁面造訪總數和獨特頁面數
   * - 平均會話持續時間
   * - 最常造訪頁面和前5名頁面
   * - 最後登入和活動時間
   * 
   * @async
   * @method getActivityStats
   * @param {Request} req - Express 請求物件，包含使用者認證資訊
   * @param {Response} res - Express 回應物件，用於回傳統計資料
   * @param {NextFunction} next - Express 下一個中間件函式（未使用但保留介面一致性）
   * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
   * 
   * @throws {401} 當使用者未授權時回傳 401 狀態碼
   * @throws {500} 當伺服器內部錯誤時回傳 500 狀態碼
   * 
   * @example
   * // GET /api/user-activity/stats
   * // 回傳格式：
   * // {
   * //   "success": true,
   * //   "data": {
   * //     "loginCount": 15,
   * //     "totalPageVisits": 50,
   * //     "uniquePagesVisited": 8,
   * //     "averageSessionDuration": 180,
   * //     "mostVisitedPage": "/dashboard",
   * //     "topPages": [
   * //       { "page": "/dashboard", "count": 20 },
   * //       { "page": "/profile", "count": 15 }
   * //     ],
   * //     "lastLoginAt": "2024-01-01T12:00:00.000Z",
   * //     "lastActiveAt": "2024-01-01T12:30:00.000Z"
   * //   }
   * // }
   */
  public async getActivityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 從請求物件中取得已認證的使用者 ID
      const userId = (req as any).user?.id;
      
      logger.info(`Retrieving activity statistics for user ID: ${userId}`);
      logRequest(req, `Activity stats request for user: ${userId}`, 'info');
      
      // 驗證使用者是否已認證
      if (!userId) {
        logger.warn('Activity stats request without valid authentication');
        const response: ControllerResult = {
          status: 401,
          message: '未授權的存取'
        };
        res.status(401).json(response);
        return;
      }

      // 查詢使用者的活動記錄
      const activity = await UserActivityModel.findOne({
        where: { userId }
      });

      // 如果沒有活動記錄，回傳預設的空統計資料
      if (!activity) {
        logger.info(`No activity record found for user ID: ${userId}, returning default stats`);
        const response: ControllerResult = {
          status: 200,
          message: 'Activity statistics retrieved successfully',
          data: {
            loginCount: 0, // 登入次數為 0
            totalPageVisits: 0, // 總頁面造訪次數為 0
            uniquePagesVisited: 0, // 獨特頁面造訪數為 0
            averageSessionDuration: 0, // 平均會話時間為 0
            mostVisitedPage: null, // 最常造訪頁面為空
            topPages: [] // 熱門頁面清單為空
          }
        };
        res.status(200).json(response);
        return;
      }

      // 計算統計資料
      const pageVisitCounts = activity.pageVisitCounts; // 取得頁面造訪次數統計
      
      // 計算總頁面造訪次數，將所有頁面的造訪次數相加
      const totalPageVisits = Object.values(pageVisitCounts).reduce((sum: number, count: any) => sum + count, 0);
      
      // 計算獨特頁面造訪數，即造訪過的不同頁面數量
      const uniquePagesVisited = Object.keys(pageVisitCounts).length;

      // 取得造訪次數最多的前5個頁面，按造訪次數降序排列
      const topPages = Object.entries(pageVisitCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number)) // 按造訪次數降序排列
        .slice(0, 5) // 只取前5名
        .map(([page, count]) => ({ page, count })); // 轉換為物件格式

      // 組合統計資料物件
      const stats = {
        loginCount: activity.loginCount, // 登入次數
        totalPageVisits, // 總頁面造訪次數
        uniquePagesVisited, // 獨特頁面造訪數
        // 計算平均會話持續時間，避免除以零的錯誤
        averageSessionDuration: Math.round(activity.sessionDuration / (activity.loginCount || 1)),
        mostVisitedPage: activity.mostVisitedPage, // 最常造訪頁面
        topPages, // 熱門頁面清單
        lastLoginAt: activity.lastLoginAt, // 最後登入時間
        lastActiveAt: activity.lastActiveAt // 最後活動時間
      };

      logger.info(`Activity statistics retrieved successfully for user ID: ${userId} - Login count: ${stats.loginCount}, Total page visits: ${stats.totalPageVisits}`);
      
      // 回傳成功結果，包含完整的統計資料
      const response: ControllerResult = {
        status: 200,
        message: 'Activity statistics retrieved successfully',
        data: stats
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error retrieving activity statistics:', error);
      
      // 回傳 500 伺服器內部錯誤
      const response: ControllerResult = {
        status: 500,
        message: '伺服器內部錯誤'
      };
      res.status(500).json(response);
    }
  }
}