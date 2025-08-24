/**
 * @fileoverview 角色權限關聯命令 Repo - CQRS 命令端
 * 
 * 專門處理角色權限關聯資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { RolePermissionModel, RolePermissionCreationAttributes, RolePermissionAttributes } from '../../models/RoleToPermissionModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';
import { Op } from 'sequelize';

const logger = createLogger('RolePermissionCommandsRepo');

/**
 * 角色權限關聯命令 Repo 實現類別 - CQRS 命令端
 * 
 * 專門處理角色權限關聯資料的寫入操作，遵循 CQRS 模式
 * 
 * @class RolePermissionCommandsRepo
 */
@injectable()
export class RolePermissionCommandsRepo {
  /**
   * 建立角色權限關聯
   * @param rolePermissionData 角色權限關聯資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色權限關聯實例
   */
  create = async (rolePermissionData: RolePermissionCreationAttributes, transaction?: Transaction): Promise<RolePermissionModel> => {
    try {
      logger.debug(`Creating role permission: role ${rolePermissionData.roleId} -> permission ${rolePermissionData.permissionId}`);
      
      const rolePermission = await RolePermissionModel.create(rolePermissionData, { transaction });
      
      logger.info(`Role permission created successfully (ID: ${rolePermission.id})`);
      return rolePermission;
    } catch (error) {
      logger.error(`Error creating role permission for role ${rolePermissionData.roleId} and permission ${rolePermissionData.permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 批量建立角色權限關聯
   * @param rolePermissionsData 角色權限關聯資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色權限關聯實例陣列
   */
  bulkCreate = async (rolePermissionsData: RolePermissionCreationAttributes[], transaction?: Transaction): Promise<RolePermissionModel[]> => {
    try {
      logger.debug(`Bulk creating ${rolePermissionsData.length} role permissions`);
      
      const rolePermissions = await RolePermissionModel.bulkCreate(rolePermissionsData, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${rolePermissions.length} role permissions`);
      return rolePermissions;
    } catch (error) {
      logger.error('Error bulk creating role permissions:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立角色權限關聯
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [角色權限關聯實例, 是否為新建立]
   */
  async findOrCreate(
    whereCondition: { roleId: number; permissionId: number },
    defaults: RolePermissionCreationAttributes,
    transaction?: Transaction
  ): Promise<[RolePermissionModel, boolean]> {
    try {
      logger.debug(`Finding or creating role permission: role ${whereCondition.roleId} -> permission ${whereCondition.permissionId}`);
      
      const [rolePermission, created] = await RolePermissionModel.findOrCreate({
        where: whereCondition,
        defaults,
        transaction
      });
      
      if (created) {
        logger.info(`Role permission created (ID: ${rolePermission.id})`);
      } else {
        logger.debug(`Role permission already exists (ID: ${rolePermission.id})`);
      }
      
      return [rolePermission, created];
    } catch (error) {
      logger.error('Error finding or creating role permission:', error);
      throw error;
    }
  }

  /**
   * 更新角色權限關聯 (根據 roleId 和 permissionId)
   * @param roleId 角色 ID
   * @param permissionId 權限 ID  
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的角色權限關聯實例或 null
   */
  async update(
    roleId: number,
    permissionId: number,
    updateData: Partial<RolePermissionCreationAttributes>,
    transaction?: Transaction
  ): Promise<RolePermissionModel | null> {
    try {
      logger.debug(`Updating role permission: role ${roleId} -> permission ${permissionId}`);
      
      const [updatedCount] = await RolePermissionModel.update(updateData, {
        where: { roleId, permissionId },
        transaction
      });
      
      if (updatedCount === 0) {
        logger.warn(`No role permission updated for role ${roleId} and permission ${permissionId}`);
        return null;
      }
      
      const updatedRolePermission = await RolePermissionModel.findOne({
        where: { roleId, permissionId }
      });
      logger.info(`Role permission updated successfully: role ${roleId} -> permission ${permissionId}`);
      
      return updatedRolePermission;
    } catch (error) {
      logger.error(`Error updating role permission for role ${roleId} and permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除角色權限關聯 (根據 roleId 和 permissionId)
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete = async (roleId: number, permissionId: number, transaction?: Transaction): Promise<boolean> => {
    try {
      logger.debug(`Deleting role permission: role ${roleId} -> permission ${permissionId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { roleId, permissionId },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Role permission deleted successfully: role ${roleId} -> permission ${permissionId}`);
      } else {
        logger.warn(`No role permission deleted for role ${roleId} and permission ${permissionId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting role permission for role ${roleId} and permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色和權限刪除關聯
   * @param roleId 角色 ID
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  deleteByRoleAndPermission = async (roleId: number, permissionId: number, transaction?: Transaction): Promise<boolean> => {
    try {
      logger.debug(`Deleting role permission: role ${roleId} -> permission ${permissionId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { roleId, permissionId },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Role permission deleted successfully: role ${roleId} -> permission ${permissionId}`);
      } else {
        logger.warn(`No role permission deleted for role ${roleId} and permission ${permissionId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting role permission for role ${roleId} and permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除角色的所有權限
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  deleteByRoleId = async (roleId: number, transaction?: Transaction): Promise<number> => {
    try {
      logger.debug(`Deleting all permissions for role ${roleId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { roleId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} permissions for role ${roleId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除權限的所有角色
   * @param permissionId 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  deleteByPermissionId = async (permissionId: number, transaction?: Transaction): Promise<number> => {
    try {
      logger.debug(`Deleting all roles for permission ${permissionId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: { permissionId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} roles for permission ${permissionId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting roles for permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 批量刪除角色權限關聯
   * @param rolePermissionPairs 角色權限對陣列 { roleId, permissionId }
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  bulkDelete = async (rolePermissionPairs: Array<{roleId: number, permissionId: number}>, transaction?: Transaction): Promise<number> => {
    try {
      logger.debug(`Bulk deleting ${rolePermissionPairs.length} role permissions`);
      
      if (rolePermissionPairs.length === 0) {
        return 0;
      }

      // 構建 OR 條件陣列
      const whereConditions = rolePermissionPairs.map(pair => ({
        roleId: pair.roleId,
        permissionId: pair.permissionId
      }));
      
      const deletedCount = await RolePermissionModel.destroy({
        where: {
          [Op.or]: whereConditions
        },
        transaction
      });
      
      logger.info(`Successfully bulk deleted ${deletedCount} role permissions`);
      return deletedCount;
    } catch (error) {
      logger.error('Error bulk deleting role permissions:', error);
      throw error;
    }
  }

  /**
   * 替換角色的所有權限
   * @param roleId 角色 ID
   * @param newPermissionIds 新的權限 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色權限關聯實例陣列
   */
  replaceRolePermissions = async (roleId: number, newPermissionIds: number[], transaction?: Transaction): Promise<RolePermissionModel[]> => {
    try {
      logger.debug(`Replacing permissions for role ${roleId} with [${newPermissionIds.join(', ')}]`);
      
      // 先刪除現有的所有權限
      await this.deleteByRoleId(roleId, transaction);
      
      // 建立新的權限關聯
      const rolePermissionsData: RolePermissionCreationAttributes[] = newPermissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      
      const newRolePermissions = await this.bulkCreate(rolePermissionsData, transaction);
      
      logger.info(`Successfully replaced permissions for role ${roleId}, created ${newRolePermissions.length} new associations`);
      return newRolePermissions;
    } catch (error) {
      logger.error(`Error replacing permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 分配多個權限給角色
   * @param roleId 角色 ID
   * @param permissionIds 權限 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色權限關聯實例陣列
   */
  assignPermissionsToRole = async (roleId: number, permissionIds: number[], transaction?: Transaction): Promise<RolePermissionModel[]> => {
    try {
      logger.debug(`Assigning permissions [${permissionIds.join(', ')}] to role ${roleId}`);
      
      const rolePermissionsData: RolePermissionCreationAttributes[] = permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      
      const rolePermissions = await this.bulkCreate(rolePermissionsData, transaction);
      
      logger.info(`Successfully assigned ${rolePermissions.length} permissions to role ${roleId}`);
      return rolePermissions;
    } catch (error) {
      logger.error(`Error assigning permissions to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 分配角色給權限
   * @param permissionId 權限 ID
   * @param roleIds 角色 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色權限關聯實例陣列
   */
  assignRolesToPermission = async (permissionId: number, roleIds: number[], transaction?: Transaction): Promise<RolePermissionModel[]> => {
    try {
      logger.debug(`Assigning roles [${roleIds.join(', ')}] to permission ${permissionId}`);
      
      const rolePermissionsData: RolePermissionCreationAttributes[] = roleIds.map(roleId => ({
        roleId,
        permissionId
      }));
      
      const rolePermissions = await this.bulkCreate(rolePermissionsData, transaction);
      
      logger.info(`Successfully assigned ${rolePermissions.length} roles to permission ${permissionId}`);
      return rolePermissions;
    } catch (error) {
      logger.error(`Error assigning roles to permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * 撤銷角色的多個權限
   * @param roleId 角色 ID
   * @param permissionIds 權限 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 撤銷的記錄數
   */
  revokePermissionsFromRole = async (roleId: number, permissionIds: number[], transaction?: Transaction): Promise<number> => {
    try {
      logger.debug(`Revoking permissions [${permissionIds.join(', ')}] from role ${roleId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: {
          roleId,
          permissionId: permissionIds
        },
        transaction
      });
      
      logger.info(`Successfully revoked ${deletedCount} permissions from role ${roleId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error revoking permissions from role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 撤銷權限的多個角色
   * @param permissionId 權限 ID
   * @param roleIds 角色 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 撤銷的記錄數
   */
  revokeRolesFromPermission = async (permissionId: number, roleIds: number[], transaction?: Transaction): Promise<number> => {
    try {
      logger.debug(`Revoking roles [${roleIds.join(', ')}] from permission ${permissionId}`);
      
      const deletedCount = await RolePermissionModel.destroy({
        where: {
          roleId: roleIds,
          permissionId
        },
        transaction
      });
      
      logger.info(`Successfully revoked ${deletedCount} roles from permission ${permissionId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error revoking roles from permission ${permissionId}:`, error);
      throw error;
    }
  }
}