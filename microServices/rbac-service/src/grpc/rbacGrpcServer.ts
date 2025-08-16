/**
 * @fileoverview RBAC gRPC 服務器實作
 * 
 * 此文件實作 RBAC 服務的 gRPC 服務器，提供：
 * - 使用者管理 gRPC 端點
 * - 角色管理 gRPC 端點
 * - 權限管理 gRPC 端點
 * - 使用者角色關聯管理 gRPC 端點
 * - 角色權限關聯管理 gRPC 端點
 * 
 * @module gRPC/RbacGrpcServer
 * @version 1.0.0
 * @author AIOT Team
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { UserQueries } from '../controllers/queries/UserQueriesCtrl.js';
import { UserCommands } from '../controllers/commands/UserCommandsCtrl.js';
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl.js';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl.js';
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl.js';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl.js';
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl.js';
import { UserToRoleCommands } from '../controllers/commands/UserToRoleCommandsCtrl.js';
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';
import { RoleToPermissionCommands } from '../controllers/commands/RoleToPermissionCommandsCtrl.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * RBAC gRPC 服務器類別
 */
export class RbacGrpcServer {
  private server: grpc.Server;
  private userQueries: UserQueries;
  private userCommands: UserCommands;
  private roleQueries: RoleQueries;
  private roleCommands: RoleCommands;
  private permissionQueries: PermissionQueries;
  private permissionCommands: PermissionCommands;
  private userToRoleQueries: UserToRoleQueries;
  private userToRoleCommands: UserToRoleCommands;
  private roleToPermissionQueries: RoleToPermissionQueries;
  private roleToPermissionCommands: RoleToPermissionCommands;

  constructor() {
    this.server = new grpc.Server({
      'grpc.keepalive_time_ms': 30000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': true,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.http2.min_time_between_pings_ms': 10000,
      'grpc.http2.min_ping_interval_without_data_ms': 300000,
      'grpc.max_connection_idle_ms': 300000,
      'grpc.max_connection_age_ms': 30000,
      'grpc.max_connection_age_grace_ms': 5000
    });
    
    // 注入依賴
    this.userQueries = container.get<UserQueries>(TYPES.UserQueriesCtrl);
    this.userCommands = container.get<UserCommands>(TYPES.UserCommandsCtrl);
    this.roleQueries = container.get<RoleQueries>(TYPES.RoleQueriesCtrl);
    this.roleCommands = container.get<RoleCommands>(TYPES.RoleCommandsCtrl);
    this.permissionQueries = container.get<PermissionQueries>(TYPES.PermissionQueriesCtrl);
    this.permissionCommands = container.get<PermissionCommands>(TYPES.PermissionCommandsCtrl);
    this.userToRoleQueries = container.get<UserToRoleQueries>(TYPES.UserToRoleQueriesCtrl);
    this.userToRoleCommands = container.get<UserToRoleCommands>(TYPES.UserToRoleCommandsCtrl);
    this.roleToPermissionQueries = container.get<RoleToPermissionQueries>(TYPES.RoleToPermissionQueriesCtrl);
    this.roleToPermissionCommands = container.get<RoleToPermissionCommands>(TYPES.RoleToPermissionCommandsCtrl);

    this.loadProtoAndAddService();
  }

  /**
   * 載入 proto 文件並添加服務
   */
  private loadProtoAndAddService(): void {
    const PROTO_PATH = path.join(__dirname, '../../proto/rbac.proto');
    const HEALTH_PROTO_PATH = path.join(__dirname, '../../proto/health.proto');
    const PROTO_DIR = path.join(__dirname, '../../proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    // 載入健康檢查 proto
    const healthPackageDefinition = protoLoader.loadSync(HEALTH_PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    const rbacProto = grpc.loadPackageDefinition(packageDefinition) as any;
    const healthProto = grpc.loadPackageDefinition(healthPackageDefinition) as any;

    this.server.addService(rbacProto.rbac.RbacService.service, {
      // 使用者管理方法
      GetUsers: this.getUsers.bind(this),
      GetUserById: this.getUserById.bind(this),
      CreateUser: this.createUser.bind(this),
      UpdateUser: this.updateUser.bind(this),
      DeleteUser: this.deleteUser.bind(this),

      // 角色管理方法
      GetRoles: this.getRoles.bind(this),
      GetRoleById: this.getRoleById.bind(this),
      CreateRole: this.createRole.bind(this),
      UpdateRole: this.updateRole.bind(this),
      DeleteRole: this.deleteRole.bind(this),

      // 權限管理方法
      GetPermissions: this.getPermissions.bind(this),
      GetPermissionById: this.getPermissionById.bind(this),
      CreatePermission: this.createPermission.bind(this),
      UpdatePermission: this.updatePermission.bind(this),
      DeletePermission: this.deletePermission.bind(this),

      // 使用者角色關聯方法
      GetUserRoles: this.getUserRoles.bind(this),
      CreateUserRole: this.createUserRole.bind(this),
      DeleteUserRole: this.deleteUserRole.bind(this),

      // 角色權限關聯方法
      GetRolePermissions: this.getRolePermissions.bind(this),
      CreateRolePermission: this.createRolePermission.bind(this),
      DeleteRolePermission: this.deleteRolePermission.bind(this),
    });

    // 添加健康檢查服務
    this.server.addService(healthProto.grpc.health.v1.Health.service, {
      Check: this.healthCheck.bind(this),
      Watch: this.healthWatch.bind(this),
    });
  }

  /**
   * 將 Express 控制器轉換為 gRPC 回調格式
   */
  private async executeControllerMethod(
    controllerMethod: (req: any, res: any) => Promise<void>,
    request: any,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      // 模擬 Express req/res 物件
      const mockReq = {
        body: request,
        params: request,
        query: request,
      };

      let responseData: any;
      const mockRes = {
        json: (data: any) => {
          responseData = data;
        },
        status: (code: number) => ({
          json: (data: any) => {
            responseData = { ...data, statusCode: code };
          }
        })
      };

      await controllerMethod(mockReq, mockRes);
      
      // 轉換為 gRPC 格式回應
      callback(null, {
        success: responseData?.status === 200,
        message: responseData?.message || '',
        ...responseData?.data,
      });
    } catch (error) {
      console.error('gRPC method execution error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  }

  // ========== 使用者管理方法 ==========
  private async getUsers(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userQueries.getUsers.bind(this.userQueries), call.request, callback);
  }

  private async getUserById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userQueries.getUserById.bind(this.userQueries), { userId: call.request.user_id }, callback);
  }

  private async createUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userCommands.createUser.bind(this.userCommands), call.request, callback);
  }

  private async updateUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userCommands.updateUser.bind(this.userCommands), 
      { userId: call.request.user_id, ...call.request }, callback);
  }

  private async deleteUser(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userCommands.deleteUser.bind(this.userCommands), { userId: call.request.user_id }, callback);
  }

  // ========== 角色管理方法 ==========
  private async getRoles(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleQueries.getRoles.bind(this.roleQueries), call.request, callback);
  }

  private async getRoleById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleQueries.getRoleById.bind(this.roleQueries), { roleId: call.request.role_id }, callback);
  }

  private async createRole(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleCommands.createRole.bind(this.roleCommands), call.request, callback);
  }

  private async updateRole(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleCommands.updateRole.bind(this.roleCommands), 
      { roleId: call.request.role_id, ...call.request }, callback);
  }

  private async deleteRole(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleCommands.deleteRole.bind(this.roleCommands), { roleId: call.request.role_id }, callback);
  }

  // ========== 權限管理方法 ==========
  private async getPermissions(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.permissionQueries.getPermissions.bind(this.permissionQueries), call.request, callback);
  }

  private async getPermissionById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.permissionQueries.getPermissionById.bind(this.permissionQueries), 
      { permissionId: call.request.permission_id }, callback);
  }

  private async createPermission(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.permissionCommands.createPermission.bind(this.permissionCommands), call.request, callback);
  }

  private async updatePermission(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.permissionCommands.updatePermission.bind(this.permissionCommands), 
      { permissionId: call.request.permission_id, ...call.request }, callback);
  }

  private async deletePermission(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.permissionCommands.deletePermission.bind(this.permissionCommands), 
      { permissionId: call.request.permission_id }, callback);
  }

  // ========== 使用者角色關聯方法 ==========
  private async getUserRoles(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userToRoleQueries.getUserRoles.bind(this.userToRoleQueries), call.request, callback);
  }

  private async createUserRole(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userToRoleCommands.createUserRole.bind(this.userToRoleCommands), call.request, callback);
  }

  private async deleteUserRole(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.userToRoleCommands.deleteUserRole.bind(this.userToRoleCommands), 
      { userRoleId: call.request.user_role_id }, callback);
  }

  // ========== 角色權限關聯方法 ==========
  private async getRolePermissions(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleToPermissionQueries.getRolePermissions.bind(this.roleToPermissionQueries), call.request, callback);
  }

  private async createRolePermission(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleToPermissionCommands.createRolePermission.bind(this.roleToPermissionCommands), call.request, callback);
  }

  private async deleteRolePermission(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.roleToPermissionCommands.deleteRolePermission.bind(this.roleToPermissionCommands), 
      { rolePermissionId: call.request.role_permission_id }, callback);
  }

  /**
   * 啟動 gRPC 服務器
   */
  public start(port: number = 50051): void {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          console.error('Failed to start gRPC server:', error);
          return;
        }
        
        console.log(`RBAC gRPC server running on port ${boundPort}`);
        this.server.start();
      }
    );
  }

  /**
   * 健康檢查方法
   */
  private healthCheck(call: any, callback: grpc.sendUnaryData<any>): void {
    callback(null, { status: 1 }); // 1 = SERVING
  }

  /**
   * 健康檢查監聽方法
   */
  private healthWatch(call: any): void {
    call.write({ status: 1 }); // 1 = SERVING
  }

  /**
   * 停止 gRPC 服務器
   */
  public stop(): void {
    this.server.tryShutdown(() => {
      console.log('RBAC gRPC server stopped');
    });
  }
}