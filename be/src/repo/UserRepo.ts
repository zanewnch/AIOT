/**
 * UserRepo - 使用者資料存取層
 * ===========================
 * 負責處理使用者相關的資料庫操作，包含查詢、建立等基本 CRUD 功能。
 * 此 Repository 是 RBAC 系統中使用者管理的核心資料存取層。
 * 
 * 主要功能：
 * - 根據使用者名稱查詢使用者
 * - 根據使用者 ID 查詢使用者
 * - 建立新的使用者記錄
 * 
 * 安全考量：
 * - 密碼以雜湊值形式儲存，不處理明文密碼
 * - 使用者名稱具有唯一性約束
 * - 支援電子郵件的可選欄位
 */

import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';

/**
 * 使用者資料存取介面
 * 定義使用者相關的基本資料操作方法
 */
export interface IUserRepository {
    /**
     * 根據使用者名稱查詢使用者
     * @param username 使用者名稱
     * @returns Promise<UserModel | null> 使用者模型或 null（若找不到）
     */
    findByUsername(username: string): Promise<UserModel | null>;
    
    /**
     * 根據使用者 ID 查詢使用者
     * @param id 使用者 ID
     * @returns Promise<UserModel | null> 使用者模型或 null（若找不到）
     */
    findById(id: number): Promise<UserModel | null>;
    
    /**
     * 根據使用者 ID 查詢使用者（包含角色和權限）
     * @param id 使用者 ID
     * @returns Promise<UserModel | null> 使用者模型或 null（若找不到）
     */
    findByIdWithRolesAndPermissions(id: number): Promise<UserModel | null>;
    
    /**
     * 建立新的使用者記錄
     * @param userData 使用者資料物件
     * @returns Promise<UserModel> 建立成功的使用者模型
     */
    create(userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel>;
}

/**
 * 使用者資料存取實作類別
 * 實作 IUserRepository 介面，提供具體的使用者資料操作功能
 */
export class UserRepository implements IUserRepository {
    /**
     * 根據使用者名稱查詢使用者
     * 主要用於登入驗證和檢查使用者名稱是否已存在
     * 
     * @param username 要查詢的使用者名稱
     * @returns Promise<UserModel | null> 找到的使用者模型，若不存在則回傳 null
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * const user = await userRepo.findByUsername('alice');
     * if (user) {
     *   console.log(`找到使用者：${user.username}`);
     * } else {
     *   console.log('使用者不存在');
     * }
     * ```
     */
    async findByUsername(username: string): Promise<UserModel | null> {
        return await UserModel.findOne({ where: { username } });
    }

    /**
     * 根據使用者 ID 查詢使用者
     * 用於通過主鍵快速查詢特定使用者的詳細資訊
     * 
     * @param id 使用者的主鍵 ID
     * @returns Promise<UserModel | null> 找到的使用者模型，若不存在則回傳 null
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * const user = await userRepo.findById(123);
     * if (user) {
     *   console.log(`使用者：${user.username}, 信箱：${user.email}`);
     * }
     * ```
     */
    async findById(id: number): Promise<UserModel | null> {
        return await UserModel.findByPk(id);
    }

    /**
     * 根據使用者 ID 查詢使用者（包含角色和權限）
     * 用於權限檢查時一次性取得使用者的所有角色和權限資訊
     * 
     * @param id 使用者的主鍵 ID
     * @returns Promise<UserModel | null> 包含角色和權限的使用者模型，若不存在則回傳 null
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * const user = await userRepo.findByIdWithRolesAndPermissions(123);
     * if (user && user.roles) {
     *   console.log(`使用者角色：${user.roles.map(r => r.name).join(', ')}`);
     *   user.roles.forEach(role => {
     *     if (role.permissions) {
     *       console.log(`角色 ${role.name} 的權限：${role.permissions.map(p => p.name).join(', ')}`);
     *     }
     *   });
     * }
     * ```
     */
    async findByIdWithRolesAndPermissions(id: number): Promise<UserModel | null> {
        return await UserModel.findByPk(id, {
            include: [
                {
                    model: RoleModel,
                    as: 'roles',
                    include: [
                        {
                            model: PermissionModel,
                            as: 'permissions',
                            through: { attributes: [] } // 不包含中間表屬性
                        }
                    ],
                    through: { attributes: [] } // 不包含中間表屬性
                }
            ]
        });
    }

    /**
     * 建立新的使用者記錄
     * 用於使用者註冊或管理員建立新帳戶
     * 
     * @param userData 使用者資料物件
     * @param userData.username 使用者名稱（必須唯一）
     * @param userData.passwordHash 已雜湊的密碼（請勿傳入明文密碼）
     * @param userData.email 電子郵件地址（可選）
     * @returns Promise<UserModel> 成功建立的使用者模型
     * 
     * @throws {Error} 當使用者名稱重複或資料格式錯誤時拋出錯誤
     * 
     * @example
     * ```typescript
     * const userRepo = new UserRepository();
     * const newUser = await userRepo.create({
     *   username: 'bob',
     *   passwordHash: '$2b$10$hashedPassword...',
     *   email: 'bob@example.com'
     * });
     * console.log(`建立使用者成功，ID：${newUser.id}`);
     * ```
     */
    async create(userData: { username: string; passwordHash: string; email?: string }): Promise<UserModel> {
        return await UserModel.create(userData);
    }
}