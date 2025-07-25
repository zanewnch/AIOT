/**
 * @fileoverview 角色權限關聯資料存取層
 * 
 * 提供角色權限關聯相關的資料庫操作封裝，實現角色與權限多對多關係的管理。
 * 此資料存取層封裝了所有與角色權限關聯表相關的資料庫查詢和操作，
 * 為上層服務提供簡潔的資料存取介面。
 * 
 * 主要功能：
 * - 角色權限關聯的建立和刪除
 * - 角色權限查詢和驗證
 * - 批量角色權限操作
 * - 角色權限關聯存在性檢查
 * - 角色或權限的所有關聯查詢
 * 
 * 資料庫表結構：
 * - role_permissions: 角色權限關聯表（複合主鍵：roleId + permissionId）
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

import { 
  RolePermissionModel, 
  RolePermissionAttributes, 
  RolePermissionCreationAttributes 
} from '../models/rbac/RoleToPermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { createLogger } from '../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';

const logger = createLogger('RolePermissionRepository');

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

/**
 * 角色權限關聯資料存取層實作類別
 * 實作 IRolePermissionRepository 介面，提供完整的角色權限關聯資料操作功能
 */
export class RolePermissionRepository implements IRolePermissionRepository {
  /**
   * 建立角色權限關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例
   */
  async create(roleId: number, permissionId: number, transaction?: Transaction): Promise<RolePermissionModel> {
    try {
      logger.debug(`Creating role-permission association: roleId=${roleId}, permissionId=${permissionId}`);
      
      const association = await RolePermissionModel.create({
        roleId,
        permissionId
      }, { transaction });
      
      logger.info(`Role-permission association created: roleId=${roleId}, permissionId=${permissionId}`);
      return association;
    } catch (error) {
      logger.error(`Error creating role-permission association (roleId=${roleId}, permissionId=${permissionId}):`, error);
      throw error;
    }
  }

  /**
   * 批量建立角色權限關聯
   * @param associations 關聯資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例陣列
   */
  async bulkCreate(associations: RolePermissionCreationAttributes[], transaction?: Transaction): Promise<RolePermissionModel[]> {
    try {
      logger.debug(`Bulk creating ${associations.length} role-permission associations`);
      
      const createdAssociations = await RolePermissionModel.bulkCreate(associations, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${createdAssociations.length} role-permission associations`);
      return createdAssociations;
    } catch (error) {
      logger.error('Error bulk creating role-permission associations:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立角色權限關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns [關聯實例, 是否為新建立]
   */
  async findOrCreate(roleId: number, permissionId: number, transaction?: Transaction): Promise<[RolePermissionModel, boolean]> {
    try {
      logger.debug(`Finding or creating role-permission association: roleId=${roleId}, permissionId=${permissionId}`);
      
      const [association, created] = await RolePermissionModel.findOrCreate({
        where: { roleId, permissionId },
        defaults: { roleId, permissionId },
        transaction
      });
      
      if (created) {
        logger.info(`Role-permission association created: roleId=${roleId}, permissionId=${permissionId}`);
      } else {
        logger.debug(`Role-permission association already exists: roleId=${roleId}, permissionId=${permissionId}`);
      }
      
      return [association, created];
    } catch (error) {
      logger.error(`Error finding or creating role-permission association (roleId=${roleId}, permissionId=${permissionId}):`, error);
      throw error;
    }
  }

  /**
   * 刪除角色權限關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async delete(roleId: number, permissionId: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting role-permission association: roleId=${roleId}, permissionId=${permissionId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { roleId, permissionId },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Role-permission association deleted: roleId=${roleId}, permissionId=${permissionId}`);
      } else {
        logger.warn(`No role-permission association found to delete: roleId=${roleId}, permissionId=${permissionId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting role-permission association (roleId=${roleId}, permissionId=${permissionId}):`, error);
      throw error;
    }
  }

  /**
   * 刪除角色的所有權限關聯
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  async deleteByRoleId(roleId: number, transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Deleting all permissions for role: ${roleId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { roleId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} role-permission associations for role: ${roleId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting role-permission associations for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除權限的所有角色關聯
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  async deleteByPermissionId(permissionId: number, transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Deleting all roles for permission: ${permissionId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { permissionId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} role-permission associations for permission: ${permissionId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting role-permission associations for permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查角色權限關聯是否存在
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @returns 是否存在
   */
  async exists(roleId: number, permissionId: number): Promise<boolean> {
    try {
      logger.debug(`Checking if role-permission association exists: roleId=${roleId}, permissionId=${permissionId}`);
      
      const count = await RolePermissionModel.count({
        where: { roleId, permissionId }
      });
      
      const exists = count > 0;
      logger.debug(`Role-permission association exists: ${exists}`);
      
      return exists;
    } catch (error) {
      logger.error(`Error checking role-permission association existence (roleId=${roleId}, permissionId=${permissionId}):`, error);
      throw error;
    }
  }

  /**
   * 查詢角色的所有權限
   * @param roleId 角色 ID
   * @param includePermissionDetails 是否包含權限詳細資訊
   * @returns 權限列表
   */
  async findPermissionsByRoleId(roleId: number, includePermissionDetails: boolean = true): Promise<PermissionModel[]> {
    try {
      logger.debug(`Finding permissions for role: ${roleId}, includeDetails: ${includePermissionDetails}`);
      
      if (includePermissionDetails) {
        const associations = await RolePermissionModel.findAll({
          where: { roleId },
          include: [
            {
              model: PermissionModel,
              as: 'permission'
            }
          ]
        });
        
        const permissions = associations.map(assoc => (assoc as any).permission).filter(Boolean);
        logger.debug(`Found ${permissions.length} permissions for role: ${roleId}`);
        return permissions;
      } else {
        const associations = await RolePermissionModel.findAll({
          where: { roleId },
          attributes: ['permissionId']
        });
        
        const permissionIds = associations.map(assoc => assoc.permissionId);
        const permissions = await PermissionModel.findAll({
          where: { id: permissionIds }
        });
        
        logger.debug(`Found ${permissions.length} permissions for role: ${roleId}`);
        return permissions;
      }
    } catch (error) {
      logger.error(`Error finding permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 查詢權限的所有角色
   * @param permissionId 權限 ID
   * @param includeRoleDetails 是否包含角色詳細資訊
   * @returns 角色列表
   */
  async findRolesByPermissionId(permissionId: number, includeRoleDetails: boolean = true): Promise<RoleModel[]> {
    try {
      logger.debug(`Finding roles for permission: ${permissionId}, includeDetails: ${includeRoleDetails}`);
      
      if (includeRoleDetails) {
        const associations = await RolePermissionModel.findAll({
          where: { permissionId },
          include: [
            {
              model: RoleModel,
              as: 'role'
            }
          ]
        });
        
        const roles = associations.map(assoc => (assoc as any).role).filter(Boolean);
        logger.debug(`Found ${roles.length} roles for permission: ${permissionId}`);
        return roles;
      } else {
        const associations = await RolePermissionModel.findAll({
          where: { permissionId },
          attributes: ['roleId']
        });
        
        const roleIds = associations.map(assoc => assoc.roleId);
        const roles = await RoleModel.findAll({
          where: { id: roleIds }
        });
        
        logger.debug(`Found ${roles.length} roles for permission: ${permissionId}`);
        return roles;
      }
    } catch (error) {
      logger.error(`Error finding roles for permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 查詢所有角色權限關聯
   * @param includeDetails 是否包含角色和權限詳細資訊
   * @returns 關聯列表
   */
  async findAll(includeDetails: boolean = false): Promise<RolePermissionModel[]> {
    try {
      logger.debug(`Finding all role-permission associations, includeDetails: ${includeDetails}`);
      
      const associations = await RolePermissionModel.findAll({
        include: includeDetails ? [
          {
            model: RoleModel,
            as: 'role'
          },
          {
            model: PermissionModel,
            as: 'permission'
          }
        ] : undefined,
        order: [['roleId', 'ASC'], ['permissionId', 'ASC']]
      });
      
      logger.debug(`Found ${associations.length} role-permission associations`);
      return associations;
    } catch (error) {
      logger.error('Error finding all role-permission associations:', error);
      throw error;
    }
  }

  /**
   * 計算關聯總數
   * @returns 關聯總數
   */
  async count(): Promise<number> {
    try {
      logger.debug('Counting total role-permission associations');
      
      const count = await RolePermissionModel.count();
      
      logger.debug(`Total role-permission associations count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting role-permission associations:', error);
      throw error;
    }
  }

  /**
   * 計算特定角色的權限數量
   * @param roleId 角色 ID
   * @returns 權限數量
   */
  async countPermissionsByRoleId(roleId: number): Promise<number> {
    try {
      logger.debug(`Counting permissions for role: ${roleId}`);
      
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
   * 計算特定權限的角色數量
   * @param permissionId 權限 ID
   * @returns 角色數量
   */
  async countRolesByPermissionId(permissionId: number): Promise<number> {
    try {
      logger.debug(`Counting roles for permission: ${permissionId}`);
      
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
   * 查詢特定角色和權限的關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @returns 角色權限關聯實例或 null
   */
  async findByRoleAndPermission(roleId: number, permissionId: number): Promise<RolePermissionModel | null> {
    try {
      logger.debug(`Finding role-permission association: roleId=${roleId}, permissionId=${permissionId}`);
      
      const association = await RolePermissionModel.findOne({
        where: { roleId, permissionId }
      });
      
      if (association) {
        logger.debug(`Found role-permission association: roleId=${roleId}, permissionId=${permissionId}`);
      } else {
        logger.debug(`No role-permission association found: roleId=${roleId}, permissionId=${permissionId}`);
      }
      
      return association;
    } catch (error) {
      logger.error(`Error finding role-permission association (roleId=${roleId}, permissionId=${permissionId}):`, error);
      throw error;
    }
  }
}