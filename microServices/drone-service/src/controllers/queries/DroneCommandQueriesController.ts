/**
 * @fileoverview 無人機指令查詢控制器
 *
 * 此文件實作了無人機指令查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {DroneCommandQueriesService} from "./../../services/commands/from.*Service.jsCommandsService.js"';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 無人機指令查詢控制器類別
 *
 * 專門處理無人機指令相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueriesController
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueriesController {
    constructor(
        @inject(TYPES.DroneCommandQueriesService) private readonly queryService: DroneCommandQueriesService
    ) {
    }

    /**
     * 分頁查詢所有無人機指令 (新增)
     * @route GET /api/drone-commands/data/paginated
     */
    getAllCommandsPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getAllCommandsPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('無人機指令分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('分頁查詢無人機指令失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢指令 (新增)
     * @route GET /api/drone-commands/data/drone/:droneId/paginated
     */
    getCommandsByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getCommandsByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 指令分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據無人機 ID 分頁查詢指令失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢指令 (新增)
     * @route GET /api/drone-commands/data/status/:status/paginated
     */
    getCommandsByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status) {
                const result = ResResult.badRequest('狀態參數為必填項');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getCommandsByStatusPaginated(status, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的指令分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            const result = ResResult.internalError('根據狀態分頁查詢指令失敗');
            res.status(result.status).json(result);
        }
    };

}