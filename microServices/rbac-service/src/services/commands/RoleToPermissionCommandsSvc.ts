/**
 * @fileoverview 角色權限關聯命令服務實現
 *
 * 此文件實作了角色權限關聯命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * 功能特點：
 * - 角色權限分配和撤銷
 * - Redis 快取管理和刷新
 * - 批量權限操作
 * - 事務性操作支援
 * - 自動快取失效和更新
 *
 * 快取策略：
 * - 寫入後立即清除相關快取
 * - 支援強制快取刷新
 * - 批量操作的快取管理
 *
 * 使用場景：
 * - RBAC 角色權限管理操作
 * - 權限分配和撤銷
 * - 批量權限操作
 *
 * @module RoleToPermissionCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
// 匯入角色權限命令資料存取層
import { RolePermissionCommandsRepository } from '../../repo/commands/RolePermissionCommandsRepo.js';
// 匯入角色查詢資料存取層，用於驗證
import { RoleQueriesRepo } from '../../repo/queries/RoleQueriesRepo.js';
// 匯入權限查詢資料存取層，用於驗證
import { PermissionQueriesRepo } from '../../repo/queries/PermissionQueriesRepo.js';
// 匯入 BaseRedisService
import { BaseRedisService } from '@aiot/shared-packages';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '@aiot/shared-packages';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../../configs/loggerConfig.js';
// 匯入查詢服務，用於驗證操作
import { RoleToPermissionQueriesSvc } from '../queries/RoleToPermissionQueriesSvc.js';
import type { IRoleToPermissionQueriesService } from '../../types/index.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('RoleToPermissionCommandsSvc');

/**
 * 角色權限關聯命令服務介面
 * 定義所有命令相關的方法
 */
export interface IRoleToPermissionCommandsService {
    assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void>;
    removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
    removeAllPermissionsFromRole(roleId: number): Promise<number>;
    removeAllRolesFromPermission(permissionId: number): Promise<number>;
}

/**
 * 角色權限關聯命令服務實現類別
 *
 * 專門處理角色權限關聯相關的命令請求，包含分配、撤銷、批量操作等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 原則。
 * 依賴查詢服務進行資料驗證和檢查。
 * 
 * @class RoleToPermissionCommandsSvc
 * @implements IRoleToPermissionCommandsService
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionCommandsSvc extends BaseRedisService implements IRoleToPermissionCommandsService {
    private static readonly ROLE_PERMISSIONS_CACHE_PREFIX = 'role_permissions:'; // Redis 中儲存角色權限關聯的鍵值前綴
    private static readonly PERMISSION_ROLES_CACHE_PREFIX = 'permission_roles:'; // Redis 中儲存權限角色關聯的鍵值前綴
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor(
        @inject(TYPES.RoleToPermissionQueriesSvc)
        private readonly roleToPermissionQueriesSvc: IRoleToPermissionQueriesService,
        @inject(TYPES.RolePermissionCommandsRepo)
        private readonly rolePermissionCommandsRepository: RolePermissionCommandsRepository,
        @inject(TYPES.RoleQueriesRepo)
        private readonly roleQueriesRepo: RoleQueriesRepo,
        @inject(TYPES.PermissionQueriesRepo)
        private readonly permissionQueriesRepo: PermissionQueriesRepo
    ) {
        // 初始化 Redis 服務
        super({
            serviceName: 'RoleToPermissionCommandsSvc',
            defaultTTL: RoleToPermissionCommandsSvc.DEFAULT_CACHE_TTL,
            enableDebugLogs: false,
            logger: logger
        });
    }

    /**
     * 實作抽象方法：提供 Redis 客戶端工廠函式
     */
    protected getRedisClientFactory() {
        return getRedisClient;
    }

    /**
     * 產生角色權限快取鍵值
     * @param roleId 角色 ID
     */
    private getRolePermissionsCacheKey = (roleId: number): string => { // 私有方法：產生角色權限快取鍵值
        return `${RoleToPermissionCommandsSvc.ROLE_PERMISSIONS_CACHE_PREFIX}${roleId}`; // 結合角色權限快取前綴和角色 ID 產生唯一的快取鍵值
    }

    /**
     * 產生權限角色快取鍵值
     * @param permissionId 權限 ID
     */
    private getPermissionRolesCacheKey = (permissionId: number): string => { // 私有方法：產生權限角色快取鍵值
        return `${RoleToPermissionCommandsSvc.PERMISSION_ROLES_CACHE_PREFIX}${permissionId}`; // 結合權限角色快取前綴和權限 ID 產生唯一的快取鍵值
    }

    /**
     * 清除角色權限管理快取
     * @param roleId 角色 ID（可選）
     * @param permissionId 權限 ID（可選）
     */
    private clearRolePermissionCache = async (roleId?: number, permissionId?: number): Promise<void> => {
        if (roleId) {
            logger.debug(`Clearing Redis cache for role permissions: ${roleId}`);
            const roleKey = this.getRolePermissionsCacheKey(roleId);
            await this.safeRedisOperation(
                async (redis: RedisClientType) => await redis.del(roleKey),
                `clearRolePermissionCache(${roleId})`,
                0
            );
        }
        if (permissionId) {
            logger.debug(`Clearing Redis cache for permission roles: ${permissionId}`);
            const permissionKey = this.getPermissionRolesCacheKey(permissionId);
            await this.safeRedisOperation(
                async (redis: RedisClientType) => await redis.del(permissionKey),
                `clearPermissionRoleCache(${permissionId})`,
                0
            );
        }
        logger.debug('Role permission management caches cleared successfully');
    }

    /**
     * 為角色分配權限
     * @param roleId 角色 ID
     * @param permissionIds 權限 ID 陣列
     */
    public assignPermissionsToRole = async (roleId: number, permissionIds: number[]): Promise<void> => { // 公開異步方法：為角色分配權限
        try { // 嘗試執行權限分配操作
            logger.info(`Assigning permissions ${permissionIds.join(', ')} to role ID: ${roleId}`); // 記錄開始為角色分配權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }
            if (!permissionIds || permissionIds.length === 0) { // 檢查是否提供了至少一個權限 ID
                throw new Error('At least one permission ID must be provided'); // 拋出錯誤，要求提供至少一個權限 ID
            }

            // 驗證角色是否存在
            const role = await this.roleQueriesRepo.findById(roleId); // 調用角色查詢資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 驗證所有權限是否存在
            for (const permissionId of permissionIds) { // 遍歷所有要分配的權限 ID
                if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效
                    throw new Error(`Invalid permission ID: ${permissionId}`); // 拋出錯誤，表示權限 ID 無效
                }
                const permission = await this.permissionQueriesRepo.findById(permissionId); // 調用權限查詢資料存取層檢查權限是否存在
                if (!permission) { // 如果權限不存在
                    throw new Error(`Permission not found: ${permissionId}`); // 拋出錯誤，表示權限不存在
                }
            }

            // 分配權限
            const successfullyAssigned: number[] = []; // 初始化成功分配的權限 ID 陣列
            for (const permissionId of permissionIds) { // 遍歷所有要分配的權限 ID
                try { // 嘗試為當前權限分配給角色
                    const whereCondition = { roleId, permissionId };
                    const defaults = { roleId, permissionId };
                    const [, created] = await this.rolePermissionCommandsRepository.findOrCreate(whereCondition, defaults); // 調用角色權限命令資料存取層的尋找或建立方法
                    if (created) { // 如果成功建立了新的角色權限關聯
                        successfullyAssigned.push(permissionId); // 將權限 ID 加入成功分配列表
                        logger.debug(`Permission ${permissionId} assigned to role ${roleId}`); // 記錄權限分配成功的除錯日誌
                    } else { // 如果角色權限關聯已經存在
                        logger.debug(`Permission ${permissionId} already assigned to role ${roleId}`); // 記錄權限已經分配的除錯日誌
                    }
                } catch (error) { // 捕獲單個權限分配過程中的錯誤
                    logger.warn(`Failed to assign permission ${permissionId} to role ${roleId}:`, error); // 記錄權限分配失敗的警告日誌
                }
            }

            // 清除相關快取
            await this.clearRolePermissionCache(roleId); // 清除角色權限快取
            for (const permissionId of successfullyAssigned) { // 遍歷所有成功分配的權限 ID
                await this.clearRolePermissionCache(undefined, permissionId); // 清除相關權限角色快取
            }

            logger.info(`Successfully assigned ${successfullyAssigned.length} permissions to role ID: ${roleId}`); // 記錄成功分配權限數量的資訊日誌
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error assigning permissions to role ${roleId}:`, error); // 記錄為角色分配權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to assign permissions to role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 從角色撤銷權限
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     */
    public removePermissionFromRole = async (roleId: number, permissionId: number): Promise<boolean> => { // 公開異步方法：從角色撤銷權限
        try { // 嘗試執行權限撤銷操作
            logger.info(`Removing permission ${permissionId} from role ID: ${roleId}`); // 記錄開始從角色撤銷權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }
            if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效（大於 0）
                throw new Error('Invalid permission ID'); // 拋出錯誤，表示權限 ID 無效
            }

            // 驗證角色是否存在
            const role = await this.roleQueriesRepo.findById(roleId); // 調用角色查詢資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 驗證權限是否存在
            const permission = await this.permissionQueriesRepo.findById(permissionId); // 調用權限查詢資料存取層檢查權限是否存在
            if (!permission) { // 如果權限不存在
                throw new Error('Permission not found'); // 拋出錯誤，表示權限不存在
            }

            // 撤銷權限
            const removed = await this.rolePermissionCommandsRepository.deleteByRoleAndPermission(roleId, permissionId); // 調用角色權限命令資料存取層刪除角色權限關聯

            if (removed) { // 如果成功撤銷了權限
                // 清除相關快取
                await this.clearRolePermissionCache(roleId, permissionId); // 清除角色權限和權限角色相關的快取
                logger.info(`Permission ${permissionId} removed from role ID: ${roleId}`); // 記錄權限撤銷成功的資訊日誌
            } else { // 如果權限本來就不屬於該角色
                logger.warn(`Permission ${permissionId} was not assigned to role ID: ${roleId}`); // 記錄權限未分配給角色的警告日誌
            }

            return removed; // 回傳撤銷操作的結果（true 或 false）
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing permission from role ${roleId}:`, error); // 記錄從角色撤銷權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove permission from role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 批次撤銷角色的所有權限
     * @param roleId 角色 ID
     */
    public removeAllPermissionsFromRole = async (roleId: number): Promise<number> => { // 公開異步方法：批次撤銷角色的所有權限
        try { // 嘗試執行批次權限撤銷操作
            logger.info(`Removing all permissions from role ID: ${roleId}`); // 記錄開始撤銷角色所有權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 驗證角色是否存在
            const role = await this.roleQueriesRepo.findById(roleId); // 調用角色查詢資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 獲取角色目前的權限
            const currentPermissions = await this.roleToPermissionQueriesSvc.getRolePermissions(roleId); // 調用查詢服務取得角色當前擁有的所有權限
            const permissionIds = currentPermissions.map(p => p.id); // 提取所有權限的 ID 列表，用於後續快取清理

            // 撤銷所有權限
            const removedCount = await this.rolePermissionCommandsRepository.deleteByRoleId(roleId); // 調用角色權限命令資料存取層批次刪除角色的所有權限關聯

            if (removedCount > 0) { // 如果成功撤銷了至少一個權限
                // 清除相關快取
                await this.clearRolePermissionCache(roleId); // 清除角色權限快取
                for (const permissionId of permissionIds) { // 遍歷所有被撤銷的權限 ID
                    await this.clearRolePermissionCache(undefined, permissionId); // 清除相關權限角色快取
                }
            }

            logger.info(`Removed ${removedCount} permissions from role ID: ${roleId}`); // 記錄成功撤銷權限數量的資訊日誌
            return removedCount; // 回傳實際撤銷的權限數量
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing all permissions from role ${roleId}:`, error); // 記錄撤銷角色所有權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove all permissions from role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 批次撤銷權限的所有角色
     * @param permissionId 權限 ID
     */
    public removeAllRolesFromPermission = async (permissionId: number): Promise<number> => { // 公開異步方法：批次撤銷權限的所有角色
        try { // 嘗試執行批次角色撤銷操作
            logger.info(`Removing all roles from permission ID: ${permissionId}`); // 記錄開始撤銷權限所有角色的資訊日誌

            // 驗證輸入
            if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效（大於 0）
                throw new Error('Invalid permission ID'); // 拋出錯誤，表示權限 ID 無效
            }

            // 驗證權限是否存在
            const permission = await this.permissionQueriesRepo.findById(permissionId); // 調用權限查詢資料存取層檢查權限是否存在
            if (!permission) { // 如果權限不存在
                throw new Error('Permission not found'); // 拋出錯誤，表示權限不存在
            }

            // 獲取權限目前的角色
            const currentRoles = await this.roleToPermissionQueriesSvc.getPermissionRoles(permissionId); // 調用查詢服務取得權限當前關聯的所有角色
            const roleIds = currentRoles.map(r => r.id); // 提取所有角色的 ID 列表，用於後續快取清理

            // 撤銷所有角色
            const removedCount = await this.rolePermissionCommandsRepository.deleteByPermissionId(permissionId); // 調用角色權限命令資料存取層批次刪除權限的所有角色關聯

            if (removedCount > 0) { // 如果成功撤銷了至少一個角色
                // 清除相關快取
                await this.clearRolePermissionCache(undefined, permissionId); // 清除權限角色快取
                for (const roleId of roleIds) { // 遍歷所有被撤銷的角色 ID
                    await this.clearRolePermissionCache(roleId); // 清除相關角色權限快取
                }
            }

            logger.info(`Removed ${removedCount} roles from permission ID: ${permissionId}`); // 記錄成功撤銷角色數量的資訊日誌
            return removedCount; // 回傳實際撤銷的角色數量
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing all roles from permission ${permissionId}:`, error); // 記錄撤銷權限所有角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove all roles from permission'); // 拋出通用錯誤訊息
        }
    }
}