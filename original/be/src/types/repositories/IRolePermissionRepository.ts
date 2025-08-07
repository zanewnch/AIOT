/**
 * @fileoverview 角色權限關聯資料存取層介面定義
 * 
 * 定義角色權限關聯相關資料操作的標準介面，為角色權限關聯資料存取層提供契約。
 * 此介面確保所有角色權限關聯相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { Transaction } from 'sequelize';
import type { RolePermissionModel, RolePermissionCreationAttributes } from '../../models/rbac/RoleToPermissionModel.js';
import type { RoleModel } from '../../models/rbac/RoleModel.js';
import type { PermissionModel } from '../../models/rbac/PermissionModel.js';

/**
 * 角色權限關聯資料存取層介面
 * 定義角色權限關聯相關資料操作的標準介面
 */
export interface IRolePermissionRepository {
  /**
   * 建立角色權限關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例
   */
  create(roleId: number, permissionId: number, transaction?: Transaction): Promise<RolePermissionModel>;

  /**
   * 批量建立角色權限關聯
   * @param associations 關聯資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例陣列
   */
  bulkCreate(associations: RolePermissionCreationAttributes[], transaction?: Transaction): Promise<RolePermissionModel[]>;

  /**
   * 查詢或建立角色權限關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns [關聯實例, 是否為新建立]
   */
  findOrCreate(roleId: number, permissionId: number, transaction?: Transaction): Promise<[RolePermissionModel, boolean]>;

  /**
   * 刪除角色權限關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete(roleId: number, permissionId: number, transaction?: Transaction): Promise<boolean>;

  /**
   * 刪除角色的所有權限關聯
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  deleteByRoleId(roleId: number, transaction?: Transaction): Promise<number>;

  /**
   * 刪除權限的所有角色關聯
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  deleteByPermissionId(permissionId: number, transaction?: Transaction): Promise<number>;

  /**
   * 檢查角色權限關聯是否存在
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @returns 是否存在
   */
  exists(roleId: number, permissionId: number): Promise<boolean>;

  /**
   * 查詢角色的所有權限
   * @param roleId 角色 ID
   * @param includePermissionDetails 是否包含權限詳細資訊
   * @returns 權限列表
   */
  findPermissionsByRoleId(roleId: number, includePermissionDetails?: boolean): Promise<PermissionModel[]>;

  /**
   * 查詢權限的所有角色
   * @param permissionId 權限 ID
   * @param includeRoleDetails 是否包含角色詳細資訊
   * @returns 角色列表
   */
  findRolesByPermissionId(permissionId: number, includeRoleDetails?: boolean): Promise<RoleModel[]>;

  /**
   * 查詢所有角色權限關聯
   * @param includeDetails 是否包含角色和權限詳細資訊
   * @returns 關聯列表
   */
  findAll(includeDetails?: boolean): Promise<RolePermissionModel[]>;

  /**
   * 計算關聯總數
   * @returns 關聯總數
   */
  count(): Promise<number>;

  /**
   * 計算特定角色的權限數量
   * @param roleId 角色 ID
   * @returns 權限數量
   */
  countPermissionsByRoleId(roleId: number): Promise<number>;

  /**
   * 計算特定權限的角色數量
   * @param permissionId 權限 ID
   * @returns 角色數量
   */
  countRolesByPermissionId(permissionId: number): Promise<number>;

  /**
   * 查詢特定角色和權限的關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @returns 角色權限關聯實例或 null
   */
  findByRoleAndPermission(roleId: number, permissionId: number): Promise<RolePermissionModel | null>;
}