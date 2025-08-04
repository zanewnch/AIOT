/**
 * @fileoverview 使用者角色關聯資料存取層
 * 
 * 提供使用者角色關聯相關的資料庫操作封裝，實現使用者與角色多對多關係的管理。
 * 此資料存取層封裝了所有與使用者角色關聯表相關的資料庫查詢和操作，
 * 為上層服務提供簡潔的資料存取介面。
 * 
 * 主要功能：
 * - 使用者角色關聯的建立和刪除
 * - 使用者角色查詢和驗證
 * - 批量使用者角色操作
 * - 使用者角色關聯存在性檢查
 * - 使用者或角色的所有關聯查詢
 * 
 * 資料庫表結構：
 * - user_roles: 使用者角色關聯表（複合主鍵：userId + roleId）
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

import { 
  UserRoleModel, 
  UserRoleAttributes, 
  UserRoleCreationAttributes 
} from '../models/rbac/UserToRoleModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { createLogger } from '../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';
import type { IUserRoleRepository } from '../types/repositories/IUserRoleRepository.js';

const logger = createLogger('UserRoleRepository');

/**
 * 使用者角色關聯資料存取層實作類別
 * 實作 IUserRoleRepository 介面，提供完整的使用者角色關聯資料操作功能
 */
export class UserRoleRepository implements IUserRoleRepository {
  /**
   * 建立使用者角色關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例
   */
  async create(userId: number, roleId: number, transaction?: Transaction): Promise<UserRoleModel> {
    try {
      logger.debug(`Creating user-role association: userId=${userId}, roleId=${roleId}`);
      
      const association = await UserRoleModel.create({
        userId,
        roleId
      }, { transaction });
      
      logger.info(`User-role association created: userId=${userId}, roleId=${roleId}`);
      return association;
    } catch (error) {
      logger.error(`Error creating user-role association (userId=${userId}, roleId=${roleId}):`, error);
      throw error;
    }
  }

  /**
   * 批量建立使用者角色關聯
   * @param associations 關聯資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的關聯實例陣列
   */
  async bulkCreate(associations: UserRoleCreationAttributes[], transaction?: Transaction): Promise<UserRoleModel[]> {
    try {
      logger.debug(`Bulk creating ${associations.length} user-role associations`);
      
      const createdAssociations = await UserRoleModel.bulkCreate(associations, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${createdAssociations.length} user-role associations`);
      return createdAssociations;
    } catch (error) {
      logger.error('Error bulk creating user-role associations:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立使用者角色關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns [關聯實例, 是否為新建立]
   */
  async findOrCreate(userId: number, roleId: number, transaction?: Transaction): Promise<[UserRoleModel, boolean]> {
    try {
      logger.debug(`Finding or creating user-role association: userId=${userId}, roleId=${roleId}`);
      
      const [association, created] = await UserRoleModel.findOrCreate({
        where: { userId, roleId },
        defaults: { userId, roleId },
        transaction
      });
      
      if (created) {
        logger.info(`User-role association created: userId=${userId}, roleId=${roleId}`);
      } else {
        logger.debug(`User-role association already exists: userId=${userId}, roleId=${roleId}`);
      }
      
      return [association, created];
    } catch (error) {
      logger.error(`Error finding or creating user-role association (userId=${userId}, roleId=${roleId}):`, error);
      throw error;
    }
  }

  /**
   * 刪除使用者角色關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async delete(userId: number, roleId: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting user-role association: userId=${userId}, roleId=${roleId}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { userId, roleId },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`User-role association deleted: userId=${userId}, roleId=${roleId}`);
      } else {
        logger.warn(`No user-role association found to delete: userId=${userId}, roleId=${roleId}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting user-role association (userId=${userId}, roleId=${roleId}):`, error);
      throw error;
    }
  }

  /**
   * 刪除使用者的所有角色關聯
   * @param userId 使用者 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  async deleteByUserId(userId: number, transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Deleting all roles for user: ${userId}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { userId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} user-role associations for user: ${userId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting user-role associations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 刪除角色的所有使用者關聯
   * @param roleId 角色 ID
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的關聯數量
   */
  async deleteByRoleId(roleId: number, transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Deleting all users for role: ${roleId}`);
      
      const deletedCount = await UserRoleModel.destroy({
        where: { roleId },
        transaction
      });
      
      logger.info(`Deleted ${deletedCount} user-role associations for role: ${roleId}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error deleting user-role associations for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查使用者角色關聯是否存在
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @returns 是否存在
   */
  async exists(userId: number, roleId: number): Promise<boolean> {
    try {
      logger.debug(`Checking if user-role association exists: userId=${userId}, roleId=${roleId}`);
      
      const count = await UserRoleModel.count({
        where: { userId, roleId }
      });
      
      const exists = count > 0;
      logger.debug(`User-role association exists: ${exists}`);
      
      return exists;
    } catch (error) {
      logger.error(`Error checking user-role association existence (userId=${userId}, roleId=${roleId}):`, error);
      throw error;
    }
  }

  /**
   * 查詢使用者的所有角色
   * @param userId 使用者 ID
   * @param includeRoleDetails 是否包含角色詳細資訊
   * @returns 角色列表
   */
  async findRolesByUserId(userId: number, includeRoleDetails: boolean = true): Promise<RoleModel[]> {
    try {
      logger.debug(`Finding roles for user: ${userId}, includeDetails: ${includeRoleDetails}`);
      
      if (includeRoleDetails) {
        const associations = await UserRoleModel.findAll({
          where: { userId },
          include: [
            {
              model: RoleModel,
              as: 'role'
            }
          ]
        });
        
        const roles = associations.map(assoc => (assoc as any).role).filter(Boolean);
        logger.debug(`Found ${roles.length} roles for user: ${userId}`);
        return roles;
      } else {
        const associations = await UserRoleModel.findAll({
          where: { userId },
          attributes: ['roleId']
        });
        
        const roleIds = associations.map(assoc => assoc.roleId);
        const roles = await RoleModel.findAll({
          where: { id: roleIds }
        });
        
        logger.debug(`Found ${roles.length} roles for user: ${userId}`);
        return roles;
      }
    } catch (error) {
      logger.error(`Error finding roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 查詢角色的所有使用者
   * @param roleId 角色 ID
   * @param includeUserDetails 是否包含使用者詳細資訊
   * @returns 使用者列表
   */
  async findUsersByRoleId(roleId: number, includeUserDetails: boolean = true): Promise<UserModel[]> {
    try {
      logger.debug(`Finding users for role: ${roleId}, includeDetails: ${includeUserDetails}`);
      
      if (includeUserDetails) {
        const associations = await UserRoleModel.findAll({
          where: { roleId },
          include: [
            {
              model: UserModel,
              as: 'user'
            }
          ]
        });
        
        const users = associations.map(assoc => (assoc as any).user).filter(Boolean);
        logger.debug(`Found ${users.length} users for role: ${roleId}`);
        return users;
      } else {
        const associations = await UserRoleModel.findAll({
          where: { roleId },
          attributes: ['userId']
        });
        
        const userIds = associations.map(assoc => assoc.userId);
        const users = await UserModel.findAll({
          where: { id: userIds }
        });
        
        logger.debug(`Found ${users.length} users for role: ${roleId}`);
        return users;
      }
    } catch (error) {
      logger.error(`Error finding users for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 查詢所有使用者角色關聯
   * @param includeDetails 是否包含使用者和角色詳細資訊
   * @returns 關聯列表
   */
  async findAll(includeDetails: boolean = false): Promise<UserRoleModel[]> {
    try {
      logger.debug(`Finding all user-role associations, includeDetails: ${includeDetails}`);
      
      const associations = await UserRoleModel.findAll({
        include: includeDetails ? [
          {
            model: UserModel,
            as: 'user'
          },
          {
            model: RoleModel,
            as: 'role'
          }
        ] : undefined,
        order: [['userId', 'ASC'], ['roleId', 'ASC']]
      });
      
      logger.debug(`Found ${associations.length} user-role associations`);
      return associations;
    } catch (error) {
      logger.error('Error finding all user-role associations:', error);
      throw error;
    }
  }

  /**
   * 計算關聯總數
   * @returns 關聯總數
   */
  async count(): Promise<number> {
    try {
      logger.debug('Counting total user-role associations');
      
      const count = await UserRoleModel.count();
      
      logger.debug(`Total user-role associations count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting user-role associations:', error);
      throw error;
    }
  }

  /**
   * 計算特定使用者的角色數量
   * @param userId 使用者 ID
   * @returns 角色數量
   */
  async countRolesByUserId(userId: number): Promise<number> {
    try {
      logger.debug(`Counting roles for user: ${userId}`);
      
      const count = await UserRoleModel.count({
        where: { userId }
      });
      
      logger.debug(`User ${userId} has ${count} roles`);
      return count;
    } catch (error) {
      logger.error(`Error counting roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 計算特定角色的使用者數量
   * @param roleId 角色 ID
   * @returns 使用者數量
   */
  async countUsersByRoleId(roleId: number): Promise<number> {
    try {
      logger.debug(`Counting users for role: ${roleId}`);
      
      const count = await UserRoleModel.count({
        where: { roleId }
      });
      
      logger.debug(`Role ${roleId} has ${count} users`);
      return count;
    } catch (error) {
      logger.error(`Error counting users for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查使用者是否擁有特定角色
   * @param userId 使用者 ID
   * @param roleName 角色名稱
   * @returns 是否擁有角色
   */
  async userHasRole(userId: number, roleName: string): Promise<boolean> {
    try {
      logger.debug(`Checking if user ${userId} has role: ${roleName}`);
      
      const count = await UserRoleModel.count({
        where: { userId },
        include: [
          {
            model: RoleModel,
            as: 'role',
            where: { name: roleName },
            attributes: []
          }
        ]
      });
      
      const hasRole = count > 0;
      logger.debug(`User ${userId} has role ${roleName}: ${hasRole}`);
      
      return hasRole;
    } catch (error) {
      logger.error(`Error checking if user ${userId} has role ${roleName}:`, error);
      throw error;
    }
  }

  /**
   * 檢查使用者是否擁有任一角色
   * @param userId 使用者 ID
   * @param roleNames 角色名稱陣列
   * @returns 是否擁有任一角色
   */
  async userHasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    try {
      logger.debug(`Checking if user ${userId} has any role from: [${roleNames.join(', ')}]`);
      
      const count = await UserRoleModel.count({
        where: { userId },
        include: [
          {
            model: RoleModel, 
            as: 'role',
            where: { name: roleNames },
            attributes: []
          }
        ]
      });
      
      const hasAnyRole = count > 0;
      logger.debug(`User ${userId} has any role from [${roleNames.join(', ')}]: ${hasAnyRole}`);
      
      return hasAnyRole;
    } catch (error) {
      logger.error(`Error checking if user ${userId} has any role from [${roleNames.join(', ')}]:`, error);
      throw error;
    }
  }

  /**
   * 查詢特定使用者和角色的關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @returns 使用者角色關聯實例或 null
   */
  async findByUserAndRole(userId: number, roleId: number): Promise<UserRoleModel | null> {
    try {
      logger.debug(`Finding user-role association: userId=${userId}, roleId=${roleId}`);
      
      const association = await UserRoleModel.findOne({
        where: { userId, roleId }
      });
      
      if (association) {
        logger.debug(`Found user-role association: userId=${userId}, roleId=${roleId}`);
      } else {
        logger.debug(`No user-role association found: userId=${userId}, roleId=${roleId}`);
      }
      
      return association;
    } catch (error) {
      logger.error(`Error finding user-role association (userId=${userId}, roleId=${roleId}):`, error);
      throw error;
    }
  }
}