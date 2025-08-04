/**
 * @fileoverview 統一的 hooks 導出檔案
 * 
 * 導出所有自定義 hooks，提供統一的引用入口
 * 
 * @author AIOT Development Team
 */

// 主要查詢 hooks - 統一的 useXxxQuery 格式
export { useAuthQuery } from './useAuthQuery';
export { useUserQuery } from './useUserQuery';
export { useDroneCommandQuery } from './useDroneCommandQuery';
export { useDroneStatusQuery } from './useDroneStatusQuery';
export { useDronePositionsQuery } from './useDronePositionQuery';
export { usePermissionQuery } from './usePermissionQuery';
export { useRoleQuery } from './useRoleQuery';
export { useRTKQuery } from './useRTKQuery';
export { useInitQuery } from './useInitQuery';

// 其他專用 hooks
export * from './useArchiveTaskQuery';
export { useDronePositionsArchiveQuery } from './useDronePositionsArchiveQuery';
export { useDroneStatusArchiveQuery } from './useDroneStatusArchiveQuery';
export * from './useUserPreferenceQuery';

// 地圖邏輯 hooks
export { useRealMapLogic } from './useRealMapLogic';
export { useSimulateMapLogic } from './useSimulateMapLogic';