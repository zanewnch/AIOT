/**
 * @fileoverview 角色查詢 Repository - CQRS 查詢端
 * 
 * 專門處理角色資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { 
  RoleModel, 
  RoleAttributes 
} from '../../../models/RoleModel.js';
import { PermissionModel } from '../../../models/PermissionModel.js';
import { UserModel } from '../../../models/UserModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';

const logger = createLogger('RoleQueriesRepository');

/**
 * 角色查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理角色資料的查詢操作，遵循 CQRS 模式
 * 
 * @class RoleQueriesRepository
 */
@injectable()
export class RoleQueriesRepository {
  /**
   * 根據 ID 查詢角色
   * @param id 角色 ID
   * @returns 角色實例或 null
   */
  findById = async (id: number): Promise<RoleModel | null> => {
    try {
      logger.debug(`Finding role by ID: ${id}`);
      const role = await RoleModel.findByPk(id);

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
  findByName = async (
    name: string, 
    includePermissions: boolean = false, 
    includeUsers: boolean = false
  ): Promise<RoleModel | null> => {
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
  findAll = async (
    includePermissions: boolean = false, 
    includeUsers: boolean = false
  ): Promise<RoleModel[]> => {
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
   * 檢查角色是否存在
   * @param name 角色名稱
   * @returns 是否存在
   */
  exists = async (name: string): Promise<boolean> => {
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
  count = async (): Promise<number> => {
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
  findByNames = async (names: string[]): Promise<RoleModel[]> => {
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

  /**
   * 根據權限查詢角色
   * @param permissionName 權限名稱
   * @returns 具有指定權限的角色列表
   */
  findByPermission = async (permissionName: string): Promise<RoleModel[]> => {
    try {
      logger.debug(`Finding roles by permission: ${permissionName}`);
      
      const roles = await RoleModel.findAll({
        include: [
          {
            model: PermissionModel,
            as: 'permissions',
            where: { name: permissionName },
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${roles.length} roles with permission ${permissionName}`);
      return roles;
    } catch (error) {
      logger.error(`Error finding roles by permission ${permissionName}:`, error);
      throw error;
    }
  }

  /**
   * 根據使用者查詢角色
   * @param userId 使用者 ID
   * @returns 指定使用者的角色列表
   */
  findByUserId = async (userId: number): Promise<RoleModel[]> => {
    try {
      logger.debug(`Finding roles by user ID: ${userId}`);
      
      const roles = await RoleModel.findAll({
        include: [
          {
            model: UserModel,
            as: 'users',
            where: { id: userId },
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });
      
      logger.debug(`Found ${roles.length} roles for user ${userId}`);
      return roles;
    } catch (error) {
      logger.error(`Error finding roles by user ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查角色是否有特定權限
   * @param roleId 角色 ID
   * @param permissionName 權限名稱
   * @returns 是否有權限
   */
  hasPermission = async (roleId: number, permissionName: string): Promise<boolean> => {
    try {
      logger.debug(`Checking if role ${roleId} has permission ${permissionName}`);
      
      const role = await RoleModel.findByPk(roleId, {
        include: [
          {
            model: PermissionModel,
            as: 'permissions',
            where: { name: permissionName },
            through: { attributes: [] }
          }
        ]
      });
      
      const hasPermission = role !== null && role.permissions && role.permissions.length > 0;
      logger.debug(`Role ${roleId} has permission ${permissionName}: ${hasPermission}`);
      
      return Boolean(hasPermission);
    } catch (error) {
      logger.error(`Error checking permission ${permissionName} for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 取得角色的所有權限
   * @param roleId 角色 ID
   * @returns 權限列表
   */
  getPermissions = async (roleId: number): Promise<PermissionModel[]> => {
    try {
      logger.debug(`Getting permissions for role ${roleId}`);
      
      const role = await RoleModel.findByPk(roleId, {
        include: [
          {
            model: PermissionModel,
            as: 'permissions',
            through: { attributes: [] }
          }
        ]
      });
      
      const permissions = role?.permissions || [];
      logger.debug(`Found ${permissions.length} permissions for role ${roleId}`);
      
      return permissions;
    } catch (error) {
      logger.error(`Error getting permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 取得角色的所有使用者
   * @param roleId 角色 ID
   * @returns 使用者列表
   */
  getUsers = async (roleId: number): Promise<UserModel[]> => {
    try {
      logger.debug(`Getting users for role ${roleId}`);
      
      const role = await RoleModel.findByPk(roleId, {
        include: [
          {
            model: UserModel,
            as: 'users',
            through: { attributes: [] }
          }
        ]
      });
      
      const users = role?.users || [];
      logger.debug(`Found ${users.length} users for role ${roleId}`);
      
      return users;
    } catch (error) {
      logger.error(`Error getting users for role ${roleId}:`, error);
      throw error;
    }
  }
}