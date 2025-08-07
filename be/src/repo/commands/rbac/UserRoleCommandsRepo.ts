/**
 * @fileoverview 使用者角色關聯命令 Repository - CQRS 命令端
 * 
 * 專門處理使用者角色關聯資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import { UserRoleModel, UserRoleCreationAttributes } from '../../../models/rbac/UserRoleModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';

const logger = createLogger('UserRoleCommandsRepository');

/**
 * 使用者角色關聯命令 Repository 實現類別 - CQRS 命令端
 * 
 * 專門處理使用者角色關聯資料的寫入操作，遵循 CQRS 模式
 * 
 * @class UserRoleCommandsRepository
 */
export class UserRoleCommandsRepository {
  /**
   * 建立使用者角色關聯
   * @param userRoleData 使用者角色關聯資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的使用者角色關聯實例
   */
  async create(userRoleData: UserRoleCreationAttributes, transaction?: Transaction): Promise<UserRoleModel> {
    try {
      logger.debug(`Creating user role: user ${userRoleData.userId} -> role ${userRoleData.roleId}`);
      
      const userRole = await UserRoleModel.create(userRoleData, { transaction });
      
      logger.info(`User role created successfully (ID: ${userRole.id})`);
      return userRole;
    } catch (error) {
      logger.error(`Error creating user role for user ${userRoleData.userId} and role ${userRoleData.roleId}:`, error);
      throw error;
    }
  }

  /**
   * 批量建立使用者角色關聯
   * @param userRolesData 使用者角色關聯資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的使用者角色關聯實例陣列
   */
  async bulkCreate(userRolesData: UserRoleCreationAttributes[], transaction?: Transaction): Promise<UserRoleModel[]> {
    try {
      logger.debug(`Bulk creating ${userRolesData.length} user roles`);
      
      const userRoles = await UserRoleModel.bulkCreate(userRolesData, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${userRoles.length} user roles`);
      return userRoles;
    } catch (error) {
      logger.error('Error bulk creating user roles:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立使用者角色關聯
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [使用者角色關聯實例, 是否為新建立]
   */
  async findOrCreate(
    whereCondition: { userId: number; roleId: number },
    defaults: UserRoleCreationAttributes,
    transaction?: Transaction
  ): Promise<[UserRoleModel, boolean]> {
    try {
      logger.debug(`Finding or creating user role: user ${whereCondition.userId} -> role ${whereCondition.roleId}`);
      
      const [userRole, created] = await UserRoleModel.findOrCreate({
        where: whereCondition,
        defaults,
        transaction
      });
      
      if (created) {
        logger.info(`User role created (ID: ${userRole.id})`);
      } else {
        logger.debug(`User role already exists (ID: ${userRole.id})`);
      }
      
      return [userRole, created];
    } catch (error) {
      logger.error('Error finding or creating user role:', error);
      throw error;
    }
  }

  /**
   * 更新使用者角色關聯
   * @param id 關聯 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的使用者角色關聯實例或 null
   */
  async update(
    id: number,
    updateData: Partial<UserRoleCreationAttributes>,
    transaction?: Transaction
  ): Promise<UserRoleModel | null> {
    try {
      logger.debug(`Updating user role ID ${id} with data:`, updateData);
      
      const [updatedCount] = await UserRoleModel.update(updateData, {
        where: { id },
        transaction
      });
      
      if (updatedCount === 0) {
        logger.warn(`No user role updated for ID: ${id}`);
        return null;
      }
      
      const updatedUserRole = await UserRoleModel.findByPk(id);
      logger.info(`User role updated successfully (ID: ${id})`);
      
      return updatedUserRole;
    } catch (error) {
      logger.error(`Error updating user role ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 刪除使用者角色關聯
   * @param id 關聯 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async delete(id: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting user role ID: ${id}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { id },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`User role deleted successfully (ID: ${id})`);
      } else {
        logger.warn(`No user role deleted for ID: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting user role ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 根據使用者和角色刪除關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async deleteByUserAndRole(userId: number, roleId: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting user role: user ${userId} -> role ${roleId}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { userId, roleId },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`User role deleted successfully: user ${userId} -> role ${roleId}`);
      } else {
        logger.warn(`No user role deleted for user ${userId} and role ${roleId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting user role for user ${userId} and role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除使用者的所有角色
   * @param userId 使用者 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  async deleteByUserId(userId: number, transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Deleting all roles for user ${userId}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { userId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} roles for user ${userId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除角色的所有使用者
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  async deleteByRoleId(roleId: number, transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Deleting all users for role ${roleId}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { roleId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} users for role ${roleId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting users for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 批量刪除使用者角色關聯
   * @param ids 關聯 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  async bulkDelete(ids: number[], transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Bulk deleting ${ids.length} user roles`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: {
          id: ids
        },
        transaction
      });
      
      logger.info(`Successfully bulk deleted ${deletedCount} user roles`);
      return deletedCount;
    } catch (error) {
      logger.error('Error bulk deleting user roles:', error);
      throw error;
    }
  }

  /**
   * 替換使用者的所有角色
   * @param userId 使用者 ID
   * @param newRoleIds 新的角色 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的使用者角色關聯實例陣列
   */
  async replaceUserRoles(userId: number, newRoleIds: number[], transaction?: Transaction): Promise<UserRoleModel[]> {
    try {
      logger.debug(`Replacing roles for user ${userId} with [${newRoleIds.join(', ')}]`);
      
      // 先刪除現有的所有角色
      await this.deleteByUserId(userId, transaction);
      
      // 建立新的角色關聯
      const userRolesData: UserRoleCreationAttributes[] = newRoleIds.map(roleId => ({
        userId,
        roleId
      }));
      
      const newUserRoles = await this.bulkCreate(userRolesData, transaction);
      
      logger.info(`Successfully replaced roles for user ${userId}, created ${newUserRoles.length} new associations`);
      return newUserRoles;
    } catch (error) {
      logger.error(`Error replacing roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 分配多個角色給使用者
   * @param userId 使用者 ID
   * @param roleIds 角色 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的使用者角色關聯實例陣列
   */
  async assignRolesToUser(userId: number, roleIds: number[], transaction?: Transaction): Promise<UserRoleModel[]> {
    try {
      logger.debug(`Assigning roles [${roleIds.join(', ')}] to user ${userId}`);
      
      const userRolesData: UserRoleCreationAttributes[] = roleIds.map(roleId => ({
        userId,
        roleId
      }));
      
      const userRoles = await this.bulkCreate(userRolesData, transaction);
      
      logger.info(`Successfully assigned ${userRoles.length} roles to user ${userId}`);
      return userRoles;
    } catch (error) {
      logger.error(`Error assigning roles to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 分配使用者給角色
   * @param roleId 角色 ID
   * @param userIds 使用者 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的使用者角色關聯實例陣列
   */
  async assignUsersToRole(roleId: number, userIds: number[], transaction?: Transaction): Promise<UserRoleModel[]> {
    try {
      logger.debug(`Assigning users [${userIds.join(', ')}] to role ${roleId}`);
      
      const userRolesData: UserRoleCreationAttributes[] = userIds.map(userId => ({
        userId,
        roleId
      }));
      
      const userRoles = await this.bulkCreate(userRolesData, transaction);
      
      logger.info(`Successfully assigned ${userRoles.length} users to role ${roleId}`);
      return userRoles;
    } catch (error) {
      logger.error(`Error assigning users to role ${roleId}:`, error);
      throw error;
    }
  }
}