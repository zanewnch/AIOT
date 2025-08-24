/**
 * @fileoverview DTO (Data Transfer Object) 統一導出
 * 
 * 統一管理所有的資料傳輸物件，包含請求、回應和驗證邏輯。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

// ===== 基礎 DTO =====
export * from './common/BaseDto';
export * from './common/PaginationDto';

// ===== 歸檔任務相關 DTO =====
export * from './archiveTask/ArchiveTaskRequestDto';

// ===== 無人機指令相關 DTO =====
export * from './droneCommand/DroneCommandRequestDto';
export * from './droneCommand/DroneCommandResponseDto';

// ===== 無人機狀態相關 DTO =====
export * from './droneStatus/DroneStatusRequestDto';
export * from './droneStatus/DroneStatusResponseDto';

// ===== 無人機位置相關 DTO =====
export * from './dronePosition/DronePositionRequestDto';
export * from './dronePosition/DronePositionResponseDto';

// ===== 無人機指令佇列相關 DTO =====
export * from './droneCommandQueue/DroneCommandQueueRequestDto';
export * from './droneCommandQueue/DroneCommandQueueResponseDto';

// ===== 無人機即時狀態相關 DTO =====
export * from './droneRealTimeStatus/DroneRealTimeStatusRequestDto';
export * from './droneRealTimeStatus/DroneRealTimeStatusResponseDto';

// ===== 便利類型別名 =====
// Types are automatically exported through the module exports above