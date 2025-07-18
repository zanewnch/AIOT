/**
 * 使用者活動追蹤服務
 * 
 * 提供前端與後端活動追蹤 API 的整合功能
 */

export interface UserActivity {
  userId: string;
  lastLoginAt: Date;
  loginCount: number;
  lastActiveAt: Date;
  mostVisitedPage: string;
  pageVisitCounts: Record<string, number>;
  sessionDuration: number;
  deviceInfo: string;
  ipAddress: string;
}

export interface ActivityStats {
  loginCount: number;
  totalPageVisits: number;
  uniquePagesVisited: number;
  averageSessionDuration: number;
  mostVisitedPage: string;
  topPages: Array<{page: string, count: number}>;
  lastLoginAt: Date;
  lastActiveAt: Date;
}

export class ActivityService {
  private baseUrl = '/api/user';
  private sessionStartTime: number = Date.now();

  /**
   * 獲取用戶活動資料
   */
  async getUserActivity(): Promise<UserActivity> {
    const response = await fetch(`${this.baseUrl}/activity`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user activity');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * 記錄頁面訪問
   */
  async recordPageVisit(page: string, duration?: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/activity/page-visit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ page, duration })
      });
    } catch (error) {
      console.error('Failed to record page visit:', error);
    }
  }

  /**
   * 更新會話信息
   */
  async updateSessionInfo(sessionDuration?: number, deviceInfo?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/activity/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionDuration, deviceInfo })
      });
    } catch (error) {
      console.error('Failed to update session info:', error);
    }
  }

  /**
   * 獲取活動統計資料
   */
  async getActivityStats(): Promise<ActivityStats> {
    const response = await fetch(`${this.baseUrl}/activity/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity stats');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * 自動追蹤頁面訪問
   */
  startPageTracking(): void {
    // 監聽路由變化
    this.trackCurrentPage();
    
    // 監聽瀏覽器前進/後退
    window.addEventListener('popstate', () => {
      this.trackCurrentPage();
    });

    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateSessionOnPageLeave();
      }
    });

    // 定期更新會話信息
    setInterval(() => {
      this.updateSessionInfo(Date.now() - this.sessionStartTime);
    }, 60000); // 每分鐘更新一次
  }

  /**
   * 追蹤當前頁面
   */
  private trackCurrentPage(): void {
    const currentPath = window.location.pathname;
    const pageLoadTime = Date.now();
    
    // 記錄頁面訪問
    this.recordPageVisit(currentPath);
    
    // 當頁面離開時記錄停留時間
    const recordDuration = () => {
      const duration = Date.now() - pageLoadTime;
      this.recordPageVisit(currentPath, duration);
    };

    // 監聽頁面離開事件
    const handlePageLeave = () => {
      recordDuration();
      window.removeEventListener('beforeunload', handlePageLeave);
    };

    window.addEventListener('beforeunload', handlePageLeave);
  }

  /**
   * 頁面離開時更新會話信息
   */
  private updateSessionOnPageLeave(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.updateSessionInfo(sessionDuration);
  }

  /**
   * 獲取認證 token
   */
  private getToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

// 導出單例
export const activityService = new ActivityService();