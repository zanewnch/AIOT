import { Router } from 'express';
import { DIContainer } from '../utils/RBACContainer.js';
import {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController,
    IRBACController
} from '../types/index.js';

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

        // 使用DI容器獲取依賴
        const container = DIContainer.getInstance();
        this.userController = container.getUserController();
        this.roleController = container.getRoleController();
        this.permissionController = container.getPermissionController();
        this.userToRoleController = container.getUserToRoleController();
        this.roleToPermissionController = container.getRoleToPermissionController();

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

export default new RBACController();