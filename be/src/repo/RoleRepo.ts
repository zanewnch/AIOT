/**
 * @fileoverview 角色資料存取層
 * 
 * 提供角色相關的資料庫操作封裝，實現角色實體的 CRUD 操作。
 * 此資料存取層封裝了所有與角色表相關的資料庫查詢和操作，
 * 為上層服務提供簡潔的資料存取介面。
 * 
 * 主要功能：
 * - 角色的基本 CRUD 操作
 * - 角色名稱查詢和驗證
 * - 角色與權限、使用者關聯查詢
 * - 批量角色操作
 * - 角色存在性檢查
 * 
 * 資料庫表結構：
 * - roles: 角色基本資訊表
 * - role_permissions: 角色權限關聯表
 * - user_roles: 使用者角色關聯表
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

import { 
  RoleModel, 
  RoleAttributes, 
  RoleCreationAttributes 
} from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
import { createLogger } from '../configs/loggerConfig.js';
import { IRoleRepository } from '../types/repositories/IRoleRepository.js';
import type { Transaction } from 'sequelize';

const logger = createLogger('RoleRepository');


/**
 * 角色資料存取層實作類別
 * 實作 IRoleRepository 介面，提供完整的角色資料操作功能
 */
export class RoleRepository implements IRoleRepository {
  /**
   * 根據 ID 查詢角色
   * @param id 角色 ID
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的使用者資料
   * @returns 角色實例或 null
   */
  async findById(
    id: number, 
    includePermissions: boolean = false, 
    includeUsers: boolean = false
  ): Promise<RoleModel | null> {
    try {
      logger.debug(`Finding role by ID: ${id}, includePermissions: ${includePermissions}, includeUsers: ${includeUsers}`);
      
      const includes = [];
      if (includePermissions) {
        includes.push({
          model: PermissionModel,
          as: 'permissions',
          through: { attributes: [] } // 不包含中介表欄位
        });
      }
      if (includeUsers) {
        includes.push({
          model: UserModel,
          as: 'users',
          through: { attributes: [] }
        });
      }

      const role = await RoleModel.findByPk(id, {
        include: includes.length > 0 ? includes : undefined
      });

      if (!role) {
        logger.debug(`Role not found with ID: ${id}`);
        return null;
      }

      logger.debug(`Role found: ${role.name} (ID: ${role.id})`);
      return role;
    } catch (error) {
      logger.error(`Error finding role by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色名稱查詢角色
   * @param name 角色名稱
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的使用者資料
   * @returns 角色實例或 null
   */
  async findByName(
    name: string, 
    includePermissions: boolean = false, 
    includeUsers: boolean = false
  ): Promise<RoleModel | null> {
    try {
      logger.debug(`Finding role by name: ${name}, includePermissions: ${includePermissions}, includeUsers: ${includeUsers}`);
      
      const includes = [];
      if (includePermissions) {
        includes.push({
          model: PermissionModel,
          as: 'permissions',
          through: { attributes: [] }
        });
      }
      if (includeUsers) {
        includes.push({
          model: UserModel,
          as: 'users',
          through: { attributes: [] }
        });
      }

      const role = await RoleModel.findOne({
        where: { name },
        include: includes.length > 0 ? includes : undefined
      });

      if (!role) {
        logger.debug(`Role not found with name: ${name}`);
        return null;
      }

      logger.debug(`Role found: ${role.name} (ID: ${role.id})`);
      return role;
    } catch (error) {
      logger.error(`Error finding role by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * 查詢所有角色
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的使用者資料
   * @returns 角色列表
   */
  async findAll(
    includePermissions: boolean = false, 
    includeUsers: boolean = false
  ): Promise<RoleModel[]> {
    try {
      logger.debug(`Finding all roles, includePermissions: ${includePermissions}, includeUsers: ${includeUsers}`);
      
      const includes = [];
      if (includePermissions) {
        includes.push({
          model: PermissionModel,
          as: 'permissions',
          through: { attributes: [] }
        });
      }
      if (includeUsers) {
        includes.push({
          model: UserModel,
          as: 'users',
          through: { attributes: [] }
        });
      }

      const roles = await RoleModel.findAll({
        include: includes.length > 0 ? includes : undefined,
        order: [['name', 'ASC']]
      });

      logger.debug(`Found ${roles.length} roles`);
      return roles;
    } catch (error) {
      logger.error('Error finding all roles:', error);
      throw error;
    }
  }

  /**
   * 建立新角色
   * @param roleData 角色資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色實例
   */
  async create(roleData: RoleCreationAttributes, transaction?: Transaction): Promise<RoleModel> {
    try {
      logger.debug(`Creating role: ${roleData.name}`);
      
      const role = await RoleModel.create(roleData, { transaction });
      
      logger.info(`Role created successfully: ${role.name} (ID: ${role.id})`);
      return role;
    } catch (error) {
      logger.error(`Error creating role ${roleData.name}:`, error);
      throw error;
    }
  }

  /**
   * 批量建立角色
   * @param rolesData 角色資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色實例陣列
   */
  async bulkCreate(rolesData: RoleCreationAttributes[], transaction?: Transaction): Promise<RoleModel[]> {
    try {
      logger.debug(`Bulk creating ${rolesData.length} roles`);
      
      const roles = await RoleModel.bulkCreate(rolesData, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${roles.length} roles`);
      return roles;
    } catch (error) {
      logger.error('Error bulk creating roles:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立角色
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [角色實例, 是否為新建立]
   */
  async findOrCreate(
    whereCondition: Partial<RoleAttributes>,
    defaults: RoleCreationAttributes,
    transaction?: Transaction
  ): Promise<[RoleModel, boolean]> {
    try {
      const conditionStr = JSON.stringify(whereCondition);
      logger.debug(`Finding or creating role with condition: ${conditionStr}`);
      
      const [role, created] = await RoleModel.findOrCreate({
        where: whereCondition,
        defaults,
        transaction
      });
      
      if (created) {
        logger.info(`Role created: ${role.name} (ID: ${role.id})`);
      } else {
        logger.debug(`Role already exists: ${role.name} (ID: ${role.id})`);
      }
      
      return [role, created];
    } catch (error) {
      logger.error('Error finding or creating role:', error);
      throw error;
    }
  }

  /**
   * 更新角色
   * @param id 角色 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的角色實例或 null
   */
  async update(
    id: number,
    updateData: Partial<RoleCreationAttributes>,
    transaction?: Transaction
  ): Promise<RoleModel | null> {
    try {
      logger.debug(`Updating role ID ${id} with data:`, updateData);
      
      const [updatedCount] = await RoleModel.update(updateData, {
        where: { id },
        transaction
      });
      
      if (updatedCount === 0) {
        logger.warn(`No role updated for ID: ${id}`);
        return null;
      }
      
      const updatedRole = await this.findById(id);
      logger.info(`Role updated successfully: ${updatedRole?.name} (ID: ${id})`);
      
      return updatedRole;
    } catch (error) {
      logger.error(`Error updating role ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 刪除角色
   * @param id 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async delete(id: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting role ID: ${id}`);
      
      const deletedCount = await RoleModel.destroy({
        where: { id },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Role deleted successfully (ID: ${id})`);
      } else {
        logger.warn(`No role deleted for ID: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting role ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 檢查角色是否存在
   * @param name 角色名稱
   * @returns 是否存在
   */
  async exists(name: string): Promise<boolean> {
    try {
      logger.debug(`Checking if role exists: ${name}`);
      
      const count = await RoleModel.count({
        where: { name }
      });
      
      const exists = count > 0;
      logger.debug(`Role ${name} exists: ${exists}`);
      
      return exists;
    } catch (error) {
      logger.error(`Error checking role existence for ${name}:`, error);
      throw error;
    }
  }

  /**
   * 計算角色總數
   * @returns 角色總數
   */
  async count(): Promise<number> {
    try {
      logger.debug('Counting total roles');
      
      const count = await RoleModel.count();
      
      logger.debug(`Total roles count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting roles:', error);
      throw error;
    }
  }

  /**
   * 根據角色名稱陣列查詢角色
   * @param names 角色名稱陣列
   * @returns 角色列表
   */
  async findByNames(names: string[]): Promise<RoleModel[]> {
    try {
      logger.debug(`Finding roles by names: [${names.join(', ')}]`);
      
      const roles: RoleModel[] = await RoleModel.findAll({
        where: {
          name: names
        },
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${roles.length} roles for ${names.length} names`);
      return roles;
    } catch (error) {
      logger.error('Error finding roles by names:', error);
      throw error;
    }
  }
}