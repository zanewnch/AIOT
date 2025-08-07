/**
 * @fileoverview 使用者資料存取層介面定義
 * 
 * 定義使用者相關資料操作的標準介面，為使用者資料存取層提供契約。
 * 此介面確保所有使用者相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { UserModel } from '../../models/rbac/UserModel.js';

/**
 * 使用者資料存取介面
 * 
 * 定義使用者相關的基本資料操作方法，遵循介面隔離原則，
 * 提供 RBAC 系統中使用者管理所需的核心功能。
 * 
 * @interface IUserRepository
 * @description 提供使用者資料存取的標準操作介面
 * @version 1.0.0
 */
export interface IUserRepository {
    /**
     * 根據使用者名稱查詢使用者
     * 
     * 此方法主要用於使用者登入驗證流程，透過使用者名稱查找對應的使用者記錄。
     * 使用者名稱在系統中具有唯一性約束，因此最多只會回傳一筆記錄。
     * 
     * @param {string} username 使用者名稱（必須是唯一的）
     * @returns {Promise<UserModel | null>} 使用者模型或 null（若找不到）
     * @throws {Error} 當資料庫連線失敗或查詢錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const repo: IUserRepository = new UserRepository();
     * const user = await repo.findByUsername('alice');
     * if (user) {
     *   console.log('使用者存在，可以進行密碼驗證');
     * } else {
     *   console.log('使用者不存在');
     * }
     * ```
     */
    findByUsername(username: string): Promise<UserModel | null>;
    
    /**
     * 根據使用者 ID 查詢使用者
     * 
     * 此方法透過主鍵快速查詢特定使用者的基本資訊，
     * 適用於需要使用者基本資料但不需要角色權限資訊的場景。
     * 
     * @param {number} id 使用者的主鍵 ID
     * @returns {Promise<UserModel | null>} 使用者模型或 null（若找不到）
     * @throws {Error} 當資料庫連線失敗或查詢錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const repo: IUserRepository = new UserRepository();
     * const user = await repo.findById(123);
     * if (user) {
     *   console.log(`使用者資訊：${user.username}, ${user.email}`);
     * }
     * ```
     */
    findById(id: number): Promise<UserModel | null>;
    
    /**
     * 根據使用者 ID 查詢使用者（包含角色和權限）
     * 
     * 此方法除了查詢使用者基本資訊外，還會一併載入使用者的角色和權限資訊。
     * 適用於需要進行權限檢查的場景，能夠一次性取得完整的授權資訊。
     * 
     * @param {number} id 使用者的主鍵 ID
     * @returns {Promise<UserModel | null>} 包含角色和權限的使用者模型或 null（若找不到）
     * @throws {Error} 當資料庫連線失敗或查詢錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const repo: IUserRepository = new UserRepository();
     * const user = await repo.findByIdWithRolesAndPermissions(123);
     * if (user && user.roles) {
     *   const permissions = user.roles.flatMap(role => role.permissions || []);
     *   console.log(`使用者權限：${permissions.map(p => p.name).join(', ')}`);
     * }
     * ```
     */
    findByIdWithRolesAndPermissions(id: number): Promise<UserModel | null>;
    
    /**
     * 建立新的使用者記錄
     * 
     * 此方法用於建立新的使用者帳戶，支援使用者註冊和管理員建立帳戶的場景。
     * 密碼必須已經過雜湊處理，不接受明文密碼以確保安全性。
     * 
     * @param {Object} userData 使用者資料物件
     * @param {string} userData.username 使用者名稱（必須唯一）
     * @param {string} userData.passwordHash 已雜湊的密碼
     * @param {string} [userData.email] 電子郵件地址（可選）
     * @returns {Promise<UserModel>} 建立成功的使用者模型
     * @throws {Error} 當使用者名稱重複、資料格式錯誤或資料庫操作失敗時拋出異常
     * 
     * @example
     * ```typescript
     * const repo: IUserRepository = new UserRepository();
     * const hashedPassword = await bcrypt.hash('password123', 10);
     * const newUser = await repo.create({
     *   username: 'bob',
     *   passwordHash: hashedPassword,
     *   email: 'bob@example.com'
     * });
     * console.log(`建立使用者成功，ID：${newUser.id}`);
     * ```
     */
    create(userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel>;

    /**
     * 批量建立使用者記錄
     * 
     * @param {Array} usersData 使用者資料陣列
     * @returns {Promise<UserModel[]>} 建立成功的使用者模型陣列
     */
    bulkCreate(usersData: { username: string; passwordHash: string; email?: string }[]): Promise<UserModel[]>;

    /**
     * 查詢或建立使用者
     * 
     * @param whereCondition 查詢條件
     * @param defaults 預設建立值
     * @returns [使用者實例, 是否為新建立]
     */
    findOrCreate(
        whereCondition: { username: string },
        defaults: { username: string; passwordHash: string; email?: string }
    ): Promise<[UserModel, boolean]>;

    /**
     * 查詢所有使用者
     * 
     * 此方法用於取得系統中所有使用者的列表，適用於管理員查看使用者清單的場景。
     * 
     * @returns {Promise<UserModel[]>} 所有使用者模型的陣列
     * @throws {Error} 當資料庫連線失敗或查詢錯誤時拋出異常
     */
    findAll(): Promise<UserModel[]>;

    /**
     * 根據電子郵件查詢使用者
     * 
     * 此方法透過電子郵件地址查詢使用者記錄，適用於電子郵件登入或唯一性檢查的場景。
     * 
     * @param {string} email 電子郵件地址
     * @returns {Promise<UserModel | null>} 使用者模型或 null（若找不到）
     * @throws {Error} 當資料庫連線失敗或查詢錯誤時拋出異常
     */
    findByEmail(email: string): Promise<UserModel | null>;

    /**
     * 更新使用者資料
     * 
     * 此方法用於更新指定使用者的資料，支援部分欄位更新。
     * 
     * @param {number} id 使用者 ID
     * @param {Partial<{username: string; email: string; passwordHash: string}>} updateData 更新資料
     * @returns {Promise<UserModel | null>} 更新後的使用者模型或 null（若找不到）
     * @throws {Error} 當資料庫連線失敗或更新錯誤時拋出異常
     */
    update(id: number, updateData: Partial<{username: string; email: string; passwordHash: string}>): Promise<UserModel | null>;

    /**
     * 刪除使用者
     * 
     * 此方法用於從系統中刪除指定的使用者記錄。
     * 
     * @param {number} id 使用者 ID
     * @returns {Promise<boolean>} 是否成功刪除
     * @throws {Error} 當資料庫連線失敗或刪除錯誤時拋出異常
     */
    delete(id: number): Promise<boolean>;
}