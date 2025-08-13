/**
 * @fileoverview 使用者命令控制器
 * 
 * 此文件實作了使用者命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module UserCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { UserCommandsSvc } from '../../services/commands/UserCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('UserCommands');

/**
 * 使用者命令控制器類別
 * 
 * 專門處理使用者相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class UserCommands
 * @since 1.0.0
 */
@injectable()
export class UserCommands {
    constructor(
        @inject(TYPES.UserCommandsSvc) private readonly userCommandsSvc: UserCommandsSvc
    ) {}

    /**
     * 創建新使用者
     * @route POST /api/rbac/users
     */
    public createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, email, password, confirmPassword } = req.body;

            // 基本驗證
            if (!username || !email || !password) {
                const result = ControllerResult.badRequest('缺少必要的使用者資訊');
                res.status(result.status).json(result);
                return;
            }

            if (password !== confirmPassword) {
                const result = ControllerResult.badRequest('密碼和確認密碼不匹配');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Creating new user: ${username}`, 'info');
            logger.debug('Creating new user via service', { username, email });

            const newUser = await this.userCommandsSvc.createUser({
                username,
                email,
                password
            });

            const result = ControllerResult.created('使用者創建成功', newUser);
            res.status(result.status).json(result);
            logger.info('Successfully created new user', { 
                userId: newUser.id, 
                username: newUser.username 
            });
        } catch (error) {
            logger.error('Error creating user', { 
                username: req.body?.username,
                email: req.body?.email,
                error 
            });

            // 檢查是否為重複使用者錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ControllerResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('創建使用者失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 更新使用者資訊
     * @route PUT /api/rbac/users/:id
     */
    public updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id);
            
            if (isNaN(userId)) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            const { username, email, password } = req.body;

            logRequest(req, `Updating user with ID: ${userId}`, 'info');
            logger.debug('Updating user via service', { userId, username, email });

            const updateData: any = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (password) updateData.password = password;

            const updatedUser = await this.userCommandsSvc.updateUser(userId, updateData);

            if (!updatedUser) {
                const result = ControllerResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                logger.warn(`User not found for update with ID: ${userId}`);
                return;
            }

            const result = ControllerResult.success('使用者更新成功', updatedUser);
            res.status(result.status).json(result);
            logger.info('Successfully updated user', { 
                userId,
                username: updatedUser.username 
            });
        } catch (error) {
            logger.error('Error updating user', { 
                userId: req.params.id,
                error 
            });

            // 檢查是否為重複使用者錯誤
            if (error instanceof Error && error.message.includes('已存在')) {
                const result = ControllerResult.conflict(error.message);
                res.status(result.status).json(result);
            } else {
                const result = ControllerResult.internalError('更新使用者失敗');
                res.status(result.status).json(result);
            }
        }
    }

    /**
     * 刪除使用者
     * @route DELETE /api/rbac/users/:id
     */
    public deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = parseInt(req.params.id);
            
            if (isNaN(userId)) {
                const result = ControllerResult.badRequest('無效的使用者 ID');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting user with ID: ${userId}`, 'info');
            logger.debug('Deleting user via service', { userId });

            const deleted = await this.userCommandsSvc.deleteUser(userId);

            if (!deleted) {
                const result = ControllerResult.notFound('使用者不存在');
                res.status(result.status).json(result);
                logger.warn(`User not found for deletion with ID: ${userId}`);
                return;
            }

            const result = ControllerResult.success('使用者刪除成功');
            res.status(result.status).json(result);
            logger.info('Successfully deleted user', { userId });
        } catch (error) {
            logger.error('Error deleting user', { 
                userId: req.params.id,
                error 
            });
            const result = ControllerResult.internalError('刪除使用者失敗');
            res.status(result.status).json(result);
        }
    }
}