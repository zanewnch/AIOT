/**
 * @fileoverview 權限資料存取層
 * 
 * 提供權限相關的資料庫操作封裝，實現權限實體的 CRUD 操作。
 * 此資料存取層封裝了所有與權限表相關的資料庫查詢和操作，
 * 為上層服務提供簡潔的資料存取介面。
 * 
 * 主要功能：
 * - 權限的基本 CRUD 操作
 * - 權限名稱查詢和驗證
 * - 權限與角色關聯查詢
 * - 批量權限操作
 * - 權限存在性檢查
 * 
 * 資料庫表結構：
 * - permissions: 權限基本資訊表
 * - role_permissions: 角色權限關聯表
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

import { 
  PermissionModel, 
  PermissionAttributes, 
  PermissionCreationAttributes 
} from '../models/rbac/PermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { createLogger } from '../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';

const logger = createLogger('PermissionRepository');

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

/**
 * 權限資料存取層實作類別
 * 實作 IPermissionRepository 介面，提供完整的權限資料操作功能
 */
export class PermissionRepository implements IPermissionRepository {
  /**
   * 根據 ID 查詢權限
   * @param id 權限 ID
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限實例或 null
   */
  async findById(id: number, includeRoles: boolean = false): Promise<PermissionModel | null> {
    try {
      logger.debug(`Finding permission by ID: ${id}, includeRoles: ${includeRoles}`);
      
      const permission = await PermissionModel.findByPk(id, {
        include: includeRoles ? [
          {
            model: RoleModel,
            as: 'roles',
            through: { attributes: [] } // 不包含中介表欄位
          }
        ] : undefined
      });

      if (!permission) {
        logger.debug(`Permission not found with ID: ${id}`);
        return null;
      }

      logger.debug(`Permission found: ${permission.name} (ID: ${permission.id})`);
      return permission;
    } catch (error) {
      logger.error(`Error finding permission by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根據權限名稱查詢權限
   * @param name 權限名稱
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限實例或 null
   */
  async findByName(name: string, includeRoles: boolean = false): Promise<PermissionModel | null> {
    try {
      logger.debug(`Finding permission by name: ${name}, includeRoles: ${includeRoles}`);
      
      const permission = await PermissionModel.findOne({
        where: { name },
        include: includeRoles ? [
          {
            model: RoleModel,
            as: 'roles',
            through: { attributes: [] }
          }
        ] : undefined
      });

      if (!permission) {
        logger.debug(`Permission not found with name: ${name}`);
        return null;
      }

      logger.debug(`Permission found: ${permission.name} (ID: ${permission.id})`);
      return permission;
    } catch (error) {
      logger.error(`Error finding permission by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * 查詢所有權限
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限列表
   */
  async findAll(includeRoles: boolean = false): Promise<PermissionModel[]> {
    try {
      logger.debug(`Finding all permissions, includeRoles: ${includeRoles}`);
      
      const permissions = await PermissionModel.findAll({
        include: includeRoles ? [
          {
            model: RoleModel,
            as: 'roles',
            through: { attributes: [] }
          }
        ] : undefined,
        order: [['name', 'ASC']]
      });

      logger.debug(`Found ${permissions.length} permissions`);
      return permissions;
    } catch (error) {
      logger.error('Error finding all permissions:', error);
      throw error;
    }
  }

  /**
   * 建立新權限
   * @param permissionData 權限資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的權限實例
   */
  async create(permissionData: PermissionCreationAttributes, transaction?: Transaction): Promise<PermissionModel> {
    try {
      logger.debug(`Creating permission: ${permissionData.name}`);
      
      const permission = await PermissionModel.create(permissionData, { transaction });
      
      logger.info(`Permission created successfully: ${permission.name} (ID: ${permission.id})`);
      return permission;
    } catch (error) {
      logger.error(`Error creating permission ${permissionData.name}:`, error);
      throw error;
    }
  }

  /**
   * 批量建立權限
   * @param permissionsData 權限資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的權限實例陣列
   */
  async bulkCreate(permissionsData: PermissionCreationAttributes[], transaction?: Transaction): Promise<PermissionModel[]> {
    try {
      logger.debug(`Bulk creating ${permissionsData.length} permissions`);
      
      const permissions = await PermissionModel.bulkCreate(permissionsData, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${permissions.length} permissions`);
      return permissions;
    } catch (error) {
      logger.error('Error bulk creating permissions:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立權限
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [權限實例, 是否為新建立]
   */
  async findOrCreate(
    whereCondition: Partial<PermissionAttributes>,
    defaults: PermissionCreationAttributes,
    transaction?: Transaction
  ): Promise<[PermissionModel, boolean]> {
    try {
      const conditionStr = JSON.stringify(whereCondition);
      logger.debug(`Finding or creating permission with condition: ${conditionStr}`);
      
      const [permission, created] = await PermissionModel.findOrCreate({
        where: whereCondition,
        defaults,
        transaction
      });
      
      if (created) {
        logger.info(`Permission created: ${permission.name} (ID: ${permission.id})`);
      } else {
        logger.debug(`Permission already exists: ${permission.name} (ID: ${permission.id})`);
      }
      
      return [permission, created];
    } catch (error) {
      logger.error('Error finding or creating permission:', error);
      throw error;
    }
  }

  /**
   * 更新權限
   * @param id 權限 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的權限實例或 null
   */
  async update(
    id: number,
    updateData: Partial<PermissionCreationAttributes>,
    transaction?: Transaction
  ): Promise<PermissionModel | null> {
    try {
      logger.debug(`Updating permission ID ${id} with data:`, updateData);
      
      const [updatedCount] = await PermissionModel.update(updateData, {
        where: { id },
        transaction
      });
      
      if (updatedCount === 0) {
        logger.warn(`No permission updated for ID: ${id}`);
        return null;
      }
      
      const updatedPermission = await this.findById(id);
      logger.info(`Permission updated successfully: ${updatedPermission?.name} (ID: ${id})`);
      
      return updatedPermission;
    } catch (error) {
      logger.error(`Error updating permission ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 刪除權限
   * @param id 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async delete(id: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting permission ID: ${id}`);
      
      const deletedCount = await PermissionModel.destroy({
        where: { id },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Permission deleted successfully (ID: ${id})`);
      } else {
        logger.warn(`No permission deleted for ID: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting permission ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 檢查權限是否存在
   * @param name 權限名稱
   * @returns 是否存在
   */
  async exists(name: string): Promise<boolean> {
    try {
      logger.debug(`Checking if permission exists: ${name}`);
      
      const count = await PermissionModel.count({
        where: { name }
      });
      
      const exists = count > 0;
      logger.debug(`Permission ${name} exists: ${exists}`);
      
      return exists;
    } catch (error) {
      logger.error(`Error checking permission existence for ${name}:`, error);
      throw error;
    }
  }

  /**
   * 計算權限總數
   * @returns 權限總數
   */
  async count(): Promise<number> {
    try {
      logger.debug('Counting total permissions');
      
      const count = await PermissionModel.count();
      
      logger.debug(`Total permissions count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting permissions:', error);
      throw error;
    }
  }

  /**
   * 根據權限名稱陣列查詢權限
   * @param names 權限名稱陣列
   * @returns 權限列表
   */
  async findByNames(names: string[]): Promise<PermissionModel[]> {
    try {
      logger.debug(`Finding permissions by names: [${names.join(', ')}]`);
      
      const permissions = await PermissionModel.findAll({
        where: {
          name: names
        },
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${permissions.length} permissions for ${names.length} names`);
      return permissions;
    } catch (error) {
      logger.error('Error finding permissions by names:', error);
      throw error;
    }
  }
}