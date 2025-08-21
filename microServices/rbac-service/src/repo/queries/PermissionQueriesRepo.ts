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
} from '../../models/PermissionModel.js';
import { RoleModel } from '../../models/RoleModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Op } from 'sequelize';
import type { PermissionSearchCriteria } from '../../services/queries/PermissionQueriesSvc.js';

const logger = createLogger('PermissionQueriesRepo');

/**
 * 權限查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理權限資料的查詢操作，遵循 CQRS 模式
 * 
 * @class PermissionQueriesRepo
 */
@injectable()
export class PermissionQueriesRepo {
  /**
   * 根據 ID 查詢權限
   * @param id 權限 ID
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限實例或 null
   */
  findById = async (id: number, includeRoles: boolean = false): Promise<PermissionModel | null> => {
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
  findByName = async (name: string, includeRoles: boolean = false): Promise<PermissionModel | null> => {
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
  findAll = async (includeRoles: boolean = false): Promise<PermissionModel[]> => {
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
   * 分頁查詢權限列表
   * @param limit 每頁數量
   * @param offset 偏移量
   * @param sortBy 排序欄位
   * @param sortOrder 排序方向
   * @param includeRoles 是否包含關聯的角色資料
   * @returns 權限列表
   */
  findPaginated = async (
    limit: number,
    offset: number,
    sortBy: string = 'id',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    includeRoles: boolean = false
  ): Promise<PermissionModel[]> => {
    try {
      logger.debug(`Finding permissions with pagination`, {
        limit,
        offset,
        sortBy,
        sortOrder,
        includeRoles
      });
      
      const include = includeRoles ? [{
        model: RoleModel,
        as: 'roles',
        through: { attributes: [] }
      }] : undefined;

      const permissions = await PermissionModel.findAll({
        include,
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      logger.debug(`Found ${permissions.length} permissions with pagination`);
      return permissions;
    } catch (error) {
      logger.error('Error finding permissions with pagination:', error);
      throw error;
    }
  }

  /**
   * 檢查權限是否存在
   * @param name 權限名稱
   * @returns 是否存在
   */
  exists = async (name: string): Promise<boolean> => {
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
  count = async (): Promise<number> => {
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
  findByNames = async (names: string[]): Promise<PermissionModel[]> => {
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
  findByRoleId = async (roleId: number): Promise<PermissionModel[]> => {
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
  findByRoleName = async (roleName: string): Promise<PermissionModel[]> => {
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
  findByType = async (type: string): Promise<PermissionModel[]> => {
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
  search = async (searchTerm: string): Promise<PermissionModel[]> => {
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

  /**
   * 按名稱模糊搜尋權限（分頁）
   * @param namePattern 名稱搜尋模式
   * @param limit 每頁數量
   * @param offset 偏移量
   * @param sortBy 排序欄位
   * @param sortOrder 排序方向
   * @returns 權限列表
   */
  findByNamePatternPaginated = async (
    namePattern: string,
    limit: number,
    offset: number,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<PermissionModel[]> => {
    try {
      logger.debug(`Finding permissions by name pattern with pagination`, {
        namePattern,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      
      const permissions = await PermissionModel.findAll({
        where: {
          name: { [Op.iLike]: namePattern }
        },
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });
      
      logger.debug(`Found ${permissions.length} permissions matching name pattern "${namePattern}"`);
      return permissions;
    } catch (error) {
      logger.error(`Error finding permissions by name pattern "${namePattern}":`, error);
      throw error;
    }
  }

  /**
   * 計算按名稱模糊搜尋的權限總數
   * @param namePattern 名稱搜尋模式
   * @returns 匹配的權限總數
   */
  countByNamePattern = async (namePattern: string): Promise<number> => {
    try {
      logger.debug(`Counting permissions by name pattern: ${namePattern}`);
      
      const count = await PermissionModel.count({
        where: {
          name: { [Op.iLike]: namePattern }
        }
      });
      
      logger.debug(`Found ${count} permissions matching name pattern "${namePattern}"`);
      return count;
    } catch (error) {
      logger.error(`Error counting permissions by name pattern "${namePattern}":`, error);
      throw error;
    }
  }

  /**
   * 按描述模糊搜尋權限（分頁）
   * @param descriptionPattern 描述搜尋模式
   * @param limit 每頁數量
   * @param offset 偏移量
   * @param sortBy 排序欄位
   * @param sortOrder 排序方向
   * @returns 權限列表
   */
  findByDescriptionPatternPaginated = async (
    descriptionPattern: string,
    limit: number,
    offset: number,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<PermissionModel[]> => {
    try {
      logger.debug(`Finding permissions by description pattern with pagination`, {
        descriptionPattern,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      
      const permissions = await PermissionModel.findAll({
        where: {
          description: { [Op.iLike]: descriptionPattern }
        },
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });
      
      logger.debug(`Found ${permissions.length} permissions matching description pattern "${descriptionPattern}"`);
      return permissions;
    } catch (error) {
      logger.error(`Error finding permissions by description pattern "${descriptionPattern}":`, error);
      throw error;
    }
  }

  /**
   * 計算按描述模糊搜尋的權限總數
   * @param descriptionPattern 描述搜尋模式
   * @returns 匹配的權限總數
   */
  countByDescriptionPattern = async (descriptionPattern: string): Promise<number> => {
    try {
      logger.debug(`Counting permissions by description pattern: ${descriptionPattern}`);
      
      const count = await PermissionModel.count({
        where: {
          description: { [Op.iLike]: descriptionPattern }
        }
      });
      
      logger.debug(`Found ${count} permissions matching description pattern "${descriptionPattern}"`);
      return count;
    } catch (error) {
      logger.error(`Error counting permissions by description pattern "${descriptionPattern}":`, error);
      throw error;
    }
  }

  /**
   * 按創建時間範圍查詢權限（分頁）
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @param limit 每頁數量
   * @param offset 偏移量
   * @param sortBy 排序欄位
   * @param sortOrder 排序方向
   * @returns 權限列表
   */
  findByDateRangePaginated = async (
    startDate: Date,
    endDate: Date,
    limit: number,
    offset: number,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PermissionModel[]> => {
    try {
      logger.debug(`Finding permissions by date range with pagination`, {
        startDate,
        endDate,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      
      const permissions = await PermissionModel.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });
      
      logger.debug(`Found ${permissions.length} permissions in date range ${startDate} - ${endDate}`);
      return permissions;
    } catch (error) {
      logger.error(`Error finding permissions by date range ${startDate} - ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * 計算按創建時間範圍查詢的權限總數
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 匹配的權限總數
   */
  countByDateRange = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
      logger.debug(`Counting permissions by date range: ${startDate} - ${endDate}`);
      
      const count = await PermissionModel.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });
      
      logger.debug(`Found ${count} permissions in date range ${startDate} - ${endDate}`);
      return count;
    } catch (error) {
      logger.error(`Error counting permissions by date range ${startDate} - ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * 組合條件搜尋權限（分頁）
   * @param criteria 搜尋條件
   * @param limit 每頁數量
   * @param offset 偏移量
   * @param sortBy 排序欄位
   * @param sortOrder 排序方向
   * @returns 權限列表
   */
  searchPaginated = async (
    criteria: PermissionSearchCriteria,
    limit: number,
    offset: number,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<PermissionModel[]> => {
    try {
      logger.debug(`Searching permissions with criteria and pagination`, {
        criteria,
        limit,
        offset,
        sortBy,
        sortOrder
      });
      
      // 構建查詢條件
      const whereConditions: any = {};
      const andConditions: any[] = [];

      // 名稱模糊搜尋
      if (criteria.namePattern) {
        andConditions.push({
          name: { [Op.iLike]: `%${criteria.namePattern}%` }
        });
      }

      // 描述模糊搜尋
      if (criteria.descriptionPattern) {
        andConditions.push({
          description: { [Op.iLike]: `%${criteria.descriptionPattern}%` }
        });
      }

      // 日期範圍
      if (criteria.startDate && criteria.endDate) {
        andConditions.push({
          createdAt: {
            [Op.between]: [criteria.startDate, criteria.endDate]
          }
        });
      }

      // 包含的 ID 列表
      if (criteria.includeIds && criteria.includeIds.length > 0) {
        andConditions.push({
          id: { [Op.in]: criteria.includeIds }
        });
      }

      // 排除的 ID 列表
      if (criteria.excludeIds && criteria.excludeIds.length > 0) {
        andConditions.push({
          id: { [Op.notIn]: criteria.excludeIds }
        });
      }

      // 如果有條件，使用 AND 邏輯
      if (andConditions.length > 0) {
        whereConditions[Op.and] = andConditions;
      }
      
      const permissions = await PermissionModel.findAll({
        where: whereConditions,
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });
      
      logger.debug(`Found ${permissions.length} permissions matching search criteria`);
      return permissions;
    } catch (error) {
      logger.error(`Error searching permissions with criteria:`, error);
      throw error;
    }
  }

  /**
   * 計算組合條件搜尋的權限總數
   * @param criteria 搜尋條件
   * @returns 匹配的權限總數
   */
  countByCriteria = async (criteria: PermissionSearchCriteria): Promise<number> => {
    try {
      logger.debug(`Counting permissions by search criteria`, criteria);
      
      // 構建查詢條件（與 searchPaginated 相同邏輯）
      const whereConditions: any = {};
      const andConditions: any[] = [];

      if (criteria.namePattern) {
        andConditions.push({
          name: { [Op.iLike]: `%${criteria.namePattern}%` }
        });
      }

      if (criteria.descriptionPattern) {
        andConditions.push({
          description: { [Op.iLike]: `%${criteria.descriptionPattern}%` }
        });
      }

      if (criteria.startDate && criteria.endDate) {
        andConditions.push({
          createdAt: {
            [Op.between]: [criteria.startDate, criteria.endDate]
          }
        });
      }

      if (criteria.includeIds && criteria.includeIds.length > 0) {
        andConditions.push({
          id: { [Op.in]: criteria.includeIds }
        });
      }

      if (criteria.excludeIds && criteria.excludeIds.length > 0) {
        andConditions.push({
          id: { [Op.notIn]: criteria.excludeIds }
        });
      }

      if (andConditions.length > 0) {
        whereConditions[Op.and] = andConditions;
      }
      
      const count = await PermissionModel.count({
        where: whereConditions
      });
      
      logger.debug(`Found ${count} permissions matching search criteria`);
      return count;
    } catch (error) {
      logger.error(`Error counting permissions by search criteria:`, error);
      throw error;
    }
  }
}