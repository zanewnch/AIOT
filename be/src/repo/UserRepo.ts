/**
 * @fileoverview 使用者資料存取層
 * ===============================
 * 
 * 此檔案提供使用者相關的資料庫操作，包含查詢、建立等基本 CRUD 功能。
 * 此 Repository 是 RBAC (Role-Based Access Control) 系統中使用者管理的核心資料存取層。
 * 
 * 設計模式：
 * - 倉庫模式 (Repository Pattern)：封裝資料存取邏輯，提供統一的介面
 * - 介面隔離原則 (Interface Segregation Principle)：定義明確的操作介面
 * - 依賴倒置原則 (Dependency Inversion Principle)：依賴抽象而非具體實作
 * 
 * 安全考量：
 * - 密碼以雜湊值形式儲存，絕不處理明文密碼
 * - 使用者名稱具有唯一性約束，防止重複註冊
 * - 支援電子郵件的可選欄位，提供額外的聯絡方式
 * - 查詢操作支援關聯載入，一次取得使用者的角色和權限資訊
 * 
 * 性能優化：
 * - 使用 Sequelize 的 findByPk 方法進行主鍵查詢，利用索引提升效能
 * - 支援 include 選項進行關聯查詢，減少 N+1 查詢問題
 * - 透過 through.attributes 控制中間表欄位，減少不必要的資料傳輸
 * 
 * 主要功能：
 * - 根據使用者名稱查詢使用者（用於登入驗證）
 * - 根據使用者 ID 查詢使用者（基本資料查詢）
 * - 根據使用者 ID 查詢使用者（包含角色和權限）
 * - 建立新的使用者記錄
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */

// 引入使用者模型，用於基本的使用者資料操作
import { UserModel } from '../models/rbac/UserModel.js';
// 引入角色模型，用於使用者角色關聯查詢
import { RoleModel } from '../models/rbac/RoleModel.js';
// 引入權限模型，用於角色權限關聯查詢
import { PermissionModel } from '../models/rbac/PermissionModel.js';

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
}

/**
 * 使用者資料存取實作類別
 * 
 * 實作 IUserRepository 介面，提供具體的使用者資料操作功能。
 * 採用倉庫模式設計，封裝所有與使用者資料相關的資料存取邏輯，
 * 是 RBAC 系統中使用者管理的核心實作。
 * 
 * @class UserRepository
 * @implements {IUserRepository}
 * @description 使用者資料存取層的具體實作類別
 * @version 1.0.0
 */
export class UserRepository implements IUserRepository {
    /**
     * 根據使用者名稱查詢使用者
     * 
     * 此方法使用 Sequelize 的 findOne 方法透過使用者名稱查詢使用者記錄。
     * 主要用於登入驗證流程和檢查使用者名稱是否已存在。
     * 由於使用者名稱具有唯一性約束，此方法最多只會回傳一筆記錄。
     * 
     * @param {string} username 要查詢的使用者名稱
     * @returns {Promise<UserModel | null>} 找到的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * try {
     *   const user = await userRepo.findByUsername('alice');
     *   if (user) {
     *     console.log(`找到使用者：${user.username}`);
     *     // 可以進行密碼驗證等後續操作
     *   } else {
     *     console.log('使用者不存在');
     *   }
     * } catch (error) {
     *   console.error('查詢使用者失敗:', error);
     * }
     * ```
     */
    async findByUsername(username: string): Promise<UserModel | null> {
        // 使用 Sequelize 的 findOne 方法進行單一記錄查詢
        // where 條件確保只查詢指定的使用者名稱
        return await UserModel.findOne({ where: { username } });
    }

    /**
     * 根據使用者 ID 查詢使用者
     * 
     * 此方法使用 Sequelize 的 findByPk 方法透過主鍵進行查詢，
     * 具有最佳的查詢效能，因為主鍵通常有索引支援。
     * 適用於需要使用者基本資料但不需要角色權限資訊的場景。
     * 
     * @param {number} id 使用者的主鍵 ID
     * @returns {Promise<UserModel | null>} 找到的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * try {
     *   const user = await userRepo.findById(123);
     *   if (user) {
     *     console.log(`使用者：${user.username}, 信箱：${user.email}`);
     *     console.log(`帳戶建立時間：${user.createdAt}`);
     *   } else {
     *     console.log('找不到指定的使用者');
     *   }
     * } catch (error) {
     *   console.error('查詢使用者失敗:', error);
     * }
     * ```
     */
    async findById(id: number): Promise<UserModel | null> {
        // 使用 Sequelize 的 findByPk 方法進行主鍵查詢
        // 這是最高效的查詢方式，因為主鍵通常有索引支援
        return await UserModel.findByPk(id);
    }

    /**
     * 根據使用者 ID 查詢使用者（包含角色和權限）
     * 
     * 此方法除了查詢使用者基本資訊外，還會透過關聯查詢一併載入使用者的角色和權限資訊。
     * 使用 Sequelize 的 include 選項進行深度關聯查詢，避免 N+1 查詢問題。
     * 適用於需要進行權限檢查的場景，能夠一次性取得完整的授權資訊。
     * 
     * @param {number} id 使用者的主鍵 ID
     * @returns {Promise<UserModel | null>} 包含角色和權限的使用者模型，若不存在則回傳 null
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * try {
     *   const user = await userRepo.findByIdWithRolesAndPermissions(123);
     *   if (user && user.roles) {
     *     console.log(`使用者角色：${user.roles.map(r => r.name).join(', ')}`);
     *     
     *     // 取得所有權限
     *     const allPermissions = user.roles.flatMap(role => role.permissions || []);
     *     console.log(`所有權限：${allPermissions.map(p => p.name).join(', ')}`);
     *     
     *     // 檢查特定權限
     *     const hasReadPermission = allPermissions.some(p => p.name === 'read');
     *     console.log(`具有讀取權限：${hasReadPermission}`);
     *   }
     * } catch (error) {
     *   console.error('查詢使用者角色權限失敗:', error);
     * }
     * ```
     */
    async findByIdWithRolesAndPermissions(id: number): Promise<UserModel | null> {
        // 使用 Sequelize 的 findByPk 方法結合 include 選項進行關聯查詢
        return await UserModel.findByPk(id, {
            include: [
                {
                    model: RoleModel, // 關聯角色模型
                    as: 'roles', // 使用別名 'roles'
                    include: [
                        {
                            model: PermissionModel, // 關聯權限模型
                            as: 'permissions', // 使用別名 'permissions'
                            through: { attributes: [] } // 不包含 role_permissions 中間表的屬性
                        }
                    ],
                    through: { attributes: [] } // 不包含 user_roles 中間表的屬性
                }
            ]
        });
    }

    /**
     * 建立新的使用者記錄
     * 
     * 此方法使用 Sequelize 的 create 方法建立新的使用者記錄。
     * 適用於使用者註冊或管理員建立新帳戶的場景。
     * 為了安全性考量，此方法只接受已雜湊的密碼，不處理明文密碼。
     * 
     * 安全特性：
     * - 使用者名稱具有唯一性約束，重複時會拋出錯誤
     * - 只接受已雜湊的密碼，確保密碼安全
     * - 支援可選的電子郵件欄位
     * 
     * @param {Object} userData 使用者資料物件
     * @param {string} userData.username 使用者名稱（必須唯一）
     * @param {string} userData.passwordHash 已雜湊的密碼（請勿傳入明文密碼）
     * @param {string} [userData.email] 電子郵件地址（可選）
     * @returns {Promise<UserModel>} 成功建立的使用者模型
     * @throws {Error} 當使用者名稱重複、資料格式錯誤或資料庫操作失敗時拋出異常
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * const bcrypt = require('bcrypt');
     * 
     * try {
     *   // 先對密碼進行雜湊處理
     *   const passwordHash = await bcrypt.hash('userPassword123', 10);
     *   
     *   // 建立新使用者
     *   const newUser = await userRepo.create({
     *     username: 'bob',
     *     passwordHash: passwordHash,
     *     email: 'bob@example.com'
     *   });
     *   
     *   console.log(`建立使用者成功，ID：${newUser.id}`);
     *   console.log(`使用者名稱：${newUser.username}`);
     *   console.log(`建立時間：${newUser.createdAt}`);
     * } catch (error) {
     *   if (error.name === 'SequelizeUniqueConstraintError') {
     *     console.error('使用者名稱已存在');
     *   } else {
     *     console.error('建立使用者失敗:', error);
     *   }
     * }
     * ```
     */
    async create(userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel> {
        // 使用 Sequelize 的 create 方法建立新的使用者記錄
        // 若使用者名稱重複，會自動拋出 SequelizeUniqueConstraintError
        return await UserModel.create(userData);
    }
}