/**
 * @fileoverview 無人機指令查詢控制器
 *
 * 此文件實作了無人機指令查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneCommandQueriesSvc} from '../../services/queries/DroneCommandQueriesSvc.js';
import {ResResult} from '@aiot/shared-packages';
import {TYPES} from '../../container/types.js';

/**
 * 無人機指令查詢控制器類別
 *
 * 專門處理無人機指令相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueriesCtrl {
    constructor(
        @inject(TYPES.DroneCommandQueriesSvc) private readonly queryService: DroneCommandQueriesSvc
    ) {
    }

    /**
     * 取得所有無人機指令
     * @route GET /api/drone-commands/data
     */
    getAllCommands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const commands = await this.queryService.getAllCommands(limit);
            const result = ResResult.success('無人機指令獲取成功', commands);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機指令
     * @route GET /api/drone-commands/data/:id
     */
    getCommandById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const command = await this.queryService.getCommandById(id);

            if (!command) {
                const result = ResResult.notFound('找不到指定的無人機指令');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機指令獲取成功', command);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機查詢指令
     * @route GET /api/drone-commands/data/drone/:droneId
     */
    getCommandsByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const commands = await this.queryService.getCommandsByDroneId(droneId, limit);
            const result = ResResult.success('無人機指令獲取成功', commands);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據狀態查詢指令
     * @route GET /api/drone-commands/data/status/:status
     */
    getCommandsByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.params.status;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const commands = await this.queryService.getCommandsByStatus(status as any, limit);
            const result = ResResult.success('無人機指令獲取成功', commands);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據類型查詢指令
     * @route GET /api/drone-commands/data/type/:type
     */
    getCommandsByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const type = req.params.type;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!type || typeof type !== 'string' || type.trim().length === 0) {
                const result = ResResult.badRequest('類型參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const commands = await this.queryService.getCommandsByType(type as any, limit);
            const result = ResResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得指令統計
     * @route GET /api/drone-commands/statistics
     */
    getCommandStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const statistics = await this.queryService.getCommandStatistics();
            const result = ResResult.success('無人機指令統計獲取成功', statistics);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得指令類型統計
     * @route GET /api/drone-commands/statistics/types
     */
    getCommandTypeStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const typeStats = await this.queryService.getCommandTypeStatistics();
            const result = ResResult.success('無人機指令類型統計獲取成功', typeStats);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得無人機指令摘要
     * @route GET /api/drone-commands/summary/:droneId
     */
    getCommandSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const summary = await this.queryService.getDroneCommandSummary(droneId);
            const result = ResResult.success('無人機指令摘要獲取成功', summary);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得待執行的指令
     * @route GET /api/drone-commands/data/pending
     */
    getPendingCommands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const commands = await this.queryService.getLatestCommands(limit);
            const result = ResResult.success('待執行無人機指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得執行中的指令
     * @route GET /api/drone-commands/data/executing
     */
    getExecutingCommands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const commands = await this.queryService.getLatestCommands(limit);
            const result = ResResult.success('執行中無人機指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得最新的指令記錄
     * @route GET /api/drone-commands/data/latest
     */
    getLatestCommands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const commands = await this.queryService.getLatestCommands(limit);
            const result = ResResult.success('最新指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得失敗的指令
     * @route GET /api/drone-commands/data/failed
     */
    getFailedCommands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const commands = await this.queryService.getFailedCommands(limit);
            const result = ResResult.success('失敗指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據發送者查詢指令
     * @route GET /api/drone-commands/data/issued-by/:userId
     */
    getCommandsByIssuedBy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const issuedBy = parseInt(req.params.userId);
            const limit = parseInt(req.query.limit as string) || 50;

            // 驗證 issuedBy 參數
            if (isNaN(issuedBy)) {
                const result = ResResult.badRequest('無效的用戶 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const commands = await this.queryService.getCommandsByIssuedBy(issuedBy, limit);
            const result = ResResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢指令
     * @route GET /api/drone-commands/data/date-range
     */
    getCommandsByDateRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            const limit = parseInt(req.query.limit as string) || 100;

            // 驗證日期參數
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                const result = ResResult.badRequest('無效的日期格式');
                res.status(result.status).json(result);
                return;
            }

            const commands = await this.queryService.getCommandsByDateRange(startDate, endDate, limit);
            const result = ResResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得無人機的待執行指令
     * @route GET /api/drone-commands/data/drone/:droneId/pending
     */
    getPendingCommandsByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 droneId 參數
            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const commands = await this.queryService.getPendingCommandsByDroneId(droneId);
            const result = ResResult.success('待執行指令獲取成功', commands);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得正在執行的指令
     * @route GET /api/drone-commands/data/drone/:droneId/executing
     */
    getExecutingCommandByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 droneId 參數
            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const command = await this.queryService.getExecutingCommandByDroneId(droneId);
            const result = ResResult.success('執行中指令獲取成功', command);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得無人機指令執行摘要
     * @route GET /api/drone-commands/summary/:droneId
     */
    getDroneCommandSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 droneId 參數
            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const summary = await this.queryService.getDroneCommandSummary(droneId);
            const result = ResResult.success('無人機指令摘要獲取成功', summary);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

}