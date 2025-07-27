/**
 * @fileoverview 使用者服務介面
 * 
 * 定義使用者管理服務的標準介面，用於使用者 CRUD 操作和認證功能。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - 使用者的完整 CRUD 操作定義
 * - 使用者查詢和驗證方法
 * - 密碼處理和認證功能
 * - 支援快取機制的方法簽名
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

/**
 * 使用者資料傳輸物件（不包含敏感資訊）
 */
export interface UserDTO {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 建立使用者請求物件
 */
export interface CreateUserRequest {
    username: string;
    email: string;
    password: string; // 明文密碼，將被加密
}

/**
 * 更新使用者請求物件
 */
export interface UpdateUserRequest {
    username?: string;
    email?: string;
    password?: string; // 明文密碼，將被加密
}

/**
 * 使用者服務介面
 * 
 * 定義使用者管理服務的標準方法，包含完整的 CRUD 操作、
 * 查詢功能、認證驗證和密碼處理。支援快取機制以提升效能。
 */
export interface IUserService {
    /**
     * 取得所有使用者列表
     * 
     * @returns 使用者 DTO 陣列的 Promise
     * @throws Error 當操作失敗時拋出錯誤
     */
    getAllUsers(): Promise<UserDTO[]>;

    /**
     * 根據 ID 取得使用者
     * 
     * @param userId 使用者 ID
     * @returns 使用者 DTO 的 Promise，若未找到則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    getUserById(userId: number): Promise<UserDTO | null>;

    /**
     * 建立新使用者
     * 
     * @param userData 使用者建立請求資料
     * @returns 新建立的使用者 DTO 的 Promise
     * @throws Error 當使用者名稱或電子郵件已存在或建立失敗時拋出錯誤
     */
    createUser(userData: CreateUserRequest): Promise<UserDTO>;

    /**
     * 更新使用者
     * 
     * @param userId 使用者 ID
     * @param updateData 更新資料
     * @returns 更新後的使用者 DTO 的 Promise，若使用者不存在則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    updateUser(userId: number, updateData: UpdateUserRequest): Promise<UserDTO | null>;

    /**
     * 刪除使用者
     * 
     * @param userId 使用者 ID
     * @returns 刪除結果的 Promise（true 表示成功，false 表示使用者不存在）
     * @throws Error 當操作失敗時拋出錯誤
     */
    deleteUser(userId: number): Promise<boolean>;

    /**
     * 根據使用者名稱查找使用者
     * 
     * @param username 使用者名稱
     * @returns 使用者 DTO 的 Promise，若未找到則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    getUserByUsername(username: string): Promise<UserDTO | null>;

    /**
     * 根據電子郵件查找使用者
     * 
     * @param email 電子郵件
     * @returns 使用者 DTO 的 Promise，若未找到則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    getUserByEmail(email: string): Promise<UserDTO | null>;

    /**
     * 驗證使用者登入
     * 
     * @param username 使用者名稱
     * @param password 密碼
     * @returns 驗證成功的使用者 DTO 的 Promise，驗證失敗則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    validateUserLogin(username: string, password: string): Promise<UserDTO | null>;

    /**
     * 驗證密碼
     * 
     * @param password 明文密碼
     * @param hash 密碼雜湊
     * @returns 密碼驗證結果的 Promise（true 表示密碼正確，false 表示密碼錯誤）
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
}