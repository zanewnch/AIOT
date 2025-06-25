import { Router } from 'express';
import { RBACContainer } from '../../utils/RBACContainer.js';
import {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController,
    IRBACController
} from '../../types/controllers/index.js';


class RBACController implements IRBACController {
    public router: Router;

    // 依賴interface而不是具體實現
    private userController: IUserController;
    private roleController: IRoleController;
    private permissionController: IPermissionController;
    private userToRoleController: IUserToRoleController;
    private roleToPermissionController: IRoleToPermissionController;

    constructor() {
        this.router = Router();

        const rbacContainer = RBACContainer.getInstance();
        this.userController = rbacContainer.getUserController();
        this.roleController = rbacContainer.getRoleController();
        this.permissionController = rbacContainer.getPermissionController();
        this.userToRoleController = rbacContainer.getUserToRoleController();
        this.roleToPermissionController = rbacContainer.getRoleToPermissionController();

        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // 將各個controller的路由掛載到主router上
        this.router.use('/users', this.userController.router);
        this.router.use('/roles', this.roleController.router);
        this.router.use('/permissions', this.permissionController.router);
        this.router.use('/users', this.userToRoleController.router);
        this.router.use('/roles', this.roleToPermissionController.router);
    }
}

// 導出類別而不是實例，讓 Factory 可以創建實例
export default RBACController;