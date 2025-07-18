import { Request, Response, NextFunction } from 'express';
import { UserActivityModel } from '../models/UserActivityModel.js';

/**
 * 使用者活動追蹤控制器
 * 
 * 追蹤和分析使用者活動模式，包括登入次數、頁面造訪統計、會話時間等。
 * 提供使用者行為分析和最常造訪頁面的統計功能。
 * 
 * @module Controllers
 */
export class UserActivityController {
  constructor() {
    // Controller 不再處理路由邏輯
  }

  /**
   * 取得使用者活動資料
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   */
  public async getUserActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      let activity = await UserActivityModel.findOne({
        where: { userId }
      });

      // 如果沒有活動記錄，建立預設值
      if (!activity) {
        activity = await UserActivityModel.create({
          userId,
          lastLoginAt: new Date(),
          loginCount: 1,
          lastActiveAt: new Date(),
          mostVisitedPage: '/',
          pageVisitCounts: {},
          sessionDuration: 0,
          deviceInfo: req.get('user-agent') || '',
          ipAddress: req.ip || ''
        });
      }

      // 更新最後活動時間
      await activity.update({ lastActiveAt: new Date() });

      // 設定活動追蹤 cookie
      res.cookie('user_activity', JSON.stringify({
        lastLogin: activity.lastLoginAt,
        loginCount: activity.loginCount,
        mostVisitedPage: activity.mostVisitedPage
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 小時
      });

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('取得使用者活動資料時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }

  /**
   * 記錄頁面造訪
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   */
  public async recordPageVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { page, duration } = req.body;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      if (!page) {
        res.status(400).json({ 
          success: false, 
          message: '頁面路徑為必填欄位' 
        });
        return;
      }

      const [activity, created] = await UserActivityModel.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          lastLoginAt: new Date(),
          loginCount: 1,
          lastActiveAt: new Date(),
          mostVisitedPage: page,
          pageVisitCounts: { [page]: 1 },
          sessionDuration: duration || 0,
          deviceInfo: req.get('user-agent') || '',
          ipAddress: req.ip || ''
        }
      });

      if (!created) {
        // 更新頁面造訪次數
        const currentCounts = activity.pageVisitCounts;
        currentCounts[page] = (currentCounts[page] || 0) + 1;

        // 找出最常造訪的頁面
        const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
          currentCounts[a] > currentCounts[b] ? a : b
        );

        await activity.update({
          lastActiveAt: new Date(),
          pageVisitCounts: currentCounts,
          mostVisitedPage,
          ...(duration && { sessionDuration: activity.sessionDuration + duration })
        });
      }

      res.json({
        success: true,
        data: {
          page,
          visitCount: activity.pageVisitCounts[page],
          mostVisitedPage: activity.mostVisitedPage
        },
        message: '頁面造訪已記錄'
      });
    } catch (error) {
      console.error('記錄頁面造訪時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }

  /**
   * 更新會話資訊
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   */
  public async updateSessionInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { sessionDuration, deviceInfo } = req.body;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      const activity = await UserActivityModel.findOne({
        where: { userId }
      });

      if (!activity) {
        res.status(404).json({ 
          success: false, 
          message: '使用者活動記錄不存在' 
        });
        return;
      }

      const updateData: any = {
        lastActiveAt: new Date()
      };

      if (sessionDuration !== undefined) {
        updateData.sessionDuration = sessionDuration;
      }

      if (deviceInfo) {
        updateData.deviceInfo = deviceInfo;
      }

      await activity.update(updateData);

      res.json({
        success: true,
        data: activity,
        message: '會話資訊已更新'
      });
    } catch (error) {
      console.error('更新會話資訊時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }

  /**
   * 取得活動統計資料
   * 
   * @param req - Express 請求物件
   * @param res - Express 回應物件
   */
  public async getActivityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: '未授權的存取' 
        });
        return;
      }

      const activity = await UserActivityModel.findOne({
        where: { userId }
      });

      if (!activity) {
        res.json({
          success: true,
          data: {
            loginCount: 0,
            totalPageVisits: 0,
            uniquePagesVisited: 0,
            averageSessionDuration: 0,
            mostVisitedPage: null,
            topPages: []
          }
        });
        return;
      }

      // 計算統計資料
      const pageVisitCounts = activity.pageVisitCounts;
      const totalPageVisits = Object.values(pageVisitCounts).reduce((sum: number, count: any) => sum + count, 0);
      const uniquePagesVisited = Object.keys(pageVisitCounts).length;

      // 取得造訪次數最多的前5個頁面
      const topPages = Object.entries(pageVisitCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([page, count]) => ({ page, count }));

      const stats = {
        loginCount: activity.loginCount,
        totalPageVisits,
        uniquePagesVisited,
        averageSessionDuration: Math.round(activity.sessionDuration / (activity.loginCount || 1)),
        mostVisitedPage: activity.mostVisitedPage,
        topPages,
        lastLoginAt: activity.lastLoginAt,
        lastActiveAt: activity.lastActiveAt
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('取得活動統計資料時發生錯誤:', error);
      res.status(500).json({ 
        success: false, 
        message: '伺服器內部錯誤' 
      });
    }
  }
}