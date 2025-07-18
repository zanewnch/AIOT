import { Request, Response, NextFunction } from 'express';
import { UserActivityModel } from '../models/UserActivityModel.js';

/**
 * 活動追蹤中間件
 * 
 * 自動追蹤使用者的頁面造訪和活動狀態。
 * 在每個經過認證的請求中更新使用者的最後活動時間和頁面造訪記錄。
 * 
 * @module Middleware
 */
export class ActivityTrackingMiddleware {
  /**
   * 追蹤使用者活動的中間件函數
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   * @param next - Express 下一個中間件函數
   */
  public static trackActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 只追蹤已認證的使用者
      const userId = (req as any).user?.id;
      if (!userId) {
        next();
        return;
      }

      // 取得請求資訊
      const currentPath = req.originalUrl || req.path;
      const userAgent = req.get('user-agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';

      // 過濾不需要追蹤的請求
      const excludePaths = [
        '/api/activity',
        '/api/health',
        '/api/ping',
        '/favicon.ico'
      ];

      const shouldTrack = !excludePaths.some(path => currentPath.startsWith(path)) && 
                          req.method === 'GET'; // 只追蹤 GET 請求的頁面造訪

      if (shouldTrack) {
        // 非同步更新活動記錄，不阻塞請求
        setImmediate(async () => {
          try {
            const [activity, created] = await UserActivityModel.findOrCreate({
              where: { userId },
              defaults: {
                userId,
                lastLoginAt: new Date(),
                loginCount: 1,
                lastActiveAt: new Date(),
                mostVisitedPage: currentPath,
                pageVisitCounts: { [currentPath]: 1 },
                sessionDuration: 0,
                deviceInfo: userAgent,
                ipAddress
              }
            });

            if (!created) {
              // 更新現有記錄
              const currentCounts = activity.pageVisitCounts;
              currentCounts[currentPath] = (currentCounts[currentPath] || 0) + 1;

              // 找出最常造訪的頁面
              const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
                currentCounts[a] > currentCounts[b] ? a : b
              );

              await activity.update({
                lastActiveAt: new Date(),
                pageVisitCounts: currentCounts,
                mostVisitedPage,
                deviceInfo: userAgent,
                ipAddress
              });
            }
          } catch (error) {
            console.error('活動追蹤更新失敗:', error);
          }
        });
      }

      next();
    } catch (error) {
      console.error('活動追蹤中間件錯誤:', error);
      // 即使追蹤失敗也要繼續處理請求
      next();
    }
  };

  /**
   * 追蹤登入活動的中間件函數
   * 專門用於登入端點，更新登入次數和最後登入時間
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   * @param next - Express 下一個中間件函數
   */
  public static trackLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 暫存原始的 res.json 方法
    const originalJson = res.json;

    // 覆寫 res.json 方法來攔截回應
    res.json = function(this: Response, body: any) {
      // 檢查是否為成功登入回應
      if (body && body.token && body.user && body.user.id) {
        const userId = body.user.id;
        const userAgent = req.get('user-agent') || '';
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';

        // 非同步更新登入活動記錄
        setImmediate(async () => {
          try {
            const [activity, created] = await UserActivityModel.findOrCreate({
              where: { userId },
              defaults: {
                userId,
                lastLoginAt: new Date(),
                loginCount: 1,
                lastActiveAt: new Date(),
                mostVisitedPage: '/',
                pageVisitCounts: {},
                sessionDuration: 0,
                deviceInfo: userAgent,
                ipAddress
              }
            });

            if (!created) {
              await activity.update({
                lastLoginAt: new Date(),
                loginCount: activity.loginCount + 1,
                lastActiveAt: new Date(),
                deviceInfo: userAgent,
                ipAddress
              });
            }
          } catch (error) {
            console.error('登入活動追蹤更新失敗:', error);
          }
        });
      }

      // 呼叫原始的 json 方法
      return originalJson.call(this, body);
    };

    next();
  };

  /**
   * 記錄會話結束時間的中間件函數
   * 用於登出端點，計算會話持續時間
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   * @param next - Express 下一個中間件函數
   */
  public static trackLogout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;

    if (userId) {
      // 非同步更新會話結束時間
      setImmediate(async () => {
        try {
          const activity = await UserActivityModel.findOne({
            where: { userId }
          });

          if (activity && activity.lastLoginAt) {
            // 計算會話持續時間（分鐘）
            const sessionStart = new Date(activity.lastLoginAt);
            const sessionEnd = new Date();
            const sessionDurationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60));

            await activity.update({
              sessionDuration: activity.sessionDuration + sessionDurationMinutes
            });
          }
        } catch (error) {
          console.error('登出活動追蹤更新失敗:', error);
        }
      });
    }

    next();
  };
}