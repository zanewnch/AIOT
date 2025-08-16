/**
 * @fileoverview 角色命令 Repository - CQRS 命令端
 * 
 * 專門處理角色資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { 
  RoleModel, 
  RoleCreationAttributes 
} from '../../models/RoleModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';

const logger = createLogger('RoleCommandsRepository');

/**
 * 角色命令 Repository 實現類別 - CQRS 命令端
 * 
 * 專門處理角色資料的寫入操作，遵循 CQRS 模式
 * 
 * @class RoleCommandsRepository
 */
@injectable()
export class RoleCommandsRepository {
  /**
   * 建立新角色
   * @param roleData 角色資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的角色實例
   */
  create = async (roleData: RoleCreationAttributes, transaction?: Transaction): Promise<RoleModel> => {
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
  bulkCreate = async (rolesData: RoleCreationAttributes[], transaction?: Transaction): Promise<RoleModel[]> => {
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
    whereCondition: { name: string },
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
      
      const updatedRole = await RoleModel.findByPk(id);
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
  delete = async (id: number, transaction?: Transaction): Promise<boolean> => {
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
   * 批量刪除角色
   * @param ids 角色 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  bulkDelete = async (ids: number[], transaction?: Transaction): Promise<number> => {
    try {
      logger.debug(`Bulk deleting ${ids.length} roles`);
      
      const deletedCount = await RoleModel.destroy({
        where: {
          id: ids
        },
        transaction
      });
      
      logger.info(`Successfully bulk deleted ${deletedCount} roles`);
      return deletedCount;
    } catch (error) {
      logger.error('Error bulk deleting roles:', error);
      throw error;
    }
  }

  /**
   * 根據名稱刪除角色
   * @param name 角色名稱
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  deleteByName = async (name: string, transaction?: Transaction): Promise<boolean> => {
    try {
      logger.debug(`Deleting role by name: ${name}`);
      
      const deletedCount = await RoleModel.destroy({
        where: { name },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Role deleted successfully (name: ${name})`);
      } else {
        logger.warn(`No role deleted for name: ${name}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting role by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * 重新命名角色
   * @param oldName 舊名稱
   * @param newName 新名稱
   * @param transaction 資料庫交易（可選）
   * @returns 是否更新成功
   */
  rename = async (oldName: string, newName: string, transaction?: Transaction): Promise<boolean> => {
    try {
      logger.debug(`Renaming role from ${oldName} to ${newName}`);
      
      const [updatedCount] = await RoleModel.update(
        { name: newName },
        {
          where: { name: oldName },
          transaction
        }
      );
      
      const success = updatedCount > 0;
      if (success) {
        logger.info(`Role renamed successfully from ${oldName} to ${newName}`);
      } else {
        logger.warn(`No role renamed (not found): ${oldName}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error renaming role from ${oldName} to ${newName}:`, error);
      throw error;
    }
  }

  /**
   * 更新角色描述
   * @param id 角色 ID
   * @param description 新描述
   * @param transaction 資料庫交易（可選）
   * @returns 是否更新成功
   */
  updateDescription = async (id: number, description: string, transaction?: Transaction): Promise<boolean> => {
    try {
      logger.debug(`Updating description for role ID ${id}`);
      
      const [updatedCount] = await RoleModel.update(
        { displayName: description },
        {
          where: { id },
          transaction
        }
      );
      
      const success = updatedCount > 0;
      if (success) {
        logger.info(`Role description updated successfully (ID: ${id})`);
      } else {
        logger.warn(`No role description updated for ID: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error updating role description for ID ${id}:`, error);
      throw error;
    }
  }

  // 注意：Role 模型沒有 isActive 字段，以下方法已被註釋
  // 如需啟用/停用功能，請考慮在資料庫模型中添加對應字段
  
  /*
  activate = async (id: number, transaction?: Transaction): Promise<boolean> => {
    // 此方法需要 Role 模型有 isActive 字段
    throw new Error('Role model does not have isActive field');
  }

  deactivate = async (id: number, transaction?: Transaction): Promise<boolean> => {
    // 此方法需要 Role 模型有 isActive 字段  
    throw new Error('Role model does not have isActive field');
  }
  */
}