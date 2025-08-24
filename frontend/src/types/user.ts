/**
 * @fileoverview 使用者相關的類型定義
 * 
 * 定義使用者資料結構和會話管理相關的介面，
 * 用於處理使用者個人資料和認證會話。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

/**
 * 使用者個人資料介面
 * 
 * @interface UserProfile
 * @description 定義使用者完整個人資料的資料結構
 */
export interface UserProfile {
  /** 使用者唯一識別碼 */
  id: string;
  /** 使用者名稱 */
  username: string;
  /** 電子郵件地址 */
  email: string;
  /** 名字（可選） */
  firstName?: string;
  /** 姓氏（可選） */
  lastName?: string;
  /** 頭像圖片 URL（可選） */
  avatar?: string;
  /** 使用者角色清單 */
  roles: string[];
  /** 使用者權限清單 */
  permissions: string[];
  /** 帳戶是否為啟用狀態 */
  isActive: boolean;
  /** 最後登入時間（可選） */
  lastLoginAt?: string;
  /** 帳戶建立時間 */
  createdAt: string;
  /** 最後更新時間 */
  updatedAt: string;
}

/**
 * 使用者會話介面
 * 
 * @interface UserSession
 * @description 定義使用者認證會話的資料結構
 */
export interface UserSession {
  /** 使用者個人資料 */
  user: UserProfile;
  /** JWT 認證令牌 */
  token: string;
  /** 會話過期時間 */
  expiresAt: string;
  /** 刷新令牌（可選） */
  refreshToken?: string;
}