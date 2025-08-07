/**
 * @fileoverview 角色權限關聯查詢 Repository - CQRS 查詢端
 * 
 * 專門處理角色權限關聯資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { RolePermissionModel } from '../../../models/rbac/RolePermissionModel.js';
import { RoleModel } from '../../../models/rbac/RoleModel.js';
import { PermissionModel } from '../../../models/rbac/PermissionModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';

const logger = createLogger('RolePermissionQueriesRepository');

/**
 * 角色權限關聯查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理角色權限關聯資料的查詢操作，遵循 CQRS 模式
 * 
 * @class RolePermissionQueriesRepository
 */
export class RolePermissionQueriesRepository {
  /**
   * 根據 ID 查詢角色權限關聯
   * @param id 關聯 ID
   * @returns 角色權限關聯實例或 null
   */
  async findById(id: number): Promise<RolePermissionModel | null> {
    try {
      logger.debug(`Finding role permission by ID: ${id}`);
      
      const rolePermission = await RolePermissionModel.findByPk(id, {
        include: [
          { model: RoleModel, as: 'role' },
          { model: PermissionModel, as: 'permission' }
        ]
      });

      if (!rolePermission) {
        logger.debug(`Role permission not found with ID: ${id}`);
        return null;
      }

      logger.debug(`Role permission found (ID: ${rolePermission.id})`);
      return rolePermission;
    } catch (error) {
      logger.error(`Error finding role permission by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 查詢所有角色權限關聯
   * @returns 角色權限關聯列表
   */
  async findAll(): Promise<RolePermissionModel[]> {
    try {
      logger.debug('Finding all role permissions');
      
      const rolePermissions = await RolePermissionModel.findAll({
        include: [
          { model: RoleModel, as: 'role' },
          { model: PermissionModel, as: 'permission' }
        ],
        order: [['createdAt', 'DESC']]
      });

      logger.debug(`Found ${rolePermissions.length} role permissions`);
      return rolePermissions;
    } catch (error) {
      logger.error('Error finding all role permissions:', error);
      throw error;
    }
  }

  /**
   * 根據角色 ID 查詢權限關聯
   * @param roleId 角色 ID
   * @returns 角色的權限關聯列表
   */
  async findByRoleId(roleId: number): Promise<RolePermissionModel[]> {
    try {
      logger.debug(`Finding role permissions by role ID: ${roleId}`);
      
      const rolePermissions = await RolePermissionModel.findAll({
        where: { roleId },
        include: [
          { model: RoleModel, as: 'role' },
          { model: PermissionModel, as: 'permission' }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${rolePermissions.length} permissions for role ${roleId}`);
      return rolePermissions;
    } catch (error) {
      logger.error(`Error finding role permissions by role ID ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 根據權限 ID 查詢角色關聯
   * @param permissionId 權限 ID
   * @returns 權限的角色關聯列表
   */
  async findByPermissionId(permissionId: number): Promise<RolePermissionModel[]> {
    try {
      logger.debug(`Finding role permissions by permission ID: ${permissionId}`);
      
      const rolePermissions = await RolePermissionModel.findAll({
        where: { permissionId },
        include: [
          { model: RoleModel, as: 'role' },
          { model: PermissionModel, as: 'permission' }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${rolePermissions.length} roles for permission ${permissionId}`);
      return rolePermissions;
    } catch (error) {
      logger.error(`Error finding role permissions by permission ID ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色和權限 ID 查詢關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @returns 角色權限關聯實例或 null
   */
  async findByRoleAndPermission(roleId: number, permissionId: number): Promise<RolePermissionModel | null> {
    try {
      logger.debug(`Finding role permission by role ID ${roleId} and permission ID ${permissionId}`);
      
      const rolePermission = await RolePermissionModel.findOne({
        where: { roleId, permissionId },
        include: [
          { model: RoleModel, as: 'role' },
          { model: PermissionModel, as: 'permission' }
        ]
      });

      if (!rolePermission) {
        logger.debug(`Role permission not found for role ${roleId} and permission ${permissionId}`);
        return null;
      }

      logger.debug(`Role permission found (ID: ${rolePermission.id})`);
      return rolePermission;
    } catch (error) {
      logger.error(`Error finding role permission by role ${roleId} and permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查角色是否有特定權限
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @returns 是否有權限
   */
  async hasPermission(roleId: number, permissionId: number): Promise<boolean> {
    try {
      logger.debug(`Checking if role ${roleId} has permission ${permissionId}`);
      
      const count = await RolePermissionModel.count({
        where: { roleId, permissionId }
      });
      
      const hasPermission = count > 0;
      logger.debug(`Role ${roleId} has permission ${permissionId}: ${hasPermission}`);
      
      return hasPermission;
    } catch (error) {
      logger.error(`Error checking permission ${permissionId} for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色名稱查詢權限關聯
   * @param roleName 角色名稱
   * @returns 角色的權限關聯列表
   */
  async findByRoleName(roleName: string): Promise<RolePermissionModel[]> {
    try {
      logger.debug(`Finding role permissions by role name: ${roleName}`);
      
      const rolePermissions = await RolePermissionModel.findAll({
        include: [
          { 
            model: RoleModel, 
            as: 'role',
            where: { name: roleName }
          },
          { model: PermissionModel, as: 'permission' }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${rolePermissions.length} permissions for role ${roleName}`);
      return rolePermissions;
    } catch (error) {
      logger.error(`Error finding role permissions by role name ${roleName}:`, error);
      throw error;
    }
  }

  /**
   * 根據權限名稱查詢角色關聯
   * @param permissionName 權限名稱
   * @returns 權限的角色關聯列表
   */
  async findByPermissionName(permissionName: string): Promise<RolePermissionModel[]> {
    try {
      logger.debug(`Finding role permissions by permission name: ${permissionName}`);
      
      const rolePermissions = await RolePermissionModel.findAll({
        include: [
          { model: RoleModel, as: 'role' },
          { 
            model: PermissionModel, 
            as: 'permission',
            where: { name: permissionName }
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${rolePermissions.length} roles for permission ${permissionName}`);
      return rolePermissions;
    } catch (error) {
      logger.error(`Error finding role permissions by permission name ${permissionName}:`, error);
      throw error;
    }
  }

  /**
   * 統計角色總的權限數
   * @param roleId 角色 ID
   * @returns 角色的權限數量
   */
  async countByRoleId(roleId: number): Promise<number> {
    try {
      logger.debug(`Counting permissions for role ${roleId}`);
      
      const count = await RolePermissionModel.count({
        where: { roleId }
      });
      
      logger.debug(`Role ${roleId} has ${count} permissions`);
      return count;
    } catch (error) {
      logger.error(`Error counting permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 統計權限總的角色數
   * @param permissionId 權限 ID
   * @returns 權限的角色數量
   */
  async countByPermissionId(permissionId: number): Promise<number> {
    try {
      logger.debug(`Counting roles for permission ${permissionId}`);
      
      const count = await RolePermissionModel.count({
        where: { permissionId }
      });
      
      logger.debug(`Permission ${permissionId} has ${count} roles`);
      return count;
    } catch (error) {
      logger.error(`Error counting roles for permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 統計所有角色權限關聯數
   * @returns 總關聯數
   */
  async count(): Promise<number> {
    try {
      logger.debug('Counting total role permissions');
      
      const count = await RolePermissionModel.count();
      
      logger.debug(`Total role permissions count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting role permissions:', error);
      throw error;
    }
  }

  /**
   * 檢查角色是否有權限（根據名稱）
   * @param roleName 角色名稱
   * @param permissionName 權限名稱
   * @returns 是否有權限
   */
  async hasPermissionByName(roleName: string, permissionName: string): Promise<boolean> {
    try {
      logger.debug(`Checking if role ${roleName} has permission ${permissionName}`);
      
      const count = await RolePermissionModel.count({
        include: [
          { 
            model: RoleModel, 
            as: 'role',
            where: { name: roleName }
          },
          { 
            model: PermissionModel, 
            as: 'permission',
            where: { name: permissionName }
          }
        ]
      });
      
      const hasPermission = count > 0;
      logger.debug(`Role ${roleName} has permission ${permissionName}: ${hasPermission}`);
      
      return hasPermission;
    } catch (error) {
      logger.error(`Error checking permission ${permissionName} for role ${roleName}:`, error);
      throw error;
    }
  }

  /**
   * 取得角色的所有權限名稱
   * @param roleId 角色 ID
   * @returns 權限名稱陣列
   */
  async getPermissionNames(roleId: number): Promise<string[]> {
    try {
      logger.debug(`Getting permission names for role ${roleId}`);
      
      const rolePermissions = await RolePermissionModel.findAll({
        where: { roleId },
        include: [
          { model: PermissionModel, as: 'permission' }
        ]
      });
      
      const permissionNames = rolePermissions
        .map(rp => rp.permission?.name)
        .filter(name => name !== undefined) as string[];
      
      logger.debug(`Found ${permissionNames.length} permission names for role ${roleId}`);
      return permissionNames;
    } catch (error) {
      logger.error(`Error getting permission names for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 取得權限的所有角色名稱
   * @param permissionId 權限 ID
   * @returns 角色名稱陣列
   */
  async getRoleNames(permissionId: number): Promise<string[]> {
    try {
      logger.debug(`Getting role names for permission ${permissionId}`);
      
      const rolePermissions = await RolePermissionModel.findAll({
        where: { permissionId },
        include: [
          { model: RoleModel, as: 'role' }
        ]
      });
      
      const roleNames = rolePermissions
        .map(rp => rp.role?.name)
        .filter(name => name !== undefined) as string[];
      
      logger.debug(`Found ${roleNames.length} role names for permission ${permissionId}`);
      return roleNames;
    } catch (error) {
      logger.error(`Error getting role names for permission ${permissionId}:`, error);
      throw error;
    }
  }
}