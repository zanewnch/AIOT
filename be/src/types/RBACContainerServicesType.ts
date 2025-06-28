import { IUserController, IRoleController, IPermissionController, IUserToRoleController, IRoleToPermissionController } from './controllers/index.js';

export type RBACContainerServicesType = IUserController | IRoleController | IPermissionController | IUserToRoleController | IRoleToPermissionController;