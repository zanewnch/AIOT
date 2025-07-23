/**
 * @fileoverview 權限管理控制器 - 處理 RBAC 系統中權限的完整生命週期管理
 * 
 * 此控制器負責管理系統中的權限相關操作，包括：
 * - 權限的建立、查詢、更新和刪除
 * - 權限的分類和層級管理
 * - 權限的快取機制優化
 * - 權限的驗證和存取控制
 * 
 * 安全性考量：
 * - 權限操作需要最高級別的管理權限
 * - 防止權限濫用和提升攻擊
 * - 確保權限變更的審計追蹤
 * - 維護權限系統的完整性
 * 
 * 效能優化：
 * - 整合 Redis 快取機制提升查詢效能
 * - 權限資料的智能快取策略
 * - 減少資料庫查詢負載
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response } from 'express'; // 引入 Express 的請求和回應類型定義
import { PermissionModel } from '../../models/rbac/PermissionModel.js'; // 引入權限資料模型
import { IPermissionController } from '../../types/controllers/IPermissionController.js'; // 引入權限控制器介面
import { getRedisClient } from '../../configs/redisConfig.js'; // 引入 Redis 客戶端配置
import { createLogger, logRequest } from '../../configs/loggerConfig.js'; // 引入日誌記錄器

// 創建控制器專用的日誌記錄器
const logger = createLogger('PermissionController');

/**
 * 權限管理控制器類別
 * 
 * 實作 IPermissionController 介面，提供完整的權限管理功能：
 * - 權限的 CRUD 操作
 * - 權限的分類和層級管理
 * - 權限的快取機制
 * - 權限的驗證和存取控制
 * 
 * @class PermissionController
 * @implements {IPermissionController}
 * @description 處理所有與權限管理相關的 HTTP 請求和業務邏輯
 */
export class PermissionController implements IPermissionController {
    private static readonly CACHE_PREFIX = 'permission:';
    private static readonly ALL_PERMISSIONS_KEY = 'permissions:all';
    private static readonly CACHE_TTL = 3600; // 1小時

    /**
     * 初始化權限控制器實例
     */
    constructor() {
        // Controller only contains business logic
    }

    /**
     * 獲取 Redis 客戶端
     */
    private getRedisClient() {
        try {
            return getRedisClient();
        } catch (error) {
            console.warn('Redis not available, falling back to database queries');
            return null;
        }
    }

    /**
     * 獲取權限的 Redis Key
     */
    private getPermissionKey(permissionId: string | number): string {
        return `${PermissionController.CACHE_PREFIX}${permissionId}`;
    }


    /**
     * 獲取所有權限列表
     * 
     * 返回系統中所有可用的權限，包含id、名稱、描述和時間戳訊息。
     * 
     * @param req - Express請求物件（未使用）
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/permissions
     * ```
     * 
     * 回應格式:
     * ```json
     * [
     *   {
     *     "id": 1,
     *     "name": "read_users",
     *     "description": "允許讀取使用者資料",
     *     "createdAt": "2024-01-01T00:00:00.000Z",
     *     "updatedAt": "2024-01-01T00:00:00.000Z"
     *   }
     * ]
     * ```
     * 
     * @throws {500} 伺服器错誤 - 無法獲取權限列表
     */
    public async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            logRequest(req, 'Fetching all permissions', 'info');
            logger.debug('Getting all permissions with cache support');
            
            // 先嘗試從 Redis 獲取
            let redis;
            try {
                redis = this.getRedisClient();
            } catch (error) {
                logger.warn('Redis client not available, falling back to database only');
                redis = null;
            }
            let permissions;

            if (redis) {
                logger.debug('Checking Redis cache for all permissions');
                const cachedData = await redis.get(PermissionController.ALL_PERMISSIONS_KEY);
                if (cachedData) {
                    logger.info('Permissions loaded from Redis cache');
                    permissions = JSON.parse(cachedData);
                    res.json(permissions);
                    return;
                }
                logger.debug('No cached permissions found, querying database');
            }

            // Redis 快取不存在，從資料庫獲取
            logger.debug('Fetching permissions from database');
            permissions = await PermissionModel.findAll();
            const permissionsData = permissions.map(p => p.toJSON());
            
            logger.info(`Retrieved ${permissionsData.length} permissions from database`);

            // 更新 Redis 快取
            if (redis) {
                logger.debug('Caching permissions in Redis');
                await redis.setEx(
                    PermissionController.ALL_PERMISSIONS_KEY,
                    PermissionController.CACHE_TTL,
                    JSON.stringify(permissionsData)
                );

                // 同時快取每個單獨的權限
                for (const permission of permissionsData) {
                    const key = this.getPermissionKey(permission.id);
                    await redis.setEx(key, PermissionController.CACHE_TTL, JSON.stringify(permission));
                }
                logger.debug('Permissions cached successfully');
            }

            res.json(permissionsData);
        } catch (error) {
            logger.error('Error fetching permissions:', error);
            res.status(500).json({ message: 'Failed to fetch permissions', error: (error as Error).message });
        }
    }

    /**
     * 根據權限ID獲取特定權限詳細資訊
     * 
     * 查找並返回指定權限的完整資訊，包含所有屬性和時間戳。
     * 
     * @param req - Express請求物件，包含permissionId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/permissions/1
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "id": 1,
     *   "name": "read_users",
     *   "description": "允許讀取使用者資料",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * @throws {404} 權限不存在
     * @throws {500} 伺服器错誤 - 無法獲取權限
     */
    public async getPermissionById(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            
            // 先嘗試從 Redis 獲取
            const redis = this.getRedisClient();
            if (redis) {
                const key = this.getPermissionKey(permissionId);
                const cachedData = await redis.get(key);
                if (cachedData) {
                    const permission = JSON.parse(cachedData);
                    res.json(permission);
                    return;
                }
            }

            // Redis 快取不存在，從資料庫獲取
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }

            const permissionData = permission.toJSON();

            // 更新 Redis 快取
            if (redis) {
                const key = this.getPermissionKey(permissionId);
                await redis.setEx(key, PermissionController.CACHE_TTL, JSON.stringify(permissionData));
            }

            res.json(permissionData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch permission', error: (error as Error).message });
        }
    }

    /**
     * 創建新的權限
     * 
     * 在系統中建立一個新的權限，需要提供權限名稱，描述為可選項。
     * 
     * @param req - Express請求物件，包含name和description
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * POST /api/rbac/permissions
     * Content-Type: application/json
     * 
     * {
     *   "name": "read_users",
     *   "description": "允許讀取使用者資料"
     * }
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "id": 1,
     *   "name": "read_users",
     *   "description": "允許讀取使用者資料",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * @throws {500} 伺服器错誤 - 無法建立權限
     */
    public async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const permission = await PermissionModel.create({ name, description });
            const permissionData = permission.toJSON();

            // 更新 Redis 快取
            const redis = this.getRedisClient();
            if (redis) {
                // 快取新創建的權限
                const key = this.getPermissionKey(permissionData.id);
                await redis.setEx(key, PermissionController.CACHE_TTL, JSON.stringify(permissionData));
                
                // 清除所有權限列表快取，強制下次重新載入
                await redis.del(PermissionController.ALL_PERMISSIONS_KEY);
            }

            res.status(201).json(permissionData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create permission', error: (error as Error).message });
        }
    }

    /**
     * 更新指定權限的資訊
     * 
     * 根據權限ID查找並更新其名稱和描述。如果權限不存在則返回404错誤。
     * 
     * @param req - Express請求物件，包含permissionId參數和name、description
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * PUT /api/rbac/permissions/1
     * Content-Type: application/json
     * 
     * {
     *   "name": "read_all_users",
     *   "description": "允許讀取所有使用者資料"
     * }
     * ```
     * 
     * @throws {404} 權限不存在
     * @throws {500} 伺服器错誤 - 無法更新權限
     */
    public async updatePermission(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const { name, description } = req.body;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            await permission.update({ name, description });
            const updatedPermissionData = permission.toJSON();

            // 更新 Redis 快取
            const redis = this.getRedisClient();
            if (redis) {
                // 更新單個權限快取
                const key = this.getPermissionKey(permissionId);
                await redis.setEx(key, PermissionController.CACHE_TTL, JSON.stringify(updatedPermissionData));
                
                // 清除所有權限列表快取，強制下次重新載入
                await redis.del(PermissionController.ALL_PERMISSIONS_KEY);
            }

            res.json(updatedPermissionData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update permission', error: (error as Error).message });
        }
    }

    /**
     * 刪除指定的權限
     * 
     * 根據權限ID查找並刪除指定的權限。成功刪除後返回204狀態碼。
     * 
     * @param req - Express請求物件，包含permissionId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * DELETE /api/rbac/permissions/1
     * ```
     * 
     * @throws {404} 權限不存在
     * @throws {500} 伺服器错誤 - 無法刪除權限
     */
    public async deletePermission(req: Request, res: Response): Promise<void> {
        try {
            const { permissionId } = req.params;
            const permission = await PermissionModel.findByPk(permissionId);
            if (!permission) {
                res.status(404).json({ message: 'Permission not found' });
                return;
            }
            await permission.destroy();

            // 清除 Redis 快取
            const redis = this.getRedisClient();
            if (redis) {
                // 清除單個權限快取
                const key = this.getPermissionKey(permissionId);
                await redis.del(key);
                
                // 清除所有權限列表快取
                await redis.del(PermissionController.ALL_PERMISSIONS_KEY);
            }

            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete permission', error: (error as Error).message });
        }
    }
}