/**
 * @fileoverview 使用者活動追蹤中間件模組
 * 
 * 此模組提供全面的使用者活動追蹤功能，包括頁面造訪、登入/登出記錄。
 * 透過非同步處理確保不影響主要業務邏輯的性能。
 * 
 * 追蹤功能：
 * 1. 頁面造訪追蹤：記錄使用者造訪的頁面和次數
 * 2. 登入活動追蹤：記錄登入時間和次數
 * 3. 登出活動追蹤：計算會話持續時間
 * 4. 裝置資訊追蹤：記錄 User-Agent 和 IP 地址
 * 5. 最常造訪頁面統計：自動計算使用者偏好
 * 
 * 設計原則：
 * - 非阻塞式：使用 setImmediate 進行非同步更新
 * - 錯誤隔離：追蹤錯誤不影響主要業務流程
 * - 智慧過濾：排除系統請求和靜態資源
 * - 效能優化：只追蹤有意義的 GET 請求
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // 引入 Express 類型定義
import { UserActivityModel } from '../models/UserActivityModel.js'; // 引入使用者活動模型

/**
 * 活動追蹤中間件類別
 * 
 * 提供全面的使用者活動追蹤功能，包括頁面造訪、登入/登出記錄。
 * 使用非同步處理確保不影響主要業務邏輯的性能。
 * 
 * 主要功能：
 * - 頁面造訪統計：記錄使用者造訪的頁面和頻率
 * - 活動狀態更新：持續更新使用者的最後活動時間
 * - 登入登出追蹤：記錄會話開始和結束時間
 * - 裝置資訊記錄：收集 User-Agent 和 IP 地址
 * - 智慧過濾：自動過濾系統請求和非必要追蹤
 * 
 * @class ActivityTrackingMiddleware
 * @example
 * ```typescript
 * import { ActivityTrackingMiddleware } from './middleware/ActivityTrackingMiddleware';
 * 
 * // 一般頁面造訪追蹤
 * app.use(ActivityTrackingMiddleware.trackActivity);
 * 
 * // 登入追蹤
 * app.post('/api/auth/login', ActivityTrackingMiddleware.trackLogin, authController.login);
 * 
 * // 登出追蹤
 * app.post('/api/auth/logout', authMiddleware.authenticate, ActivityTrackingMiddleware.trackLogout, authController.logout);
 * ```
 */
export class ActivityTrackingMiddleware {
  /**
   * 追蹤使用者活動的中間件函數
   * 
   * 監控已認證使用者的頁面造訪行為，記錄頁面造訪次數和最後活動時間。
   * 使用非同步處理確保不阻塞主要業務邏輯的執行。
   * 
   * @param {Request} req - Express 請求物件
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express 下一個中間件函數
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // 在所有路由前使用
   * app.use(ActivityTrackingMiddleware.trackActivity);
   * 
   * // 或在特定路由使用
   * app.get('/dashboard', ActivityTrackingMiddleware.trackActivity, dashboardController.index);
   * ```
   */
  public static trackActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 第一步：檢查使用者是否已認證，只追蹤已認證的使用者
      const userId = (req as any).user?.id;
      if (!userId) {
        next(); // 未認證使用者，跳過追蹤直接繼續
        return;
      }

      // 第二步：取得請求資訊
      const currentPath = req.originalUrl || req.path; // 取得完整的請求路徑
      const userAgent = req.get('user-agent') || ''; // 取得使用者代理字串
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || ''; // 取得客戶端 IP 地址

      // 第三步：過濾不需要追蹤的請求
      const excludePaths = [
        '/api/activity', // 活動相關 API 請求
        '/api/health',   // 健康檢查請求
        '/api/ping',     // 心跳檢查請求
        '/favicon.ico'   // 瀏覽器圖示請求
      ];

      // 判斷是否需要追蹤：排除特定路徑且只追蹤 GET 請求
      const shouldTrack = !excludePaths.some(path => currentPath.startsWith(path)) && 
                          req.method === 'GET'; // 只追蹤 GET 請求的頁面造訪

      if (shouldTrack) {
        // 第四步：非同步更新活動記錄，不阻塞請求處理
        setImmediate(async () => {
          try {
            // 嘗試查找現有記錄或建立新記錄
            const [activity, created] = await UserActivityModel.findOrCreate({
              where: { userId }, // 根據使用者 ID 查找
              defaults: {
                // 新記錄的預設值
                userId,
                lastLoginAt: new Date(),
                loginCount: 1,
                lastActiveAt: new Date(),
                mostVisitedPage: currentPath,
                pageVisitCounts: { [currentPath]: 1 }, // 初始化頁面造訪計數
                sessionDuration: 0,
                deviceInfo: userAgent,
                ipAddress
              }
            });

            if (!created) {
              // 更新現有記錄
              const currentCounts = activity.pageVisitCounts; // 取得目前的頁面造訪計數
              currentCounts[currentPath] = (currentCounts[currentPath] || 0) + 1; // 增加當前頁面的造訪次數

              // 找出最常造訪的頁面
              const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
                currentCounts[a] > currentCounts[b] ? a : b
              );

              // 更新記錄
              await activity.update({
                lastActiveAt: new Date(), // 更新最後活動時間
                pageVisitCounts: currentCounts, // 更新頁面造訪計數
                mostVisitedPage, // 更新最常造訪的頁面
                deviceInfo: userAgent, // 更新裝置資訊
                ipAddress // 更新 IP 地址
              });
            }
          } catch (error) {
            // 捕獲資料庫更新錯誤，不影響主要業務邏輯
            console.error('活動追蹤更新失敗:', error);
          }
        });
      }

      next(); // 繼續執行下一個中間件
    } catch (error) {
      // 捕獲任何未預期的錯誤
      console.error('活動追蹤中間件錯誤:', error);
      // 即使追蹤失敗也要繼續處理請求
      next();
    }
  };

  /**
   * 追蹤登入活動的中間件函數
   * 
   * 專門用於登入端點，監控登入成功事件並記錄登入次數和最後登入時間。
   * 透過攔截 res.json 回應來判斷登入是否成功。
   * 
   * @param {Request} req - Express 請求物件
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express 下一個中間件函數
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // 在登入路由中使用
   * app.post('/api/auth/login', 
   *   ActivityTrackingMiddleware.trackLogin, 
   *   authController.login
   * );
   * ```
   */
  public static trackLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 暫存原始的 res.json 方法，以便後續恢復
    const originalJson = res.json;

    // 覆寫 res.json 方法來攔截回應並檢查登入狀態
    res.json = function(this: Response, body: any) {
      // 檢查是否為成功登入回應（包含 token 和 user 資訊）
      if (body && body.token && body.user && body.user.id) {
        const userId = body.user.id; // 取得使用者 ID
        const userAgent = req.get('user-agent') || ''; // 取得使用者代理字串
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || ''; // 取得客戶端 IP 地址

        // 非同步更新登入活動記錄，不阻塞回應
        setImmediate(async () => {
          try {
            // 嘗試查找現有記錄或建立新記錄
            const [activity, created] = await UserActivityModel.findOrCreate({
              where: { userId }, // 根據使用者 ID 查找
              defaults: {
                // 新記錄的預設值
                userId,
                lastLoginAt: new Date(),
                loginCount: 1, // 初始登入次數
                lastActiveAt: new Date(),
                mostVisitedPage: '/', // 預設首頁
                pageVisitCounts: {}, // 初始化空的頁面造訪計數
                sessionDuration: 0,
                deviceInfo: userAgent,
                ipAddress
              }
            });

            if (!created) {
              // 更新現有記錄
              await activity.update({
                lastLoginAt: new Date(), // 更新最後登入時間
                loginCount: activity.loginCount + 1, // 增加登入次數
                lastActiveAt: new Date(), // 更新最後活動時間
                deviceInfo: userAgent, // 更新裝置資訊
                ipAddress // 更新 IP 地址
              });
            }
          } catch (error) {
            // 捕獲資料庫更新錯誤，不影響登入流程
            console.error('登入活動追蹤更新失敗:', error);
          }
        });
      }

      // 呼叫原始的 json 方法，返回正常的回應
      return originalJson.call(this, body);
    };

    next(); // 繼續執行下一個中間件
  };

  /**
   * 記錄會話結束時間的中間件函數
   * 
   * 用於登出端點，計算並記錄會話持續時間。
   * 透過計算登入時間和登出時間的差值來統計使用者的會話長度。
   * 
   * @param {Request} req - Express 請求物件
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express 下一個中間件函數
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // 在登出路由中使用
   * app.post('/api/auth/logout', 
   *   authMiddleware.authenticate, // 確保使用者已認證
   *   ActivityTrackingMiddleware.trackLogout,
   *   authController.logout
   * );
   * ```
   */
  public static trackLogout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 取得已認證的使用者 ID
    const userId = (req as any).user?.id;

    if (userId) {
      // 非同步更新會話結束時間，不阻塞登出流程
      setImmediate(async () => {
        try {
          // 查找使用者的活動記錄
          const activity = await UserActivityModel.findOne({
            where: { userId }
          });

          if (activity && activity.lastLoginAt) {
            // 計算會話持續時間（分鐘）
            const sessionStart = new Date(activity.lastLoginAt); // 會話開始時間
            const sessionEnd = new Date(); // 會話結束時間（現在）
            const sessionDurationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)); // 轉換為分鐘並四捨五入

            // 更新累計會話持續時間
            await activity.update({
              sessionDuration: activity.sessionDuration + sessionDurationMinutes // 累加會話時間
            });
          }
        } catch (error) {
          // 捕獲資料庫更新錯誤，不影響登出流程
          console.error('登出活動追蹤更新失敗:', error);
        }
      });
    }

    next(); // 繼續執行下一個中間件
  };
}