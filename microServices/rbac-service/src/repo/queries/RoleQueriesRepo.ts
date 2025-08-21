/**
 * @fileoverview 角色查詢 Repo - CQRS 查詢端
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
} from '../../models/RoleModel.js';
import { PermissionModel } from '../../models/PermissionModel.js';
import { UserModel } from '../../models/UserModel.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('RoleQueriesRepo');

/**
 * 角色查詢 Repo 實現類別 - CQRS 查詢端
 * 
 * 專門處理角色資料的查詢操作，遵循 CQRS 模式
 * 
 * @class RoleQueriesRepo
 */
@injectable()
export class RoleQueriesRepo {
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
   * 查詢所有角色（使用分頁方法以統一介面）
   * 
   * **設計意圖說明：**
   * 此方法從原本的獨立實現重構為使用 findPaginated 統一介面。
   * 重構的核心價值：
   * 1. **代碼複用最大化**：消除與 findPaginated 的重複邏輯
   * 2. **查詢行為統一**：確保所有角色查詢都使用相同的排序和篩選機制  
   * 3. **維護成本降低**：資料庫查詢優化只需在 findPaginated 中進行一次
   * 4. **功能擴展簡化**：新增 include 關聯、複雜篩選等只需修改一處
   * 5. **接口一致性**：與其他 Repository 方法保持統一的實現模式
   * 
   * 技術實現：透過 Number.MAX_SAFE_INTEGER 確保取得所有記錄，同時保持分頁介面
   * 
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的使用者資料
   * @returns 角色列表
   */
  findAll = async (
    includePermissions: boolean = false, 
    includeUsers: boolean = false
  ): Promise<RoleModel[]> => {
    // 統一使用 findPaginated 方法，設定極大值來模擬查詢全部
    return this.findPaginated(
      Number.MAX_SAFE_INTEGER, // 使用極大值作為 limit
      0, // offset 為 0
      'name', // 按名稱排序
      'ASC', // 升序排列
      includePermissions,
      includeUsers
    );
  }

  /**
   * 分頁查詢角色列表
   * @param limit 每頁數量
   * @param offset 偏移量
   * @param sortBy 排序欄位
   * @param sortOrder 排序方向
   * @param includePermissions 是否包含關聯的權限資料
   * @param includeUsers 是否包含關聯的用戶資料
   * @returns 角色列表
   */
  findPaginated = async (
    limit: number,
    offset: number,
    sortBy: string = 'id',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    includePermissions: boolean = false,
    includeUsers: boolean = false
  ): Promise<RoleModel[]> => {
    try {
      logger.debug(`Finding roles with pagination`, {
        limit,
        offset,
        sortBy,
        sortOrder,
        includePermissions,
        includeUsers
      });
      
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
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      logger.debug(`Found ${roles.length} roles with pagination`);
      return roles;
    } catch (error) {
      logger.error('Error finding roles with pagination:', error);
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