/**
 * @fileoverview 使用者角色關聯查詢 Repo - CQRS 查詢端
 * 
 * 專門處理使用者角色關聯資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserRoleModel } from '../../models/UserToRoleModel.js';
import { UserModel } from '../../models/UserModel.js';
import { RoleModel } from '../../models/RoleModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('UserRoleQueriesRepo');

/**
 * 使用者角色關聯查詢 Repo 實現類別 - CQRS 查詢端
 * 
 * 專門處理使用者角色關聯資料的查詢操作，遵循 CQRS 模式
 * 
 * @class UserRoleQueriesRepo
 */
@injectable()
export class UserRoleQueriesRepo {
  /**
   * 根據 ID 查詢使用者角色關聯
   * @param id 關聯 ID
   * @returns 使用者角色關聯實例或 null
   */
  findById = async (id: number): Promise<UserRoleModel | null> => {
    try {
      logger.debug(`Finding user role by ID: ${id}`);
      
      const userRole = await UserRoleModel.findByPk(id, {
        include: [
          { model: UserModel, as: 'user' },
          { model: RoleModel, as: 'role' }
        ]
      });

      if (!userRole) {
        logger.debug(`User role not found with ID: ${id}`);
        return null;
      }

      logger.debug(`User role found (ID: ${userRole.id})`);
      return userRole;
    } catch (error) {
      logger.error(`Error finding user role by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 查詢所有使用者角色關聯
   * @returns 使用者角色關聯列表
   */
  findAll = async (): Promise<UserRoleModel[]> => {
    try {
      logger.debug('Finding all user roles');
      
      const userRoles = await UserRoleModel.findAll({
        include: [
          { model: UserModel, as: 'user' },
          { model: RoleModel, as: 'role' }
        ],
        order: [['createdAt', 'DESC']]
      });

      logger.debug(`Found ${userRoles.length} user roles`);
      return userRoles;
    } catch (error) {
      logger.error('Error finding all user roles:', error);
      throw error;
    }
  }

  /**
   * 根據使用者 ID 查詢角色關聯
   * @param userId 使用者 ID
   * @returns 使用者的角色關聯列表
   */
  findByUserId = async (userId: number): Promise<UserRoleModel[]> => {
    try {
      logger.debug(`Finding user roles by user ID: ${userId}`);
      
      const userRoles = await UserRoleModel.findAll({
        where: { userId },
        include: [
          { model: UserModel, as: 'user' },
          { model: RoleModel, as: 'role' }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${userRoles.length} roles for user ${userId}`);
      return userRoles;
    } catch (error) {
      logger.error(`Error finding user roles by user ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色 ID 查詢使用者關聯
   * @param roleId 角色 ID
   * @returns 角色的使用者關聯列表
   */
  findByRoleId = async (roleId: number): Promise<UserRoleModel[]> => {
    try {
      logger.debug(`Finding user roles by role ID: ${roleId}`);
      
      const userRoles = await UserRoleModel.findAll({
        where: { roleId },
        include: [
          { model: UserModel, as: 'user' },
          { model: RoleModel, as: 'role' }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${userRoles.length} users for role ${roleId}`);
      return userRoles;
    } catch (error) {
      logger.error(`Error finding user roles by role ID ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 根據使用者和角色 ID 查詢關聯
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @returns 使用者角色關聯實例或 null
   */
  findByUserAndRole = async (userId: number, roleId: number): Promise<UserRoleModel | null> => {
    try {
      logger.debug(`Finding user role by user ID ${userId} and role ID ${roleId}`);
      
      const userRole = await UserRoleModel.findOne({
        where: { userId, roleId },
        include: [
          { model: UserModel, as: 'user' },
          { model: RoleModel, as: 'role' }
        ]
      });

      if (!userRole) {
        logger.debug(`User role not found for user ${userId} and role ${roleId}`);
        return null;
      }

      logger.debug(`User role found (ID: ${userRole.id})`);
      return userRole;
    } catch (error) {
      logger.error(`Error finding user role by user ${userId} and role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查使用者是否有特定角色
   * @param userId 使用者 ID
   * @param roleId 角色 ID
   * @returns 是否有角色
   */
  hasRole = async (userId: number, roleId: number): Promise<boolean> => {
    try {
      logger.debug(`Checking if user ${userId} has role ${roleId}`);
      
      const count = await UserRoleModel.count({
        where: { userId, roleId }
      });
      
      const hasRole = count > 0;
      logger.debug(`User ${userId} has role ${roleId}: ${hasRole}`);
      
      return hasRole;
    } catch (error) {
      logger.error(`Error checking role ${roleId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 根據使用者名稱查詢角色關聯
   * @param username 使用者名稱
   * @returns 使用者的角色關聯列表
   */
  findByUsername = async (username: string): Promise<UserRoleModel[]> => {
    try {
      logger.debug(`Finding user roles by username: ${username}`);
      
      const userRoles = await UserRoleModel.findAll({
        include: [
          { 
            model: UserModel, 
            as: 'user',
            where: { username }
          },
          { model: RoleModel, as: 'role' }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${userRoles.length} roles for username ${username}`);
      return userRoles;
    } catch (error) {
      logger.error(`Error finding user roles by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * 根據角色名稱查詢使用者關聯
   * @param roleName 角色名稱
   * @returns 角色的使用者關聯列表
   */
  findByRoleName = async (roleName: string): Promise<UserRoleModel[]> => {
    try {
      logger.debug(`Finding user roles by role name: ${roleName}`);
      
      const userRoles = await UserRoleModel.findAll({
        include: [
          { model: UserModel, as: 'user' },
          { 
            model: RoleModel, 
            as: 'role',
            where: { name: roleName }
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      logger.debug(`Found ${userRoles.length} users for role ${roleName}`);
      return userRoles;
    } catch (error) {
      logger.error(`Error finding user roles by role name ${roleName}:`, error);
      throw error;
    }
  }

  /**
   * 統計使用者總的角色數
   * @param userId 使用者 ID
   * @returns 使用者的角色數量
   */
  countByUserId = async (userId: number): Promise<number> => {
    try {
      logger.debug(`Counting roles for user ${userId}`);
      
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
   * 統計角色總的使用者數
   * @param roleId 角色 ID
   * @returns 角色的使用者數量
   */
  countByRoleId = async (roleId: number): Promise<number> => {
    try {
      logger.debug(`Counting users for role ${roleId}`);
      
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
   * 統計所有使用者角色關聯數
   * @returns 總關聯數
   */
  count = async (): Promise<number> => {
    try {
      logger.debug('Counting total user roles');
      
      const count = await UserRoleModel.count();
      
      logger.debug(`Total user roles count: ${count}`);
      return count;
    } catch (error) {
      logger.error('Error counting user roles:', error);
      throw error;
    }
  }
}