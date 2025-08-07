/**
 * @fileoverview 權限命令 Repository - CQRS 命令端
 * 
 * 專門處理權限資料的寫入操作，遵循 CQRS 模式的命令端原則。
 * 只包含寫入相關的操作方法，不包含任何查詢操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { 
  PermissionModel, 
  PermissionCreationAttributes 
} from '../../../models/rbac/PermissionModel.js';
import { createLogger } from '../../../configs/loggerConfig.js';
import type { Transaction } from 'sequelize';

const logger = createLogger('PermissionCommandsRepository');

/**
 * 權限命令 Repository 實現類別 - CQRS 命令端
 * 
 * 專門處理權限資料的寫入操作，遵循 CQRS 模式
 * 
 * @class PermissionCommandsRepository
 */
@injectable()
export class PermissionCommandsRepository {
  /**
   * 建立新權限
   * @param permissionData 權限資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的權限實例
   */
  async create(permissionData: PermissionCreationAttributes, transaction?: Transaction): Promise<PermissionModel> {
    try {
      logger.debug(`Creating permission: ${permissionData.name}`);
      
      const permission = await PermissionModel.create(permissionData, { transaction });
      
      logger.info(`Permission created successfully: ${permission.name} (ID: ${permission.id})`);
      return permission;
    } catch (error) {
      logger.error(`Error creating permission ${permissionData.name}:`, error);
      throw error;
    }
  }

  /**
   * 批量建立權限
   * @param permissionsData 權限資料陣列
   * @param transaction 資料庫交易（可選）
   * @returns 建立的權限實例陣列
   */
  async bulkCreate(permissionsData: PermissionCreationAttributes[], transaction?: Transaction): Promise<PermissionModel[]> {
    try {
      logger.debug(`Bulk creating ${permissionsData.length} permissions`);
      
      const permissions = await PermissionModel.bulkCreate(permissionsData, {
        transaction,
        ignoreDuplicates: true,
        returning: true
      });
      
      logger.info(`Successfully bulk created ${permissions.length} permissions`);
      return permissions;
    } catch (error) {
      logger.error('Error bulk creating permissions:', error);
      throw error;
    }
  }

  /**
   * 查詢或建立權限
   * @param whereCondition 查詢條件
   * @param defaults 預設建立值
   * @param transaction 資料庫交易（可選）
   * @returns [權限實例, 是否為新建立]
   */
  async findOrCreate(
    whereCondition: { name: string },
    defaults: PermissionCreationAttributes,
    transaction?: Transaction
  ): Promise<[PermissionModel, boolean]> {
    try {
      const conditionStr = JSON.stringify(whereCondition);
      logger.debug(`Finding or creating permission with condition: ${conditionStr}`);
      
      const [permission, created] = await PermissionModel.findOrCreate({
        where: whereCondition,
        defaults,
        transaction
      });
      
      if (created) {
        logger.info(`Permission created: ${permission.name} (ID: ${permission.id})`);
      } else {
        logger.debug(`Permission already exists: ${permission.name} (ID: ${permission.id})`);
      }
      
      return [permission, created];
    } catch (error) {
      logger.error('Error finding or creating permission:', error);
      throw error;
    }
  }

  /**
   * 更新權限
   * @param id 權限 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的權限實例或 null
   */
  async update(
    id: number,
    updateData: Partial<PermissionCreationAttributes>,
    transaction?: Transaction
  ): Promise<PermissionModel | null> {
    try {
      logger.debug(`Updating permission ID ${id} with data:`, updateData);
      
      const [updatedCount] = await PermissionModel.update(updateData, {
        where: { id },
        transaction
      });
      
      if (updatedCount === 0) {
        logger.warn(`No permission updated for ID: ${id}`);
        return null;
      }
      
      const updatedPermission = await PermissionModel.findByPk(id);
      logger.info(`Permission updated successfully: ${updatedPermission?.name} (ID: ${id})`);
      
      return updatedPermission;
    } catch (error) {
      logger.error(`Error updating permission ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 刪除權限
   * @param id 權限 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async delete(id: number, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting permission ID: ${id}`);
      
      const deletedCount = await PermissionModel.destroy({
        where: { id },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Permission deleted successfully (ID: ${id})`);
      } else {
        logger.warn(`No permission deleted for ID: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting permission ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 批量刪除權限
   * @param ids 權限 ID 陣列
   * @param transaction 資料庫交易（可選）
   * @returns 刪除的記錄數
   */
  async bulkDelete(ids: number[], transaction?: Transaction): Promise<number> {
    try {
      logger.debug(`Bulk deleting ${ids.length} permissions`);
      
      const deletedCount = await PermissionModel.destroy({
        where: {
          id: ids
        },
        transaction
      });
      
      logger.info(`Successfully bulk deleted ${deletedCount} permissions`);
      return deletedCount;
    } catch (error) {
      logger.error('Error bulk deleting permissions:', error);
      throw error;
    }
  }

  /**
   * 根據名稱刪除權限
   * @param name 權限名稱
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  async deleteByName(name: string, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Deleting permission by name: ${name}`);
      
      const deletedCount = await PermissionModel.destroy({
        where: { name },
        transaction
      });
      
      const success = deletedCount > 0;
      if (success) {
        logger.info(`Permission deleted successfully (name: ${name})`);
      } else {
        logger.warn(`No permission deleted for name: ${name}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting permission by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * 更新權限描述
   * @param id 權限 ID
   * @param description 新描述
   * @param transaction 資料庫交易（可選）
   * @returns 是否更新成功
   */
  async updateDescription(id: number, description: string, transaction?: Transaction): Promise<boolean> {
    try {
      logger.debug(`Updating description for permission ID ${id}`);
      
      const [updatedCount] = await PermissionModel.update(
        { description },
        {
          where: { id },
          transaction
        }
      );
      
      const success = updatedCount > 0;
      if (success) {
        logger.info(`Permission description updated successfully (ID: ${id})`);
      } else {
        logger.warn(`No permission description updated for ID: ${id}`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error updating permission description for ID ${id}:`, error);
      throw error;
    }
  }

  // 重複的方法已移除

  // 注意：Permission 模型沒有 isActive 字段，以下方法已被註釋
  // 如需啟用/停用功能，請考慮在資料庫模型中添加對應字段
  
  /*
  async activate(id: number, transaction?: Transaction): Promise<boolean> {
    // 此方法需要 Permission 模型有 isActive 字段
    throw new Error('Permission model does not have isActive field');
  }

  async deactivate(id: number, transaction?: Transaction): Promise<boolean> {
    // 此方法需要 Permission 模型有 isActive 字段  
    throw new Error('Permission model does not have isActive field');
  }
  */
}