/**
 * @fileoverview 使用者活動追蹤服務模組
 * 
 * 提供前端與後端活動追蹤 API 的整合功能，包括頁面訪問記錄、
 * 會話管理、使用者行為統計等功能。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * 使用者活動介面
 * 
 * @interface UserActivity
 * @description 定義使用者活動記錄的資料結構
 */
export interface UserActivity {
  /** 使用者 ID */
  userId: string;
  /** 最後登入時間 */
  lastLoginAt: Date;
  /** 登入次數 */
  loginCount: number;
  /** 最後活動時間 */
  lastActiveAt: Date;
  /** 最常訪問的頁面 */
  mostVisitedPage: string;
  /** 頁面訪問次數記錄 */
  pageVisitCounts: Record<string, number>;
  /** 會話持續時間 */
  sessionDuration: number;
  /** 設備資訊 */
  deviceInfo: string;
  /** IP 位址 */
  ipAddress: string;
}

/**
 * 活動統計介面
 * 
 * @interface ActivityStats
 * @description 定義使用者活動統計資料的結構
 */
export interface ActivityStats {
  /** 登入次數 */
  loginCount: number;
  /** 總頁面訪問次數 */
  totalPageVisits: number;
  /** 唯一頁面訪問數 */
  uniquePagesVisited: number;
  /** 平均會話持續時間 */
  averageSessionDuration: number;
  /** 最常訪問的頁面 */
  mostVisitedPage: string;
  /** 熱門頁面排行 */
  topPages: Array<{page: string, count: number}>;
  /** 最後登入時間 */
  lastLoginAt: Date;
  /** 最後活動時間 */
  lastActiveAt: Date;
}

/**
 * 活動服務類別
 * 
 * @class ActivityService
 * @description 提供使用者活動追蹤和統計功能
 * @example
 * ```typescript
 * const activityService = new ActivityService();
 * 
 * // 開始頁面追蹤
 * activityService.startPageTracking();
 * 
 * // 記錄頁面訪問
 * await activityService.recordPageVisit('/dashboard');
 * ```
 */
export class ActivityService {
  /** API 基礎 URL */
  private baseUrl = '/api/user';
  /** 會話開始時間戳記 */
  private sessionStartTime: number = Date.now();

  /**
   * 獲取用戶活動資料
   * 
   * @method getUserActivity
   * @returns {Promise<UserActivity>} 用戶活動資料
   * @description 從後端 API 獲取當前使用者的活動記錄和統計資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @example
   * ```typescript
   * try {
   *   const activity = await activityService.getUserActivity();
   *   console.log('最後登入時間:', activity.lastLoginAt);
   * } catch (error) {
   *   console.error('獲取活動資料失敗:', error);
   * }
   * ```
   */
  async getUserActivity(): Promise<UserActivity> {
    // 發送 GET 請求到用戶活動端點
    const response = await fetch(`${this.baseUrl}/activity`, {
      method: 'GET', // 使用 GET 方法
      headers: {
        'Authorization': `Bearer ${this.getToken()}`, // 加入認證標頭
        'Content-Type': 'application/json' // 設定內容類型
      }
    });

    // 檢查回應狀態是否成功
    if (!response.ok) {
      throw new Error('Failed to fetch user activity');
    }

    // 解析 JSON 回應資料
    const result = await response.json();
    return result.data; // 回傳活動資料
  }

  /**
   * 記錄頁面訪問
   * 
   * @method recordPageVisit
   * @param {string} page - 頁面路徑
   * @param {number} [duration] - 停留時間（毫秒）
   * @returns {Promise<void>} 無回傳值的 Promise
   * @description 記錄使用者訪問指定頁面的記錄
   * @example
   * ```typescript
   * // 記錄頁面訪問
   * await activityService.recordPageVisit('/dashboard');
   * 
   * // 記錄頁面訪問和停留時間
   * await activityService.recordPageVisit('/dashboard', 5000);
   * ```
   */
  async recordPageVisit(page: string, duration?: number): Promise<void> {
    try {
      // 發送 POST 請求記錄頁面訪問
      await fetch(`${this.baseUrl}/activity/page-visit`, {
        method: 'POST', // 使用 POST 方法
        headers: {
          'Authorization': `Bearer ${this.getToken()}`, // 加入認證標頭
          'Content-Type': 'application/json' // 設定內容類型
        },
        body: JSON.stringify({ page, duration }) // 傳送頁面路徑和停留時間
      });
    } catch (error) {
      // 記錄錯誤，但不阻斷正常運行
      console.error('Failed to record page visit:', error);
    }
  }

  /**
   * 更新會話信息
   * 
   * @method updateSessionInfo
   * @param {number} [sessionDuration] - 會話持續時間（毫秒）
   * @param {string} [deviceInfo] - 設備資訊
   * @returns {Promise<void>} 無回傳值的 Promise
   * @description 更新使用者的會話信息，包括持續時間和設備資訊
   * @example
   * ```typescript
   * // 更新會話持續時間
   * await activityService.updateSessionInfo(300000);
   * 
   * // 更新會話信息和設備資訊
   * await activityService.updateSessionInfo(300000, 'Chrome 120.0 on Windows');
   * ```
   */
  async updateSessionInfo(sessionDuration?: number, deviceInfo?: string): Promise<void> {
    try {
      // 發送 POST 請求更新會話信息
      await fetch(`${this.baseUrl}/activity/session`, {
        method: 'POST', // 使用 POST 方法
        headers: {
          'Authorization': `Bearer ${this.getToken()}`, // 加入認證標頭
          'Content-Type': 'application/json' // 設定內容類型
        },
        body: JSON.stringify({ sessionDuration, deviceInfo }) // 傳送會話信息
      });
    } catch (error) {
      // 記錄錯誤，但不阻斷正常運行
      console.error('Failed to update session info:', error);
    }
  }

  /**
   * 獲取活動統計資料
   * 
   * @method getActivityStats
   * @returns {Promise<ActivityStats>} 活動統計資料
   * @description 從後端 API 獲取使用者活動的統計資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @example
   * ```typescript
   * try {
   *   const stats = await activityService.getActivityStats();
   *   console.log('總登入次數:', stats.loginCount);
   *   console.log('最常訪問頁面:', stats.mostVisitedPage);
   * } catch (error) {
   *   console.error('獲取統計資料失敗:', error);
   * }
   * ```
   */
  async getActivityStats(): Promise<ActivityStats> {
    // 發送 GET 請求到活動統計端點
    const response = await fetch(`${this.baseUrl}/activity/stats`, {
      method: 'GET', // 使用 GET 方法
      headers: {
        'Authorization': `Bearer ${this.getToken()}`, // 加入認證標頭
        'Content-Type': 'application/json' // 設定內容類型
      }
    });

    // 檢查回應狀態是否成功
    if (!response.ok) {
      throw new Error('Failed to fetch activity stats');
    }

    // 解析 JSON 回應資料
    const result = await response.json();
    return result.data; // 回傳統計資料
  }

  /**
   * 自動追蹤頁面訪問
   * 
   * @method startPageTracking
   * @description 啟動頁面訪問的自動追蹤功能，監聽路由變化和頁面可見性
   * @example
   * ```typescript
   * // 在應用啟動時開始追蹤
   * activityService.startPageTracking();
   * ```
   */
  startPageTracking(): void {
    // 監聽路由變化，追蹤當前頁面
    this.trackCurrentPage();
    
    // 監聽瀏覽器前進/後退按鈕事件
    window.addEventListener('popstate', () => {
      this.trackCurrentPage(); // 追蹤新頁面
    });

    // 監聽頁面可見性變化事件
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 當頁面隱藏時更新會話信息
        this.updateSessionOnPageLeave();
      }
    });

    // 定期更新會話信息，每分鐘更新一次
    setInterval(() => {
      this.updateSessionInfo(Date.now() - this.sessionStartTime);
    }, 60000); // 60秒 = 1分鐘
  }

  /**
   * 追蹤當前頁面
   * 
   * @method trackCurrentPage
   * @private
   * @description 追蹤當前頁面的訪問記錄和停留時間
   */
  private trackCurrentPage(): void {
    // 獲取當前頁面路徑
    const currentPath = window.location.pathname;
    // 記錄頁面載入時間
    const pageLoadTime = Date.now();
    
    // 記錄頁面訪問事件
    this.recordPageVisit(currentPath);
    
    // 定義記錄停留時間的函數
    const recordDuration = () => {
      const duration = Date.now() - pageLoadTime; // 計算停留時間
      this.recordPageVisit(currentPath, duration); // 記錄停留時間
    };

    // 定義頁面離開事件處理函數
    const handlePageLeave = () => {
      recordDuration(); // 記錄停留時間
      window.removeEventListener('beforeunload', handlePageLeave); // 移除事件監聽器
    };

    // 監聽頁面離開事件
    window.addEventListener('beforeunload', handlePageLeave);
  }

  /**
   * 頁面離開時更新會話信息
   * 
   * @method updateSessionOnPageLeave
   * @private
   * @description 當頁面離開時更新會話持續時間
   */
  private updateSessionOnPageLeave(): void {
    // 計算會話持續時間
    const sessionDuration = Date.now() - this.sessionStartTime;
    // 更新會話信息
    this.updateSessionInfo(sessionDuration);
  }

  /**
   * 獲取認證 token
   * 
   * @method getToken
   * @private
   * @returns {string} JWT 認證令牌
   * @description 從 localStorage 獲取存儲的認證令牌
   */
  private getToken(): string {
    // 從 localStorage 獲取認證令牌，如果不存在則回傳空字串
    return localStorage.getItem('authToken') || '';
  }
}

/**
 * 活動服務實例
 * 
 * @constant {ActivityService} activityService
 * @description 預設的活動服務實例，採用單例模式
 * @example
 * ```typescript
 * import { activityService } from './activityService';
 * 
 * // 使用預設實例開始追蹤
 * activityService.startPageTracking();
 * 
 * // 記錄頁面訪問
 * await activityService.recordPageVisit('/dashboard');
 * ```
 */
export const activityService = new ActivityService();