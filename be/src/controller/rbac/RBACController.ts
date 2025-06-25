import { Router } from 'express';
import { RBACContainer } from '../../utils/RBACContainer.js';
import {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController,
    IRBACController
} from '../../types/index.js';
import { UserController } from './UserController.js';
import { RoleController } from './RoleController.js';
import { PermissionController } from './PermissionController.js';
import { UserToRoleController } from './UserToRoleController.js';
import { RoleToPermissionController } from './RoleToPermissionController.js';

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

        //  不使用container 也不使用factory 感覺被改的有點亂
        // 用最簡單的方法來實現DI
        this.userController = new UserController();
        this.roleController = new RoleController();
        this.permissionController = new PermissionController();
        this.userToRoleController = new UserToRoleController();
        this.roleToPermissionController = new RoleToPermissionController();

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