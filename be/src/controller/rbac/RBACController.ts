import { Router } from 'express';
import { RBACContainer } from '../../utils/RBACContainer.js';
import { JwtAuthMiddleware } from '../../middleware/jwtAuthMiddleware.js';
import {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController,
    IRBACController
} from '../../types/controllers/index.js';

/**
 * RBAC主控制器，整合所有角色基礎存取控制功能
 * 
 * 統一管理使用者、角色、權限以及它們之間的關聯關係。
 * 所有RBAC相關的路由都會通過JWT驗證中間件進行保護。
 * 使用依賴注入容器來管理各個子控制器的實例。
 * 
 * @group Controllers
 * @example
 * ```typescript
 * const rbacController = new RBACController();
 * app.use('/api/', rbacController.router);
 * ```
 */
export class RBACController implements IRBACController {
    public router: Router;

    // 依賴interface而不是具體實現
    private userController: IUserController;
    private roleController: IRoleController;
    private permissionController: IPermissionController;
    private userToRoleController: IUserToRoleController;
    private roleToPermissionController: IRoleToPermissionController;
    private jwtAuth: JwtAuthMiddleware;

    /**
     * 初始化RBAC控制器實例
     * 
     * 設置路由器、JWT驗證中間件，並從依賴注入容器獲取所有必要的子控制器。
     * 完成後初始化所有RBAC相關的路由配置。
     * 
     * @example
     * ```typescript
     * const rbacController = new RBACController();
     * // 所有子控制器和中間件都已正確配置
     * ```
     */
    constructor() {
        this.router = Router();
        this.jwtAuth = new JwtAuthMiddleware();

        const rbacContainer = RBACContainer.getInstance();
        this.userController = rbacContainer.getUserController();
        this.roleController = rbacContainer.getRoleController();
        this.permissionController = rbacContainer.getPermissionController();
        this.userToRoleController = rbacContainer.getUserToRoleController();
        this.roleToPermissionController = rbacContainer.getRoleToPermissionController();

        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // 所有 RBAC 路由都需要 JWT 認證
        this.router.use(this.jwtAuth.authenticate);

        // 將各個controller的路由掛載到主router上
        this.router.use('/rbac/users', this.userController.router);
        this.router.use('/rbac/roles', this.roleController.router);
        this.router.use('/rbac/permissions', this.permissionController.router);
        this.router.use('/rbac/users', this.userToRoleController.router);
        this.router.use('/rbac/roles', this.roleToPermissionController.router);
    }

}

