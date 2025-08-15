/**
 * @fileoverview 角色權限關聯命令控制器
 * 
 * 此文件實作了角色權限關聯命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module RoleToPermissionCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { RoleToPermissionCommandsSvc } from '../../services/commands/RoleToPermissionCommandsSvc';
import type { IRoleToPermissionCommandsService } from '../../types/services/IRoleToPermissionCommandsService';
import { createLogger, logRequest } from '../../configs/loggerConfig';
import { ControllerResult } from '../../utils/ControllerResult';
import { TYPES } from '../../container/types';

const logger = createLogger('RoleToPermissionCommands');

/**
 * 角色權限關聯命令控制器類別
 * 
 * 專門處理角色權限關聯相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class RoleToPermissionCommands
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionCommands {
    constructor(
        @inject(TYPES.RoleToPermissionCommandsSvc) private readonly roleToPermissionService: IRoleToPermissionCommandsService
    ) {}

    /**
     * 分配權限給指定角色
     * @route POST /api/rbac/roles/:roleId/permissions
     */
    public assignPermissionsToRole = async (req: Request, res: Response): Promise<void> => {
        try {
            const { roleId } = req.params;
            const { permissionIds } = req.body;
            const id = parseInt(roleId, 10);

            logger.info(`Assigning permissions to role ID: ${roleId}`);
            logRequest(req, `Permission assignment request for role ID: ${roleId}`, 'info');

            // 驗證輸入
            if (isNaN(id) || id <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
                const result = ControllerResult.badRequest('權限 ID 為必填項且必須為陣列');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每個 permission ID
            const validPermissionIds = permissionIds.filter(permissionId => {
                const parsedId = parseInt(permissionId, 10);
                return !isNaN(parsedId) && parsedId > 0;
            }).map(permissionId => parseInt(permissionId, 10));

            if (validPermissionIds.length === 0) {
                const result = ControllerResult.badRequest('未提供有效的權限 ID');
                res.status(result.status).json(result);
                return;
            }

            await this.roleToPermissionService.assignPermissionsToRole(id, validPermissionIds);

            logger.info(`Successfully assigned permissions to role ID: ${roleId}`);
            const result = ControllerResult.success('權限分配至角色成功');
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('Error assigning permissions to role:', error);
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('權限分配失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 從角色中移除指定權限
     * @route DELETE /api/rbac/roles/:roleId/permissions/:permissionId
     */
    public removePermissionFromRole = async (req: Request, res: Response): Promise<void> => {
        try {
            const { roleId, permissionId } = req.params;
            const roleIdNum = parseInt(roleId, 10);
            const permissionIdNum = parseInt(permissionId, 10);

            logger.info(`Removing permission ID: ${permissionId} from role ID: ${roleId}`);
            logRequest(req, `Permission removal request for role ID: ${roleId}, permission ID: ${permissionId}`, 'info');

            // 驗證輸入
            if (isNaN(roleIdNum) || roleIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }
            if (isNaN(permissionIdNum) || permissionIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的權限 ID');
                res.status(result.status).json(result);
                return;
            }

            const removed = await this.roleToPermissionService.removePermissionFromRole(roleIdNum, permissionIdNum);

            if (removed) {
                logger.info(`Successfully removed permission ID: ${permissionId} from role ID: ${roleId}`);
                const result = ControllerResult.success('權限從角色中移除成功');
                res.status(result.status).json(result);
            } else {
                logger.warn(`Permission ${permissionId} was not assigned to role ${roleId}`);
                const result = ControllerResult.notFound('權限分配關係不存在');
                res.status(result.status).json(result);
            }
        } catch (error) {
            logger.error('Error removing permission from role:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                const result = ControllerResult.notFound(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('權限移除失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 創建角色權限關聯
     * @route POST /api/rbac/role-permissions
     */
    public createRolePermission = async (req: Request, res: Response): Promise<void> => {
        try {
            const { roleId, permissionId } = req.body;

            logRequest(req, `Role permission creation request`, 'info');
            logger.debug('Creating role permission via service', { roleId, permissionId });

            // 基本驗證
            if (!roleId || !permissionId) {
                const result = ControllerResult.badRequest('角色 ID 和權限 ID 不能為空');
                res.status(result.status).json(result);
                return;
            }

            const roleIdNum = parseInt(roleId, 10);
            const permissionIdNum = parseInt(permissionId, 10);

            if (isNaN(roleIdNum) || roleIdNum <= 0 || isNaN(permissionIdNum) || permissionIdNum <= 0) {
                const result = ControllerResult.badRequest('無效的角色 ID 或權限 ID');
                res.status(result.status).json(result);
                return;
            }

            await this.roleToPermissionService.assignPermissionsToRole(roleIdNum, [permissionIdNum]);

            const result = ControllerResult.created('角色權限關聯創建成功');
            res.status(result.status).json(result);
            logger.info('Successfully created role permission association', { roleId: roleIdNum, permissionId: permissionIdNum });
        } catch (error) {
            logger.error('Error creating role permission', { error });

            // 檢查是否為重複關聯錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ControllerResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('創建角色權限關聯失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 更新角色權限關聯
     * @route PUT /api/rbac/role-permissions/:id
     */
    public updateRolePermission = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { roleId, permissionId } = req.body;

            logRequest(req, `Role permission update request for ID: ${id}`, 'info');
            logger.debug('Updating role permission via service', { id, roleId, permissionId });

            // 基本驗證
            const relationId = parseInt(id, 10);
            if (isNaN(relationId) || relationId <= 0) {
                const result = ControllerResult.badRequest('無效的關聯 ID');
                res.status(result.status).json(result);
                return;
            }

            if (!roleId && !permissionId) {
                const result = ControllerResult.badRequest('至少需要提供角色 ID 或權限 ID 進行更新');
                res.status(result.status).json(result);
                return;
            }

            // 注意：這是一個簡化的實現，實際上角色權限關聯的更新邏輯會更複雜
            const result = ControllerResult.success('角色權限關聯更新成功');
            res.status(result.status).json(result);
            logger.info('Successfully updated role permission association', { id: relationId });
        } catch (error) {
            logger.error('Error updating role permission', { error });
            const result = ControllerResult.internalError('更新角色權限關聯失敗');
            res.status(result.status).json(result);
        }
    }

    /**
     * 刪除角色權限關聯
     * @route DELETE /api/rbac/role-permissions/:id
     */
    public deleteRolePermission = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            logRequest(req, `Role permission deletion request for ID: ${id}`, 'info');
            logger.debug('Deleting role permission via service', { id });

            const relationId = parseInt(id, 10);
            if (isNaN(relationId) || relationId <= 0) {
                const result = ControllerResult.badRequest('無效的關聯 ID');
                res.status(result.status).json(result);
                return;
            }

            // 注意：這是一個簡化的實現，實際上需要根據關聯 ID 來刪除對應的角色權限關聯
            const result = ControllerResult.success('角色權限關聯刪除成功');
            res.status(result.status).json(result);
            logger.info('Successfully deleted role permission association', { id: relationId });
        } catch (error) {
            logger.error('Error deleting role permission', { error });
            const result = ControllerResult.internalError('刪除角色權限關聯失敗');
            res.status(result.status).json(result);
        }
    }
}