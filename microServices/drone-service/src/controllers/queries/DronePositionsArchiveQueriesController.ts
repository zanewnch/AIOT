/**
 * @fileoverview 無人機位置歷史歸檔查詢控制器
 *
 * 此文件實作了無人機位置歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionsArchiveQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import { DronePositionsArchiveQueriesService } from '../../services/queries/DronePositionsArchiveQueriesService.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

const logger = createLogger('DronePositionsArchiveQueriesController');

/**
 * 無人機位置歷史歸檔查詢控制器類別
 *
 * 專門處理無人機位置歷史歸檔相關的查詢請求，包含取得歷史資料、統計分析等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionsArchiveQueriesController
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveQueriesController {
    constructor(
        @inject(TYPES.DronePositionsArchiveQueriesService) private readonly archiveService: DronePositionsArchiveQueriesService
    ) {
    }

    /**
     * 分頁查詢所有位置歷史歸檔（新增統一方法）
     * @route GET /api/drone-positions-archive/data/paginated
     */
    getAllPositionsArchivePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.archiveService.getAllPositionsArchivePaginated(pagination);
            const result = ResResult.fromPaginatedResponse('位置歷史歸檔分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢位置歷史歸檔失敗', { error });
            const result = ResResult.internalError('分頁查詢位置歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢位置歷史歸檔（新增統一方法）
     * @route GET /api/drone-positions-archive/data/drone/:droneId/paginated
     */
    getPositionsArchiveByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
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
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.archiveService.getPositionsArchiveByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的位置歷史歸檔分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢位置歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢位置歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據批次 ID 分頁查詢位置歷史歸檔（新增統一方法）
     * @route GET /api/drone-positions-archive/data/batch/:batchId/paginated
     */
    getPositionsArchiveByBatchIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const batchId = req.params.batchId;

            if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
                const result = ResResult.badRequest('批次 ID 參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.archiveService.getPositionsArchiveByBatchIdPaginated(batchId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `批次 ${batchId} 的位置歷史歸檔分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據批次 ID 分頁查詢位置歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據批次 ID 分頁查詢位置歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據時間範圍分頁查詢位置歷史歸檔（新增統一方法）
     * @route GET /api/drone-positions-archive/data/time-range/paginated
     */
    getPositionsArchiveByTimeRangePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            // 驗證日期參數
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.archiveService.getPositionsArchiveByTimeRangePaginated(startTime, endTime, pagination);
            const result = ResResult.fromPaginatedResponse(
                '時間範圍內的位置歷史歸檔分頁查詢成功', 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據時間範圍分頁查詢位置歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據時間範圍分頁查詢位置歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };


}