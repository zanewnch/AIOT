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
export * from './common/PaginationDto';

// ===== 無人機即時狀態相關 DTO =====
export * from './droneRealTimeStatus/DroneRealTimeStatusResponseDto';

// ===== 便利類型別名 =====
export type {
    // 無人機即時狀態 DTO 類型
    DroneRealTimeStatusResponseDto,
    DroneRealTimeStatusDetailResponseDto,
    DroneHealthSummaryResponseDto,
    DroneRealTimeStatusListResponseDto
} from './droneRealTimeStatus/DroneRealTimeStatusResponseDto';