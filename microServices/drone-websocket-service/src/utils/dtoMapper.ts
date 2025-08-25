/**
 * @fileoverview DTO 映射轉換工具
 * 
 * 統一管理 Model 到 DTO 的轉換邏輯，確保資料在各層間的一致性傳遞
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { DroneRealTimeStatusModel } from '../models/DroneRealTimeStatusModel.js';
import { DroneRealTimeStatusResponseDto, PaginatedListResponseDto, PaginationResponseDto } from '../dto/index.js';
import type { PaginatedResult } from '../repo/queries/DroneRealTimeStatusQueriesRepository.js';

/**
 * DTO 映射器類別
 * 
 * 提供 Model 到 DTO 的標準化轉換方法
 */
export class DtoMapper {

    /**
     * 將 DroneRealTimeStatusModel 轉換為 DroneRealTimeStatusResponseDto
     */
    static toDroneRealTimeStatusResponseDto = (model: DroneRealTimeStatusModel): DroneRealTimeStatusResponseDto => {
        return {
            id: model.id?.toString() || '',
            droneId: model.drone_id?.toString() || '',
            currentStatus: model.current_status || '',
            batteryLevel: model.current_battery_level || 0,
            signalStrength: model.signal_strength || 0,
            isConnected: model.is_connected || false,
            lastSeen: model.last_seen?.toISOString() || new Date().toISOString(),
            createdAt: model.createdAt?.toISOString() || '',
            updatedAt: model.updatedAt?.toISOString() || ''
        };
    };

    /**
     * 將 DroneRealTimeStatusModel 陣列轉換為 DTO 陣列
     */
    static toDroneRealTimeStatusResponseDtoArray = (models: DroneRealTimeStatusModel[]): DroneRealTimeStatusResponseDto[] => {
        return models.map(model => DtoMapper.toDroneRealTimeStatusResponseDto(model));
    };

    /**
     * 將分頁結果轉換為分頁 DTO
     */
    static toPaginatedDroneRealTimeStatusResponse = (
        result: PaginatedResult<DroneRealTimeStatusModel>
    ): any => {
        const dtoArray = DtoMapper.toDroneRealTimeStatusResponseDtoArray(result.data);
        const pagination = {
            currentPage: result.currentPage,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / result.pageSize),
            hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
            hasPrevious: result.currentPage > 1
        };

        return {
            data: dtoArray,
            pagination
        };
    };
}

// ===== 便利導出方法 =====
export const toDroneRealTimeStatusDto = DtoMapper.toDroneRealTimeStatusResponseDto;
export const toDroneRealTimeStatusDtoArray = DtoMapper.toDroneRealTimeStatusResponseDtoArray;
export const toPaginatedDroneRealTimeStatusResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse;