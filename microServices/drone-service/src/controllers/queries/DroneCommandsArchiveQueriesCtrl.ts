/**
 * @fileoverview 無人機指令歷史歸檔查詢控制器
 *
 * 此文件實作了無人機指令歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandsArchiveQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneCommandsArchiveQueriesSvc} from '../../services/queries/DroneCommandsArchiveQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {loggerDecorator} from '../../patterns/LoggerDecorator.js';

const logger = createLogger('DroneCommandsArchiveQueriesCtrl');

/**
 * 無人機指令歷史歸檔查詢控制器類別
 *
 * 專門處理無人機指令歷史歸檔相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandsArchiveQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class DroneCommandsArchiveQueriesCtrl {
    /**
     * 取得所有指令歷史歸檔資料
     * @route GET /api/drone-commands-archive/data
     */
    getAllCommandsArchive = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const archives = await this.queryService.getAllCommandsArchive(limit);
            const result = ResResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'getAllCommandsArchive')
    /**
     * 根據 ID 取得指令歷史歸檔資料
     * @route GET /api/drone-commands-archive/data/:id
     */
    getCommandArchiveById = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令歷史歸檔 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archive = await this.queryService.getCommandArchiveById(id);

            if (!archive) {
                const result = ResResult.notFound('找不到指定的指令歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('指令歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'getCommandArchiveById')
    /**
     * 根據無人機 ID 查詢指令歷史歸檔
     * @route GET /api/drone-commands-archive/data/drone/:droneId
     */
    getCommandArchivesByDroneId = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getCommandArchivesByDroneId(droneId, limit);
            const result = ResResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'getCommandArchivesByDroneId')
    /**
     * 根據時間範圍查詢指令歷史歸檔
     * @route GET /api/drone-commands-archive/data/time-range
     */
    getCommandArchivesByTimeRange = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);
            const limit = parseInt(req.query.limit as string) || 100;

            // 驗證日期參數
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getCommandArchivesByTimeRange(startTime, endTime, limit);
            const result = ResResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'getCommandArchivesByTimeRange')
    /**
     * 根據指令類型查詢歷史歸檔
     * @route GET /api/drone-commands-archive/data/command-type/:commandType
     */
    getCommandArchivesByType = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandType = req.params.commandType;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!commandType || typeof commandType !== 'string' || commandType.trim().length === 0) {
                const result = ResResult.badRequest('指令類型參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getCommandArchivesByType(commandType as any, limit);
            const result = ResResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'getCommandArchivesByType')
    /**
     * 根據指令狀態查詢歷史歸檔
     * @route GET /api/drone-commands-archive/data/status/:status
     */
    getCommandArchivesByStatus = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.params.status;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getCommandArchivesByStatus(status as any, limit);
            const result = ResResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'getCommandArchivesByStatus')

    constructor(
        @inject(TYPES.DroneCommandsArchiveQueriesSvc) private readonly queryService: DroneCommandsArchiveQueriesSvc
    ) {
    }
}