/**
 * @fileoverview 活動追蹤相關的類型定義
 * 
 * 包含所有活動追蹤功能相關的類型定義，
 * 從原本的 activityService 中提取出來，供各個模組共用。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
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
 * 會話資訊介面
 */
export interface SessionInfo {
  /** 會話開始時間 */
  startTime: number;
  /** 當前頁面 */
  currentPage: string;
  /** 會話持續時間 */
  duration: number;
  /** 設備資訊 */
  deviceInfo?: string;
}

/**
 * 頁面訪問記錄介面
 */
export interface PageVisitRecord {
  /** 頁面路徑 */
  page: string;
  /** 停留時間（毫秒） */
  duration?: number;
  /** 訪問時間戳 */
  timestamp: number;
}