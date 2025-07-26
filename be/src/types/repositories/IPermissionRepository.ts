/**
 * @fileoverview 權限資料存取層介面定義
 * 
 * 定義權限相關資料操作的標準介面，為權限資料存取層提供契約。
 * 此介面確保所有權限相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import { 
  PermissionModel, 
  PermissionAttributes, 
  PermissionCreationAttributes 
} from '../../models/rbac/PermissionModel.js';
import type { Transaction } from 'sequelize';

/**
 * 權限資料存取層介面
 * 定義權限相關資料操作的標準介面
 */
export interface IPermissionRepository {
  /**
   * 根據 ID 查詢權限
   * @param id 權限 ID
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限實例或 null
   */
  findById(id: number, includeRoles?: boolean): Promise<PermissionModel | null>;

  /**
   * 根據權限名稱查詢權限
   * @param name 權限名稱
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限實例或 null
   */
  findByName(name: string, includeRoles?: boolean): Promise<PermissionModel | null>;

  /**
   * 查詢所有權限
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限列表
   */
  findAll(includeRoles?: boolean): Promise<PermissionModel[]>;

  /**
   * 建立新權限
   * @param permissionData 權限資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的權限實例
   */
  create(permissionData: PermissionCreationAttributes, transaction?: Transaction): Promise<PermissionModel>;

  /**
   * 批量建立權限
   * @param permissionsData 權限資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的權限實例陣列
   */
  bulkCreate(permissionsData: PermissionCreationAttributes[], transaction?: Transaction): Promise<PermissionModel[]>;

  /**
   * 查詢或建立權限
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [權限實例, 是否為新建立]
   */
  findOrCreate(
    whereCondition: Partial<PermissionAttributes>,
    defaults: PermissionCreationAttributes,
    transaction?: Transaction
  ): Promise<[PermissionModel, boolean]>;

  /**
   * 更新權限
   * @param id 權限 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的權限實例或 null
   */
  update(
    id: number,
    updateData: Partial<PermissionCreationAttributes>,
    transaction?: Transaction
  ): Promise<PermissionModel | null>;

  /**
   * 刪除權限
   * @param id 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete(id: number, transaction?: Transaction): Promise<boolean>;

  /**
   * 檢查權限是否存在
   * @param name 權限名稱
   * @returns 是否存在
   */
  exists(name: string): Promise<boolean>;

  /**
   * 計算權限總數
   * @returns 權限總數
   */
  count(): Promise<number>;

  /**
   * 根據權限名稱陣列查詢權限
   * @param names 權限名稱陣列
   * @returns 權限列表
   */
  findByNames(names: string[]): Promise<PermissionModel[]>;
}