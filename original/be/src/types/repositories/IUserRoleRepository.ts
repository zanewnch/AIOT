/**
 * @fileoverview 使用者角色關聯資料存取層介面定義
 * 
 * 定義使用者角色關聯相關資料操作的標準介面，為使用者角色關聯資料存取層提供契約。
 * 此介面確保所有使用者角色關聯相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { Transaction } from 'sequelize';
import type { UserRoleModel, UserRoleCreationAttributes } from '../../models/rbac/UserToRoleModel.js';
import type { UserModel } from '../../models/rbac/UserModel.js';
import type { RoleModel } from '../../models/rbac/RoleModel.js';

/**
 * 使用者角色關聯資料存取層介面
 * 定義使用者角色關聯相關資料操作的標準介面
 */
export interface IUserRoleRepository {
  /**
   * 建立使用者角色關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例
   */
  create(userId: number, roleId: number, transaction?: Transaction): Promise<UserRoleModel>;

  /**
   * 批量建立使用者角色關聯
   * @param associations 關聯資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例陣列
   */
  bulkCreate(associations: UserRoleCreationAttributes[], transaction?: Transaction): Promise<UserRoleModel[]>;

  /**
   * 查詢或建立使用者角色關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns [關聯實例, 是否為新建立]
   */
  findOrCreate(userId: number, roleId: number, transaction?: Transaction): Promise<[UserRoleModel, boolean]>;

  /**
   * 刪除使用者角色關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete(userId: number, roleId: number, transaction?: Transaction): Promise<boolean>;

  /**
   * 刪除使用者的所有角色關聯
   * @param userId 使用者 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  deleteByUserId(userId: number, transaction?: Transaction): Promise<number>;

  /**
   * 刪除角色的所有使用者關聯
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  deleteByRoleId(roleId: number, transaction?: Transaction): Promise<number>;

  /**
   * 檢查使用者角色關聯是否存在
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @returns 是否存在
   */
  exists(userId: number, roleId: number): Promise<boolean>;

  /**
   * 查詢使用者的所有角色
   * @param userId 使用者 ID
   * @param includeRoleDetails 是否包含角色詳細資訊
   * @returns 角色列表
   */
  findRolesByUserId(userId: number, includeRoleDetails?: boolean): Promise<RoleModel[]>;

  /**
   * 查詢角色的所有使用者
   * @param roleId 角色 ID
   * @param includeUserDetails 是否包含使用者詳細資訊
   * @returns 使用者列表
   */
  findUsersByRoleId(roleId: number, includeUserDetails?: boolean): Promise<UserModel[]>;

  /**
   * 查詢所有使用者角色關聯
   * @param includeDetails 是否包含使用者和角色詳細資訊
   * @returns 關聯列表
   */
  findAll(includeDetails?: boolean): Promise<UserRoleModel[]>;

  /**
   * 計算關聯總數
   * @returns 關聯總數
   */
  count(): Promise<number>;

  /**
   * 計算特定使用者的角色數量
   * @param userId 使用者 ID
   * @returns 角色數量
   */
  countRolesByUserId(userId: number): Promise<number>;

  /**
   * 計算特定角色的使用者數量
   * @param roleId 角色 ID
   * @returns 使用者數量
   */
  countUsersByRoleId(roleId: number): Promise<number>;

  /**
   * 檢查使用者是否擁有特定角色
   * @param userId 使用者 ID
   * @param roleName 角色名稱
   * @returns 是否擁有角色
   */
  userHasRole(userId: number, roleName: string): Promise<boolean>;

  /**
   * 檢查使用者是否擁有任一角色
   * @param userId 使用者 ID
   * @param roleNames 角色名稱陣列
   * @returns 是否擁有任一角色
   */
  userHasAnyRole(userId: number, roleNames: string[]): Promise<boolean>;

  /**
   * 查詢特定使用者和角色的關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @returns 使用者角色關聯實例或 null
   */
  findByUserAndRole(userId: number, roleId: number): Promise<UserRoleModel | null>;
}