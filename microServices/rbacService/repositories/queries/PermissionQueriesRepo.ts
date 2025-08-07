/**
 * @fileoverview 權限查詢 Repository - CQRS 查詢端
 * 
 * 專門處理權限資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { 
  PermissionModel, 
  PermissionAttributes 
} from '../../../models/rbac/PermissionModel.js';
import { RoleModel } from '../../../models/rbac/RoleModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';
import { Op } from 'sequelize';

const logger = createLogger('PermissionQueriesRepository');

/**
 * 權限查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理權限資料的查詢操作，遵循 CQRS 模式
 * 
 * @class PermissionQueriesRepository
 */
@injectable()
export class PermissionQueriesRepository {
  /**
   * 根據 ID 查詢權限
   * @param id 權限 ID
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限實例或 null
   */
  async findById(id: number, includeRoles: boolean = false): Promise<PermissionModel | null> {
    try {
      logger.debug(`Finding permission by ID: ${id}, includeRoles: ${includeRoles}`);
      
      const include = includeRoles ? [{
        model: RoleModel,
        as: 'roles',
        through: { attributes: [] }
      }] : undefined;

      const permission = await PermissionModel.findByPk(id, { include });

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
      
      const include = includeRoles ? [{
        model: RoleModel,
        as: 'roles',
        through: { attributes: [] }
      }] : undefined;

      const permission = await PermissionModel.findOne({
        where: { name },
        include
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
      
      const include = includeRoles ? [{
        model: RoleModel,
        as: 'roles',
        through: { attributes: [] }
      }] : undefined;

      const permissions = await PermissionModel.findAll({
        include,
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

  /**
   * 根據角色查詢權限
   * @param roleId 角色 ID
   * @returns 指定角色的權限列表
   */
  async findByRoleId(roleId: number): Promise<PermissionModel[]> {
    try {
      logger.debug(`Finding permissions by role ID: ${roleId}`);
      
      const permissions = await PermissionModel.findAll({
        include: [
          {
            model: RoleModel,
            as: 'roles',
            where: { id: roleId },
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${permissions.length} permissions for role ${roleId}`);
      return permissions;
    } catch (error) {
      logger.error(`Error finding permissions by role ID ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色名稱查詢權限
   * @param roleName 角色名稱
   * @returns 指定角色的權限列表
   */
  async findByRoleName(roleName: string): Promise<PermissionModel[]> {
    try {
      logger.debug(`Finding permissions by role name: ${roleName}`);
      
      const permissions = await PermissionModel.findAll({
        include: [
          {
            model: RoleModel,
            as: 'roles',
            where: { name: roleName },
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${permissions.length} permissions for role ${roleName}`);
      return permissions;
    } catch (error) {
      logger.error(`Error finding permissions by role name ${roleName}:`, error);
      throw error;
    }
  }

  /**
   * 根據類型查詢權限
   * @param type 權限類型
   * @returns 指定類型的權限列表
   */
  async findByType(type: string): Promise<PermissionModel[]> {
    try {
      logger.debug(`Finding permissions by type: ${type}`);
      
      const permissions = await PermissionModel.findAll({
        where: { 
          name: { 
            [Op.like]: `${type}%` 
          } 
        },
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${permissions.length} permissions of type ${type}`);
      return permissions;
    } catch (error) {
      logger.error(`Error finding permissions by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * 搜尋權限（按名稱或描述）
   * @param searchTerm 搜尋關鍵字
   * @returns 匹配的權限列表
   */
  async search(searchTerm: string): Promise<PermissionModel[]> {
    try {
      logger.debug(`Searching permissions with term: ${searchTerm}`);
      
      const permissions = await PermissionModel.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${searchTerm}%` } },
            { description: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${permissions.length} permissions matching "${searchTerm}"`);
      return permissions;
    } catch (error) {
      logger.error(`Error searching permissions with term "${searchTerm}":`, error);
      throw error;
    }
  }
}