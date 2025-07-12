import { Router, Request, Response } from 'express';
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { IRoleController } from '../../types/controllers/IRoleController.js';

/**
 * 角色管理控制器，處理系統角色的CRUD操作
 * 
 * 提供角色的創建、查詢、更新和刪除功能。
 * 角色是RBAC系統中的重要概念，用於組織和管理權限的集合。
 * 
 * @module Controllers
 * @example
 * ```typescript
 * const roleController = new RoleController();
 * app.use('/api/rbac/roles', roleController.router);
 * ```
 */
export class RoleController implements IRoleController {
    public router: Router;

    /**
     * 初始化角色控制器實例
     * 
     * 設置路由器和所有角色相關的API端點
     */
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * 初始化角色控制器的路由配置
     * 
     * 設定所有角色相關的API端點路由，包括：
     * - GET / - 獲取所有角色列表
     * - POST / - 創建新角色
     * - GET /:roleId - 根據ID獲取特定角色
     * - PUT /:roleId - 更新指定角色
     * - DELETE /:roleId - 刪除指定角色
     * 
     * @private
     * @returns {void}
     */
    private initializeRoutes(): void {
        this.router.route('/')
            .get(this.getRoles.bind(this))
            .post(this.createRole.bind(this));
        this.router.route('/:roleId')
            .get(this.getRoleById.bind(this))
            .put(this.updateRole.bind(this))
            .delete(this.deleteRole.bind(this));
    }

    /**
     * 獲取所有角色列表
     * 
     * 返回系統中所有可用的角色，包含id、名稱、顯示名稱和時間戳訊息。
     * 
     * @param req - Express請求物件（未使用）
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/roles
     * ```
     * 
     * 回應格式:
     * ```json
     * [
     *   {
     *     "id": 1,
     *     "name": "admin",
     *     "displayName": "系統管理員",
     *     "createdAt": "2024-01-01T00:00:00.000Z",
     *     "updatedAt": "2024-01-01T00:00:00.000Z"
     *   }
     * ]
     * ```
     * 
     * @throws {500} 伺服器错誤 - 無法獲取角色列表
     */
    public async getRoles(req: Request, res: Response): Promise<void> {
        try {
            const roles = await RoleModel.findAll();
            res.json(roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch roles', error: (error as Error).message });
        }
    }

    /**
     * 根據角色ID獲取特定角色詳細資訊
     * 
     * 查找並返回指定角色的完整資訊，包含所有屬性和時間戳。
     * 
     * @param req - Express請求物件，包含roleId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * GET /api/rbac/roles/1
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "id": 1,
     *   "name": "admin",
     *   "displayName": "系統管理員",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * @throws {404} 角色不存在
     * @throws {500} 伺服器错誤 - 無法獲取角色
     */
    public async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch role', error: (error as Error).message });
        }
    }

    /**
     * 創建新的角色
     * 
     * 在系統中建立一個新的角色，需要提供角色名稱，顯示名稱為可選項。
     * 
     * @param req - Express請求物件，包含name和displayName
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * POST /api/rbac/roles
     * Content-Type: application/json
     * 
     * {
     *   "name": "admin",
     *   "displayName": "系統管理員"
     * }
     * ```
     * 
     * 成功回應:
     * ```json
     * {
     *   "id": 1,
     *   "name": "admin",
     *   "displayName": "系統管理員",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * @throws {500} 伺服器错誤 - 無法建立角色
     */
    public async createRole(req: Request, res: Response): Promise<void> {
        try {
            const { name, displayName } = req.body;
            const role = await RoleModel.create({ name, displayName });
            res.status(201).json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create role', error: (error as Error).message });
        }
    }

    /**
     * 更新指定角色的資訊
     * 
     * 根據角色ID查找並更新其名稱和顯示名稱。如果角色不存在則返回404错誤。
     * 
     * @param req - Express請求物件，包含roleId參數和name、displayName
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * PUT /api/rbac/roles/1
     * Content-Type: application/json
     * 
     * {
     *   "name": "super_admin",
     *   "displayName": "超級管理員"
     * }
     * ```
     * 
     * @throws {404} 角色不存在
     * @throws {500} 伺服器错誤 - 無法更新角色
     */
    public async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const { name, displayName } = req.body;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.update({ name, displayName });
            res.json(role);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update role', error: (error as Error).message });
        }
    }

    /**
     * 刪除指定的角色
     * 
     * 根據角色ID查找並刪除指定的角色。成功刪除後返回204狀態碼。
     * 
     * @param req - Express請求物件，包含roleId參數
     * @param res - Express回應物件
     * @returns Promise<void>
     * 
     * @example
     * ```bash
     * DELETE /api/rbac/roles/1
     * ```
     * 
     * @throws {404} 角色不存在
     * @throws {500} 伺服器错誤 - 無法刪除角色
     */
    public async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const role = await RoleModel.findByPk(roleId);
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            await role.destroy();
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete role', error: (error as Error).message });
        }
    }
}
