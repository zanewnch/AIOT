// 角色類型，限制可用角色名稱
export type Role = 'admin' | 'user' | 'operator';

/**
 * 設備權限結構，細化用戶對單一設備的操作權限
 */
export interface DevicePermission {
    /**
     * 設備的唯一識別碼
     */
    deviceId: string;
    /**
     * 此用戶對該設備擁有的權限類型，例如讀取、寫入、控制
     */
    permissions: ('read' | 'write' | 'control')[];
}

export interface User {
    /**
     * 使用者的唯一識別碼（通常為 UUID 或資料庫自動產生的 ID）
     */
    id: string;
    /**
     * 使用者登入與顯示用的帳號名稱
     */
    username: string;
    /**
     * 密碼，應儲存為雜湊值以確保安全性
     * 注意：實際應用中應使用安全的雜湊演算法
     * 並且不應直接儲存明文密碼
     */
    passwordHash: string;
    /**
     * 使用者所屬的角色清單，決定其在系統中的權限與存取層級
     */
    roles: Role[];
    /**
     * 此使用者對各設備的細部權限設定（可選）
     */
    devicePermissions?: DevicePermission[];
    /**
     * 使用者帳號建立時間（可選）
     */
    createdAt?: Date;
    /**
     * 使用者帳號最近更新時間（可選）
     */
    updatedAt?: Date;
    /**
     * 使用者電子郵件（可選），可用於通知或雙因素認證
     */
    email?: string;
}
