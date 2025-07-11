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


export class RBACController implements IRBACController {
    public router: Router;

    // 依賴interface而不是具體實現
    private userController: IUserController;
    private roleController: IRoleController;
    private permissionController: IPermissionController;
    private userToRoleController: IUserToRoleController;
    private roleToPermissionController: IRoleToPermissionController;
    private jwtAuth: JwtAuthMiddleware;

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

