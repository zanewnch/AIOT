/**
 * @fileoverview 無人機即時狀態查詢控制器
 * 
 * 實現無人機即時狀態相關的所有查詢操作，包含 CRUD 的 Read 操作
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../../container/types.js';
import { DroneRealTimeStatusQueriesSvc } from '../../services/queries/DroneRealTimeStatusQueriesSvc.js';
import { IDroneRealTimeStatusQueries } from '../../types/controllers/queries/IDroneRealTimeStatusQueries.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import { ApiResponse } from '../../types/ApiResponseType.js';
import { PaginationRequest } from '../../types/PaginationTypes.js';

/**
 * 無人機即時狀態查詢控制器實現
 * 
 * 負責處理所有與無人機即時狀態查詢相關的 HTTP 請求
 */
@injectable()
export class DroneRealTimeStatusQueriesCtrl implements IDroneRealTimeStatusQueries {

    constructor(
        @inject(TYPES.IDroneRealTimeStatusQueriesSvc) 
        private droneRealTimeStatusQueriesSvc: DroneRealTimeStatusQueriesSvc
    ) {}

    /**
     * 獲取單個無人機即時狀態
     */
    getDroneRealTimeStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            
            if (!id) {
                const errorResponse: ApiResponse = {
                    status: 400,
                    success: false,
                    message: '無人機即時狀態 ID 為必填',
                    error: 'ID parameter is required',
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }

            const droneRealTimeStatus = await this.droneRealTimeStatusQueriesSvc.getById(id);
            
            if (!droneRealTimeStatus) {
                const errorResponse: ApiResponse = {
                    status: 404,
                    success: false,
                    message: '無人機即時狀態不存在',
                    error: 'DroneRealTimeStatus not found',
                    timestamp: new Date().toISOString()
                };
                res.status(404).json(errorResponse);
                return;
            }

            const responseDto = DtoMapper.toDroneRealTimeStatusResponseDto(droneRealTimeStatus);
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '無人機即時狀態獲取成功',
                data: responseDto,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '獲取無人機即時狀態失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 獲取所有無人機即時狀態（支持分頁和過濾）
     */
    getAllDroneRealTimeStatuses = async (req: Request, res: Response): Promise<void> => {
        try {
            const paginationRequest: PaginationRequest = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: Math.min(parseInt(req.query.pageSize as string) || 10, 100),
                sortBy: req.query.sortBy as string || 'updatedAt',
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
            };

            const filters = {
                droneId: req.query.droneId as string,
                status: req.query.status as string
            };

            const result = await this.droneRealTimeStatusQueriesSvc.getAllWithPagination(
                paginationRequest,
                filters
            );

            const paginatedResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse(result);
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '無人機即時狀態列表獲取成功',
                data: paginatedResponse.data,
                pagination: paginatedResponse.pagination,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '獲取無人機即時狀態列表失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 根據無人機 ID 獲取即時狀態
     */
    getDroneRealTimeStatusByDroneId = async (req: Request, res: Response): Promise<void> => {
        try {
            const { droneId } = req.params;
            
            if (!droneId) {
                const errorResponse: ApiResponse = {
                    status: 400,
                    success: false,
                    message: '無人機 ID 為必填',
                    error: 'DroneId parameter is required',
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }

            const droneRealTimeStatus = await this.droneRealTimeStatusQueriesSvc.getByDroneId(droneId);
            
            if (!droneRealTimeStatus) {
                const errorResponse: ApiResponse = {
                    status: 404,
                    success: false,
                    message: '該無人機的即時狀態不存在',
                    error: 'DroneRealTimeStatus not found for this drone',
                    timestamp: new Date().toISOString()
                };
                res.status(404).json(errorResponse);
                return;
            }

            const responseDto = DtoMapper.toDroneRealTimeStatusResponseDto(droneRealTimeStatus);
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '無人機即時狀態獲取成功',
                data: responseDto,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '獲取無人機即時狀態失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 獲取多個無人機的即時狀態
     */
    getBatchDroneRealTimeStatuses = async (req: Request, res: Response): Promise<void> => {
        try {
            const { droneIds } = req.body;
            
            if (!droneIds || !Array.isArray(droneIds) || droneIds.length === 0) {
                const errorResponse: ApiResponse = {
                    status: 400,
                    success: false,
                    message: '無人機 ID 陣列為必填且不能為空',
                    error: 'DroneIds array is required and cannot be empty',
                    timestamp: new Date().toISOString()
                };
                res.status(400).json(errorResponse);
                return;
            }

            const droneRealTimeStatuses = await this.droneRealTimeStatusQueriesSvc.getBatchByDroneIds(droneIds);
            const responseDtos = DtoMapper.toDroneRealTimeStatusResponseDtoArray(droneRealTimeStatuses);
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '批量無人機即時狀態獲取成功',
                data: responseDtos,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '批量獲取無人機即時狀態失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 搜索無人機即時狀態
     */
    searchDroneRealTimeStatuses = async (req: Request, res: Response): Promise<void> => {
        try {
            const keyword = req.query.keyword as string;
            const paginationRequest: PaginationRequest = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: Math.min(parseInt(req.query.pageSize as string) || 10, 100)
            };

            const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

            const result = await this.droneRealTimeStatusQueriesSvc.searchWithPagination(
                keyword,
                paginationRequest,
                filters
            );

            const paginatedResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse(result);
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '無人機即時狀態搜索成功',
                data: paginatedResponse.data,
                pagination: paginatedResponse.pagination,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '搜索無人機即時狀態失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 獲取無人機即時狀態統計資訊
     */
    getDroneRealTimeStatusStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const statistics = await this.droneRealTimeStatusQueriesSvc.getStatistics();
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '無人機即時狀態統計獲取成功',
                data: statistics,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '獲取無人機即時狀態統計失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 獲取儀表板摘要資訊
     */
    getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
        try {
            const summary = await this.droneRealTimeStatusQueriesSvc.getDashboardSummary();
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '儀表板摘要獲取成功',
                data: summary,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '獲取儀表板摘要失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 獲取電池統計資訊
     */
    getBatteryStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const statistics = await this.droneRealTimeStatusQueriesSvc.getBatteryStatistics();
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '電池統計獲取成功',
                data: statistics,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '獲取電池統計失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 檢查無人機即時狀態服務健康狀態
     */
    checkHealth = async (req: Request, res: Response): Promise<void> => {
        try {
            const health = await this.droneRealTimeStatusQueriesSvc.checkHealth();
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '健康檢查成功',
                data: health,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '健康檢查失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };

    /**
     * 驗證無人機即時狀態資料完整性
     */
    validateDataIntegrity = async (req: Request, res: Response): Promise<void> => {
        try {
            const validation = await this.droneRealTimeStatusQueriesSvc.validateDataIntegrity();
            
            const successResponse: ApiResponse = {
                status: 200,
                success: true,
                message: '資料完整性驗證成功',
                data: validation,
                timestamp: new Date().toISOString()
            };
            
            res.status(200).json(successResponse);
        } catch (error) {
            const errorResponse: ApiResponse = {
                status: 500,
                success: false,
                message: '資料完整性驗證失敗',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(errorResponse);
        }
    };
}