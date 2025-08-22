/**
 * @fileoverview 角色命令控制器
 *
 * 此文件實作了角色命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module RoleCommandsCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import type {IRoleCommandsService} from '../../types/index.js';
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('RoleCommandsCtrl');

/**
 * 角色命令控制器類別
 *
 * 專門處理角色相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class RoleCommandsCtrl
 * @since 1.0.0
 */
@injectable()
export class RoleCommandsCtrl {
    constructor(
        @inject(TYPES.RoleCommandsSvc) private readonly roleCommandsService: IRoleCommandsService
    ) {
    }

    /**
     * 創建新角色
     * @route POST /api/rbac/roles
     */
    public createRole = async (req: Request, res: Response): Promise<void> => {
        try {
            const {name, description} = req.body;

            // 基本驗證
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                const result = ResResult.badRequest('角色名稱不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Creating new role: ${name}`, 'info');
            logger.debug('Creating new role via service', {name, description});

            const newRole = await this.roleCommandsService.createRole({
                name: name.trim(),
                displayName: description?.trim() || undefined
            });

            const result = ResResult.created('角色創建成功', newRole);
            res.status(result.status).json(result);
            logger.info('Successfully created new role', {
                roleId: newRole.id,
                name: newRole.name
            });
        } catch (error) {
            logger.error('Error creating role', {
                name: req.body?.name,
                error
            });

            // 檢查是否為重複角色錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('創建角色失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 更新角色資訊
     * @route PUT /api/rbac/roles/:id
     */
    public updateRole = async (req: Request, res: Response): Promise<void> => {
        try {
            const roleId = parseInt(req.params.id);

            if (isNaN(roleId)) {
                const result = ResResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            const {name, description} = req.body;

            logRequest(req, `Updating role with ID: ${roleId}`, 'info');
            logger.debug('Updating role via service', {roleId, name, description});

            const updateData: any = {};
            if (name && typeof name === 'string' && name.trim().length > 0) {
                updateData.name = name.trim();
            }
            if (description !== undefined) {
                updateData.displayName = description?.trim() || undefined;
            }

            // 如果沒有任何更新資料
            if (Object.keys(updateData).length === 0) {
                const result = ResResult.badRequest('沒有提供更新資料');
                res.status(result.status).json(result);
                return;
            }

            const updatedRole = await this.roleCommandsService.updateRole(roleId, updateData);

            if (!updatedRole) {
                const result = ResResult.notFound('角色不存在');
                res.status(result.status).json(result);
                logger.warn(`Role not found for update with ID: ${roleId}`);
                return;
            }

            const result = ResResult.success('角色更新成功', updatedRole);
            res.status(result.status).json(result);
            logger.info('Successfully updated role', {
                roleId,
                name: updatedRole.name
            });
        } catch (error) {
            logger.error('Error updating role', {
                roleId: req.params.id,
                error
            });

            // 檢查是否為重複角色錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('更新角色失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 刪除角色
     * @route DELETE /api/rbac/roles/:id
     */
    public deleteRole = async (req: Request, res: Response): Promise<void> => {
        try {
            const roleId = parseInt(req.params.id);

            if (isNaN(roleId)) {
                const result = ResResult.badRequest('無效的角色 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting role with ID: ${roleId}`, 'info');
            logger.debug('Deleting role via service', {roleId});

            const deleted = await this.roleCommandsService.deleteRole(roleId);

            if (!deleted) {
                const result = ResResult.notFound('角色不存在');
                res.status(result.status).json(result);
                logger.warn(`Role not found for deletion with ID: ${roleId}`);
                return;
            }

            const result = ResResult.success('角色刪除成功');
            res.status(result.status).json(result);
            logger.info('Successfully deleted role', {roleId});
        } catch (error) {
            logger.error('Error deleting role', {
                roleId: req.params.id,
                error
            });

            // 檢查是否為依賴性錯誤
            if (error instanceof Error && error.message.includes('無法刪除')) {
                const result = ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('刪除角色失敗');
                res.status(result.status).json(result);
            }
        }
    }
}