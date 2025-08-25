/**
 * @fileoverview 無人機位置歷史歸檔命令控制器
 *
 * 此文件實作了無人機位置歷史歸檔命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DronePositionsArchiveCommandsController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import { DronePositionsArchiveCommandsService } from '../../services/commands/DronePositionsArchiveCommandsService.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import type {DronePositionsArchiveCreationAttributes} from '../../models/DronePositionsArchiveModel.js';

const logger = createLogger('DronePositionsArchiveCommandsController');

/**
 * 無人機位置歷史歸檔命令控制器類別
 *
 * 專門處理無人機位置歷史歸檔相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DronePositionsArchiveCommandsController
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveCommandsController {
    constructor(
        @inject(TYPES.DronePositionsArchiveCommandsService) private readonly archiveService: DronePositionsArchiveCommandsService
    ) {
    }

    /**
     * 創建位置歷史歸檔記錄
     * @route POST /api/drone-positions-archive/data
     */
    createPositionArchive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const archiveData: DronePositionsArchiveCreationAttributes = req.body;

            // 基本驗證
            if (!archiveData.drone_id || typeof archiveData.drone_id !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!archiveData.latitude || !archiveData.longitude) {
                const result = ResResult.badRequest('緯度和經度為必填項');
                res.status(result.status).json(result);
                return;
            }

            const createdArchive = await this.archiveService.createPositionArchive(archiveData);
            const result = ResResult.created('位置歷史歸檔記錄創建成功', createdArchive);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 批量創建位置歷史歸檔記錄
     * @route POST /api/drone-positions-archive/data/bulk
     */
    bulkCreatePositionArchives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const archivesData: DronePositionsArchiveCreationAttributes[] = req.body;

            // 基本驗證
            if (!Array.isArray(archivesData) || archivesData.length === 0) {
                const result = ResResult.badRequest('歸檔資料陣列不能為空');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每筆資料
            for (let i = 0; i < archivesData.length; i++) {
                const data = archivesData[i];
                if (!data.drone_id || !data.latitude || !data.longitude) {
                    const result = ResResult.badRequest(`第 ${i + 1} 筆資料格式不正確`);
                    res.status(result.status).json(result);
                    return;
                }
            }

            const createdArchives = await this.archiveService.bulkCreatePositionArchives(archivesData);
            const result = ResResult.created('批量位置歷史歸檔記錄創建成功', {
                created: createdArchives.length,
                data: createdArchives
            });

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 更新位置歷史歸檔資料
     * @route PUT /api/drone-positions-archive/data/:id
     */
    updatePositionArchive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DronePositionsArchiveCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                const result = ResResult.badRequest('更新資料不能為空');
                res.status(result.status).json(result);
                return;
            }

            const updatedArchive = await this.archiveService.updatePositionArchive(id, updateData);

            if (!updatedArchive) {
                const result = ResResult.notFound('找不到指定的位置歷史歸檔記錄');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('位置歷史歸檔資料更新成功', updatedArchive);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 刪除位置歷史歸檔資料
     * @route DELETE /api/drone-positions-archive/data/:id
     */
    deletePositionArchive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const isDeleted = await this.archiveService.deletePositionArchive(id);

            if (!isDeleted) {
                const result = ResResult.notFound('找不到指定的位置歷史歸檔記錄');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('位置歷史歸檔資料刪除成功');
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 刪除指定時間之前的歸檔資料
     * @route DELETE /api/drone-positions-archive/data/before/:beforeDate
     */
    deleteArchivesBeforeDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const beforeDate = new Date(req.params.beforeDate);

            if (isNaN(beforeDate.getTime())) {
                const result = ResResult.badRequest('無效的日期格式');
                res.status(result.status).json(result);
                return;
            }

            const deletedCount = await this.archiveService.deleteArchivesBeforeDate(beforeDate);
            const result = ResResult.success(`已刪除 ${deletedCount} 筆歷史歸檔記錄`, {deletedCount});

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 刪除指定批次的歸檔資料
     * @route DELETE /api/drone-positions-archive/data/batch/:batchId
     */
    deleteArchiveBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const batchId = req.params.batchId;

            if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
                const result = ResResult.badRequest('批次 ID 參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const deletedCount = await this.archiveService.deleteArchiveBatch(batchId);
            const result = ResResult.success(`已刪除批次 ${batchId} 的 ${deletedCount} 筆記錄`, {
                deletedCount,
                batchId
            });

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}