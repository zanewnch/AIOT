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
import {Request, Response} from 'express';
import {DroneCommandsArchiveQueriesSvc} from '../../services/queries/DroneCommandsArchiveQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

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
    
    constructor(
        @inject(TYPES.DroneCommandsArchiveQueriesSvc) private readonly queryService: DroneCommandsArchiveQueriesSvc
    ) {
    }

    /**
     * 分頁查詢所有指令歷史歸檔（新增統一方法）
     * @route GET /api/drone-commands-archive/data/paginated
     */
    getAllCommandsArchivePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getAllCommandsArchivePaginated(pagination);
            const result = ResResult.fromPaginatedResponse('指令歷史歸檔分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢指令歷史歸檔失敗', { error });
            const result = ResResult.internalError('分頁查詢指令歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢指令歷史歸檔（新增統一方法）
     * @route GET /api/drone-commands-archive/data/drone/:droneId/paginated
     */
    getCommandsArchiveByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
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
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getCommandsArchiveByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的指令歷史歸檔分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢指令歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢指令歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據指令類型分頁查詢歷史歸檔（新增統一方法）
     * @route GET /api/drone-commands-archive/data/command-type/:commandType/paginated
     */
    getCommandsArchiveByCommandTypePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const commandType = req.params.commandType;

            if (!commandType || typeof commandType !== 'string' || commandType.trim().length === 0) {
                const result = ResResult.badRequest('指令類型參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getCommandsArchiveByCommandTypePaginated(commandType, pagination);
            const result = ResResult.fromPaginatedResponse(
                `指令類型為 ${commandType} 的歷史歸檔分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據指令類型分頁查詢歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據指令類型分頁查詢歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢歷史歸檔（新增統一方法）
     * @route GET /api/drone-commands-archive/data/status/:status/paginated
     */
    getCommandsArchiveByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getCommandsArchiveByStatusPaginated(status, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的歷史歸檔分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據狀態分頁查詢歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據狀態分頁查詢歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

}