/**
 * @fileoverview 權限命令控制器
 *
 * 此文件實作了權限命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module PermissionCommandsCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import type {IPermissionCommandsService} from '../../types/services/IPermissionCommandsService.js';
import {createLogger, logRequest} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('PermissionCommandsCtrl');

/**
 * 權限命令控制器類別
 *
 * 專門處理權限相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class PermissionCommandsCtrl
 * @since 1.0.0
 */
@injectable()
export class PermissionCommandsCtrl {
    constructor(
        @inject(TYPES.PermissionCommandsSvc) private readonly permissionService: IPermissionCommandsService
    ) {
    }

    /**
     * 創建新權限
     * @route POST /api/rbac/permissions
     */
    public createPermission = async (req: Request, res: Response): Promise<void> => {
        try {
            const {name, description, resource, action} = req.body;

            // 基本驗證
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                const result = ResResult.badRequest('權限名稱不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Creating new permission: ${name}`, 'info');
            logger.debug('Creating new permission via service', {name, resource, action});

            const newPermission = await this.permissionService.createPermission({
                name: name.trim(),
                description: description?.trim() || ''
            });

            const result = ResResult.created('權限創建成功', newPermission);
            res.status(result.status).json(result);
            logger.info('Successfully created new permission', {
                permissionId: newPermission.id,
                name: newPermission.name
            });
        } catch (error) {
            logger.error('Error creating permission', {
                name: req.body?.name,
                error
            });

            // 檢查是否為重複權限錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('創建權限失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 更新權限資訊
     * @route PUT /api/rbac/permissions/:id
     */
    public updatePermission = async (req: Request, res: Response): Promise<void> => {
        try {
            const permissionId = parseInt(req.params.id);

            if (isNaN(permissionId)) {
                const result = ResResult.badRequest('無效的權限 ID');
                res.status(result.status).json(result);
                return;
            }

            const {name, description, resource, action} = req.body;

            logRequest(req, `Updating permission with ID: ${permissionId}`, 'info');
            logger.debug('Updating permission via service', {permissionId, name, resource, action});

            const updateData: any = {};
            if (name && typeof name === 'string' && name.trim().length > 0) {
                updateData.name = name.trim();
            }
            if (description !== undefined) {
                updateData.description = description?.trim() || '';
            }
            if (resource !== undefined) {
                updateData.resource = resource?.trim() || '';
            }
            if (action !== undefined) {
                updateData.action = action?.trim() || '';
            }

            // 如果沒有任何更新資料
            if (Object.keys(updateData).length === 0) {
                const result = ResResult.badRequest('沒有提供更新資料');
                res.status(result.status).json(result);
                return;
            }

            const updatedPermission = await this.permissionService.updatePermission(permissionId, updateData);

            if (!updatedPermission) {
                const result = ResResult.notFound('權限不存在');
                res.status(result.status).json(result);
                logger.warn(`Permission not found for update with ID: ${permissionId}`);
                return;
            }

            const result = ResResult.success('權限更新成功', updatedPermission);
            res.status(result.status).json(result);
            logger.info('Successfully updated permission', {
                permissionId,
                name: updatedPermission.name
            });
        } catch (error) {
            logger.error('Error updating permission', {
                permissionId: req.params.id,
                error
            });

            // 檢查是否為重複權限錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('更新權限失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 刪除權限
     * @route DELETE /api/rbac/permissions/:id
     */
    public deletePermission = async (req: Request, res: Response): Promise<void> => {
        try {
            const permissionId = parseInt(req.params.id);

            if (isNaN(permissionId)) {
                const result = ResResult.badRequest('無效的權限 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting permission with ID: ${permissionId}`, 'info');
            logger.debug('Deleting permission via service', {permissionId});

            const deleted = await this.permissionService.deletePermission(permissionId);

            if (!deleted) {
                const result = ResResult.notFound('權限不存在');
                res.status(result.status).json(result);
                logger.warn(`Permission not found for deletion with ID: ${permissionId}`);
                return;
            }

            const result = ResResult.success('權限刪除成功');
            res.status(result.status).json(result);
            logger.info('Successfully deleted permission', {permissionId});
        } catch (error) {
            logger.error('Error deleting permission', {
                permissionId: req.params.id,
                error
            });

            // 檢查是否為依賴性錯誤
            if (error instanceof Error && error.message.includes('無法刪除')) {
                const result = ResResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ResResult.internalError('刪除權限失敗');
                res.status(result.status).json(result);
            }
        }
    }
}