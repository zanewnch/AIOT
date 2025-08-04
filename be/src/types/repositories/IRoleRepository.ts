/**
 * @fileoverview 角色資料存取層介面定義
 * 
 * 定義角色相關資料操作的標準介面，為角色資料存取層提供契約。
 * 此介面確保所有角色相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import { 
  RoleModel, 
  RoleAttributes, 
  RoleCreationAttributes 
} from '../../models/rbac/RoleModel.js';
import type { Transaction } from 'sequelize';

/**
 * 角色資料存取層介面
 * 定義角色相關資料操作的標準介面
 */
export interface IRoleRepository {
  /**
   * 根據 ID 查詢角色
   * @param id 角色 ID
   * @returns 角色實例或 null
   */
  findById(id: number): Promise<RoleModel | null>;

  /**
   * 根據角色名稱查詢角色
   * @param name 角色名稱
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的使用者資料
   * @returns 角色實例或 null
   */
  findByName(name: string, includePermissions?: boolean, includeUsers?: boolean): Promise<RoleModel | null>;

  /**
   * 查詢所有角色
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的使用者資料
   * @returns 角色列表
   */
  findAll(includePermissions?: boolean, includeUsers?: boolean): Promise<RoleModel[]>;

  /**
   * 建立新角色
   * @param roleData 角色資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色實例
   */
  create(roleData: RoleCreationAttributes, transaction?: Transaction): Promise<RoleModel>;

  /**
   * 批量建立角色
   * @param rolesData 角色資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色實例陣列
   */
  bulkCreate(rolesData: RoleCreationAttributes[], transaction?: Transaction): Promise<RoleModel[]>;

  /**
   * 查詢或建立角色
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [角色實例, 是否為新建立]
   */
  findOrCreate(
    whereCondition: Partial<RoleAttributes>,
    defaults: RoleCreationAttributes,
    transaction?: Transaction
  ): Promise<[RoleModel, boolean]>;

  /**
   * 更新角色
   * @param id 角色 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的角色實例或 null
   */
  update(
    id: number,
    updateData: Partial<RoleCreationAttributes>,
    transaction?: Transaction
  ): Promise<RoleModel | null>;

  /**
   * 刪除角色
   * @param id 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete(id: number, transaction?: Transaction): Promise<boolean>;

  /**
   * 檢查角色是否存在
   * @param name 角色名稱
   * @returns 是否存在
   */
  exists(name: string): Promise<boolean>;

  /**
   * 計算角色總數
   * @returns 角色總數
   */
  count(): Promise<number>;

  /**
   * 根據角色名稱陣列查詢角色
   * @param names 角色名稱陣列
   * @returns 角色列表
   */
  findByNames(names: string[]): Promise<RoleModel[]>;
}