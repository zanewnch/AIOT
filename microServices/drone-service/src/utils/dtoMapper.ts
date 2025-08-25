/**
 * @fileoverview DTO 映射轉換工具
 * 
 * 統一管理 Model 到 DTO 的轉換邏輯，確保資料在各層間的一致性傳遞
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { DroneCommandModel } from '../models/DroneCommandModel.js';
import { ArchiveTaskModel } from '../models/ArchiveTaskModel.js';
import { DronePositionModel } from '../models/DronePositionModel.js';
import { DroneStatusModel } from '../models/DroneStatusModel.js';
import { DroneCommandsArchiveModel } from '../models/DroneCommandsArchiveModel.js';
import { DronePositionsArchiveModel } from '../models/DronePositionsArchiveModel.js';
import { DroneRealTimeStatusModel } from '../models/DroneRealTimeStatusModel.js';
import { DroneStatusArchiveModel } from '../models/DroneStatusArchiveModel.js';
import { DroneCommandResponseDto } from '../dto/index.js';
import { PaginatedListResponseDto, PaginationResponseDto } from '../dto/index.js';
import type { PaginatedResult } from.*Repositorysitorysitory.js';

/**
 * DTO 映射器類別
 * 
 * 提供 Model 到 DTO 的標準化轉換方法
 */
export class DtoMapper {

  /**
   * 將 DroneCommandModel 轉換為 DroneCommandResponseDto
   */
  static toDroneCommandResponseDto = (model: DroneCommandModel): any => {
    return {
      id: model.id?.toString(),
      droneId: model.drone_id?.toString(),
      commandType: model.command_type,
      status: model.status,
      priority: 1,
      description: model.error_message || '',
      userId: model.issued_by?.toString(),
      scheduledAt: model.issued_at?.toISOString(),
      executedAt: model.executed_at?.toISOString(),
      completedAt: model.completed_at?.toISOString(),
      executorId: model.issued_by?.toString(),
      progress: 0,
      createdAt: model.createdAt?.toISOString(),
      updatedAt: model.updatedAt?.toISOString()
    };
  };

  /**
   * 將 DroneCommandModel 陣列轉換為 DroneCommandResponseDto 陣列
   */
  static toDroneCommandResponseDtoArray = (models: DroneCommandModel[]): any[] => {
    return models.map(this.toDroneCommandResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DTO
   */
  static toPaginatedDroneCommandResponse = (
    result: PaginatedResult<DroneCommandModel>
  ): any => {
    const dtoArray = this.toDroneCommandResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將分頁查詢結果轉換為分頁 DroneCommandQueue DTO
   * 重複使用 DroneCommand 的結構，因為它們基本相同
   */
  static toPaginatedDroneCommandQueueResponse = (
    result: PaginatedResult<DroneCommandModel>
  ): any => {
    const dtoArray = this.toDroneCommandResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 通用分頁轉換方法
   * 
   * @param result 分頁查詢結果
   * @param mapperFn 單個實體的轉換函數
   */
  static toPaginatedResponse = <TModel, TDto>(
    result: PaginatedResult<TModel>,
    mapperFn: (model: TModel) => TDto
  ): any => {
    const dtoArray = result.data.map(mapperFn);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 ArchiveTaskModel 轉換為 ArchiveTaskResponseDto
   */
  static toArchiveTaskResponseDto = (model: ArchiveTaskModel): any => {
    return {
      id: model.id?.toString(),
      jobType: model.job_type,
      status: model.status,
      priority: 1,
      description: model.error_message || '',
      batchId: model.batch_id,
      progress: 0,
      scheduledAt: model.createdAt?.toISOString(),
      startedAt: model.createdAt?.toISOString(),
      completedAt: model.updatedAt?.toISOString(),
      executorId: model.created_by?.toString(),
      createdAt: model.createdAt?.toISOString(),
      updatedAt: model.updatedAt?.toISOString()
    };
  };

  /**
   * 將 ArchiveTaskModel 陣列轉換為 ArchiveTaskResponseDto 陣列
   */
  static toArchiveTaskResponseDtoArray = (models: ArchiveTaskModel[]): any[] => {
    return models.map(DtoMapper.toArchiveTaskResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 ArchiveTask DTO
   */
  static toPaginatedArchiveTaskResponse = (
    result: PaginatedResult<ArchiveTaskModel>
  ): any => {
    const dtoArray = DtoMapper.toArchiveTaskResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 DronePositionModel 轉換為 DronePositionResponseDto
   */
  static toDronePositionResponseDto = (model: DronePositionModel): any => {
    return {
      id: model.id?.toString(),
      droneId: model.drone_id?.toString(),
      latitude: model.latitude,
      longitude: model.longitude,
      altitude: model.altitude,
      speed: model.speed,
      heading: model.heading,
      batteryLevel: model.battery_level,
      signalStrength: model.signal_strength,
      timestamp: model.timestamp?.toISOString(),
      createdAt: model.createdAt?.toISOString(),
      updatedAt: model.updatedAt?.toISOString()
    };
  };

  /**
   * 將 DronePositionModel 陣列轉換為 DronePositionResponseDto 陣列
   */
  static toDronePositionResponseDtoArray = (models: DronePositionModel[]): any[] => {
    return models.map(DtoMapper.toDronePositionResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DronePosition DTO
   */
  static toPaginatedDronePositionResponse = (
    result: PaginatedResult<DronePositionModel>
  ): any => {
    const dtoArray = DtoMapper.toDronePositionResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 DroneStatusModel 轉換為 DroneStatusResponseDto
   */
  static toDroneStatusResponseDto = (model: DroneStatusModel): any => {
    return {
      id: model.id?.toString(),
      droneName: model.drone_name,
      droneSerial: model.drone_serial,
      droneType: '',
      manufacturer: model.manufacturer,
      model: model.model,
      firmwareVersion: '',
      status: model.status,
      batteryLevel: model.battery_capacity || 0,
      lastHeartbeat: model.updatedAt?.toISOString(),
      location: '',
      ownerUserId: model.owner_user_id?.toString(),
      registrationDate: model.createdAt?.toISOString(),
      lastMaintenanceDate: model.updatedAt?.toISOString(),
      notes: '',
      maxAltitude: model.max_altitude,
      maxRange: model.max_range,
      batteryCapacity: model.battery_capacity,
      weight: model.weight,
      createdAt: model.createdAt?.toISOString(),
      updatedAt: model.updatedAt?.toISOString()
    };
  };

  /**
   * 將 DroneStatusModel 陣列轉換為 DroneStatusResponseDto 陣列
   */
  static toDroneStatusResponseDtoArray = (models: DroneStatusModel[]): any[] => {
    return models.map(DtoMapper.toDroneStatusResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DroneStatus DTO
   */
  static toPaginatedDroneStatusResponse = (
    result: PaginatedResult<DroneStatusModel>
  ): any => {
    const dtoArray = DtoMapper.toDroneStatusResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 DroneCommandsArchiveModel 轉換為 DroneCommandsArchiveResponseDto
   */
  static toDroneCommandsArchiveResponseDto = (model: DroneCommandsArchiveModel): any => {
    return {
      id: model.id?.toString(),
      originalCommandId: model.original_id?.toString(),
      droneId: model.drone_id?.toString(),
      commandType: model.command_type,
      commandParameters: model.command_data,
      status: model.status,
      issuedBy: model.issued_by?.toString(),
      issuedAt: model.issued_at?.toISOString(),
      startedAt: model.executed_at?.toISOString(),
      completedAt: model.completed_at?.toISOString(),
      errorMessage: model.error_message,
      executionDuration: null,
      result: null,
      archiveReason: model.archive_batch_id,
      createdAt: model.created_at?.toISOString(),
      updatedAt: model.created_at?.toISOString()
    };
  };

  /**
   * 將 DroneCommandsArchiveModel 陣列轉換為 DroneCommandsArchiveResponseDto 陣列
   */
  static toDroneCommandsArchiveResponseDtoArray = (models: DroneCommandsArchiveModel[]): any[] => {
    return models.map(DtoMapper.toDroneCommandsArchiveResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DroneCommandsArchive DTO
   */
  static toPaginatedDroneCommandsArchiveResponse = (
    result: PaginatedResult<DroneCommandsArchiveModel>
  ): any => {
    const dtoArray = DtoMapper.toDroneCommandsArchiveResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 DronePositionsArchiveModel 轉換為 DronePositionsArchiveResponseDto
   */
  static toDronePositionsArchiveResponseDto = (model: DronePositionsArchiveModel): any => {
    return {
      id: model.id?.toString(),
      originalId: model.original_id?.toString(),
      droneId: model.drone_id?.toString(),
      latitude: model.latitude,
      longitude: model.longitude,
      altitude: model.altitude,
      timestamp: model.timestamp?.toISOString(),
      speed: model.speed,
      heading: model.heading,
      batteryLevel: model.battery_level,
      archiveBatchId: model.archive_batch_id,
      archivedAt: model.archived_at?.toISOString(),
      createdAt: model.created_at?.toISOString()
    };
  };

  /**
   * 將 DronePositionsArchiveModel 陣列轉換為 DronePositionsArchiveResponseDto 陣列
   */
  static toDronePositionsArchiveResponseDtoArray = (models: DronePositionsArchiveModel[]): any[] => {
    return models.map(DtoMapper.toDronePositionsArchiveResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DronePositionsArchive DTO
   */
  static toPaginatedDronePositionsArchiveResponse = (
    result: PaginatedResult<DronePositionsArchiveModel>
  ): any => {
    const dtoArray = DtoMapper.toDronePositionsArchiveResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 DroneRealTimeStatusModel 轉換為 DroneRealTimeStatusResponseDto
   */
  static toDroneRealTimeStatusResponseDto = (model: DroneRealTimeStatusModel): any => {
    return {
      id: model.id?.toString(),
      droneId: model.drone_id?.toString(),
      currentBatteryLevel: model.current_battery_level,
      currentStatus: model.current_status,
      lastSeen: model.last_seen?.toISOString(),
      currentAltitude: model.current_altitude,
      currentSpeed: model.current_speed,
      currentHeading: model.current_heading,
      signalStrength: model.signal_strength,
      isConnected: model.is_connected,
      errorMessage: model.error_message,
      temperature: model.temperature,
      flightTimeToday: model.flight_time_today,
      createdAt: model.createdAt?.toISOString(),
      updatedAt: model.updatedAt?.toISOString()
    };
  };

  /**
   * 將 DroneRealTimeStatusModel 陣列轉換為 DroneRealTimeStatusResponseDto 陣列
   */
  static toDroneRealTimeStatusResponseDtoArray = (models: DroneRealTimeStatusModel[]): any[] => {
    return models.map(DtoMapper.toDroneRealTimeStatusResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DroneRealTimeStatus DTO
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
    
    return { data: dtoArray, pagination };
  };

  /**
   * 將 DroneStatusArchiveModel 轉換為 DroneStatusArchiveResponseDto
   */
  static toDroneStatusArchiveResponseDto = (model: DroneStatusArchiveModel): any => {
    return {
      id: model.id?.toString(),
      droneId: model.drone_id?.toString(),
      currentStatus: model.current_status,
      batteryLevel: model.current_battery_level,
      lastPosition: '', // Model doesn't have this property
      lastSeen: model.last_seen?.toISOString(),
      totalFlightHours: 0, // Model doesn't have this property
      isActive: model.is_connected,
      errorMessage: '', // Model doesn't have this property
      archivedAt: model.archived_at?.toISOString(),
      timestamp: model.created_at?.toISOString(),
      createdAt: model.created_at?.toISOString(),
      updatedAt: model.created_at?.toISOString() // Model doesn't have updatedAt
    };
  };

  /**
   * 將 DroneStatusArchiveModel 陣列轉換為 DroneStatusArchiveResponseDto 陣列
   */
  static toDroneStatusArchiveResponseDtoArray = (models: DroneStatusArchiveModel[]): any[] => {
    return models.map(DtoMapper.toDroneStatusArchiveResponseDto);
  };

  /**
   * 將分頁查詢結果轉換為分頁 DroneStatusArchive DTO
   */
  static toPaginatedDroneStatusArchiveResponse = (
    result: PaginatedResult<DroneStatusArchiveModel>
  ): any => {
    const dtoArray = DtoMapper.toDroneStatusArchiveResponseDtoArray(result.data);
    const pagination = {
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / result.pageSize),
      hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
      hasPrevious: result.currentPage > 1
    };
    
    return { data: dtoArray, pagination };
  };
}

/**
 * 導出便利函數
 */
export const toDroneCommandDto = DtoMapper.toDroneCommandResponseDto;
export const toDroneCommandDtoArray = DtoMapper.toDroneCommandResponseDtoArray;
export const toPaginatedDroneCommandResponse = DtoMapper.toPaginatedDroneCommandResponse;
export const toPaginatedDroneCommandQueueResponse = DtoMapper.toPaginatedDroneCommandQueueResponse;
export const toArchiveTaskDto = DtoMapper.toArchiveTaskResponseDto;
export const toArchiveTaskDtoArray = DtoMapper.toArchiveTaskResponseDtoArray;
export const toPaginatedArchiveTaskResponse = DtoMapper.toPaginatedArchiveTaskResponse;
export const toDronePositionDto = DtoMapper.toDronePositionResponseDto;
export const toDronePositionDtoArray = DtoMapper.toDronePositionResponseDtoArray;
export const toPaginatedDronePositionResponse = DtoMapper.toPaginatedDronePositionResponse;
export const toDroneStatusDto = DtoMapper.toDroneStatusResponseDto;
export const toDroneStatusDtoArray = DtoMapper.toDroneStatusResponseDtoArray;
export const toPaginatedDroneStatusResponse = DtoMapper.toPaginatedDroneStatusResponse;
export const toDroneCommandsArchiveDto = DtoMapper.toDroneCommandsArchiveResponseDto;
export const toDroneCommandsArchiveDtoArray = DtoMapper.toDroneCommandsArchiveResponseDtoArray;
export const toPaginatedDroneCommandsArchiveResponse = DtoMapper.toPaginatedDroneCommandsArchiveResponse;
export const toDronePositionsArchiveDto = DtoMapper.toDronePositionsArchiveResponseDto;
export const toDronePositionsArchiveDtoArray = DtoMapper.toDronePositionsArchiveResponseDtoArray;
export const toPaginatedDronePositionsArchiveResponse = DtoMapper.toPaginatedDronePositionsArchiveResponse;
export const toDroneRealTimeStatusDto = DtoMapper.toDroneRealTimeStatusResponseDto;
export const toDroneRealTimeStatusDtoArray = DtoMapper.toDroneRealTimeStatusResponseDtoArray;
export const toPaginatedDroneRealTimeStatusResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse;
export const toDroneStatusArchiveDto = DtoMapper.toDroneStatusArchiveResponseDto;
export const toDroneStatusArchiveDtoArray = DtoMapper.toDroneStatusArchiveResponseDtoArray;
export const toPaginatedDroneStatusArchiveResponse = DtoMapper.toPaginatedDroneStatusArchiveResponse;

// 通用分頁映射方法 - 適用於所有實體
export const createPaginatedResponse = <TModel>(
  result: PaginatedResult<TModel>,
  mapperFn: (model: TModel) => any
): any => {
  const dtoArray = result.data.map(mapperFn);
  const pagination = {
    currentPage: result.currentPage,
    pageSize: result.pageSize,
    totalCount: result.totalCount,
    totalPages: Math.ceil(result.totalCount / result.pageSize),
    hasNext: result.currentPage < Math.ceil(result.totalCount / result.pageSize),
    hasPrevious: result.currentPage > 1
  };
  
  return { data: dtoArray, pagination };
};