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
import { PermissionService } from '../../services/PermissionService.js'; // 引入權限服務層
import { IPermissionController } from '../../types/controllers/IPermissionController.js'; // 引入權限控制器介面
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
 * @description 處理所有與權限管理相關的 HTTP 請求，委派業務邏輯給服務層
 */
export class PermissionController implements IPermissionController {
    private permissionService: PermissionService;

    /**
     * 初始化權限控制器實例
     * @param permissionService 權限服務層實例
     */
    constructor(permissionService: PermissionService = new PermissionService()) {
        this.permissionService = permissionService;
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
            logger.debug('Getting all permissions from service');
            
            const permissions = await this.permissionService.getAllPermissions();
            
            logger.info(`Retrieved ${permissions.length} permissions from service`);
            res.json(permissions);
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
            const id = parseInt(permissionId, 10);
            
            logger.info(`Retrieving permission by ID: ${permissionId}`);
            logRequest(req, `Permission retrieval request for ID: ${permissionId}`, 'info');
            
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid permission ID' });
                return;
            }

            const permission = await this.permissionService.getPermissionById(id);
            if (!permission) {
                logger.warn(`Permission not found for ID: ${permissionId}`);
                res.status(404).json({ message: 'Permission not found' });
                return;
            }

            logger.info(`Permission ID: ${permissionId} retrieved successfully`);
            res.json(permission);
        } catch (error) {
            logger.error('Error fetching permission by ID:', error);
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
            
            logger.info(`Creating new permission: ${name}`);
            logRequest(req, `Permission creation request for: ${name}`, 'info');
            
            // 驗證輸入
            if (!name || name.trim().length === 0) {
                res.status(400).json({ message: 'Permission name is required' });
                return;
            }

            const permission = await this.permissionService.createPermission({ name, description });

            logger.info(`Permission created successfully: ${name} (ID: ${permission.id})`);
            res.status(201).json(permission);
        } catch (error) {
            logger.error('Error creating permission:', error);
            if (error instanceof Error && error.message.includes('already exists')) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to create permission', error: (error as Error).message });
            }
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
            const id = parseInt(permissionId, 10);
            
            logger.info(`Updating permission ID: ${permissionId}`);
            logRequest(req, `Permission update request for ID: ${permissionId}`, 'info');
            
            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid permission ID' });
                return;
            }

            if (!name && !description) {
                res.status(400).json({ message: 'At least one field (name or description) must be provided for update' });
                return;
            }

            const updatedPermission = await this.permissionService.updatePermission(id, { name, description });
            if (!updatedPermission) {
                logger.warn(`Permission update failed - permission not found for ID: ${permissionId}`);
                res.status(404).json({ message: 'Permission not found' });
                return;
            }

            logger.info(`Permission updated successfully: ID ${permissionId}`);
            res.json(updatedPermission);
        } catch (error) {
            logger.error('Error updating permission:', error);
            if (error instanceof Error && error.message.includes('already exists')) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Failed to update permission', error: (error as Error).message });
            }
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
            const id = parseInt(permissionId, 10);
            
            logger.info(`Deleting permission ID: ${permissionId}`);
            logRequest(req, `Permission deletion request for ID: ${permissionId}`, 'info');
            
            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ message: 'Invalid permission ID' });
                return;
            }

            const deleted = await this.permissionService.deletePermission(id);
            if (!deleted) {
                logger.warn(`Permission deletion failed - permission not found for ID: ${permissionId}`);
                res.status(404).json({ message: 'Permission not found' });
                return;
            }

            logger.info(`Permission deleted successfully: ID ${permissionId}`);
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting permission:', error);
            res.status(500).json({ message: 'Failed to delete permission', error: (error as Error).message });
        }
    }
}