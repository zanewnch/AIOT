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
export { 
  useDroneCommandQuery,
  useAllDroneCommands,
  useDroneCommandById,
  useDroneCommandsByDroneId,
  usePendingCommandsByDroneId,
  useExecutingCommandByDroneId,
  useLatestDroneCommands,
  useFailedDroneCommands,
  useDroneCommandStatistics,
  useDroneCommandsByStatus,
  useDroneCommandsByType,
  useCreateCommand,
  useCreateBatchCommands,
  useExecuteCommand,
  useCancelCommand
} from './useDroneCommandQuery';
export { useDroneStatusQuery } from './useDroneStatusQuery';
export { useDronePositionsQuery } from './useDronePositionQuery';
export { usePermissionQuery } from './usePermissionQuery';
export { useRoleQuery } from './useRoleQuery';
export { useRTKQuery } from './useRTKQuery';
export { useInitQuery } from './useInitQuery';

// 其他專用 hooks
export * from './useArchiveTaskQuery';
export { useDroneCommandArchiveQuery, useGetAllCommandsArchive, useGetCommandsArchiveByDroneId, useGetLatestCommandsArchive } from './useDroneCommandArchiveQuery';
export { useDronePositionsArchiveQuery } from './useDronePositionsArchiveQuery';
export { useDroneStatusArchiveQuery } from './useDroneStatusArchiveQuery';
export * from './useUserPreferenceQuery';
export { 
  useDroneCommandQueueQuery,
  useGetAllQueues,
  useGetQueueById,
  useGetQueueStatistics,
  useCreateQueue,
  useUpdateQueue,
  useDeleteQueue,
  useStartQueue,
  usePauseQueue,
  useResetQueue,
  useAddCommandToQueue
} from './useDroneCommandQueueQuery';

// 地圖邏輯 hooks
export { useRealMapLogic } from './useRealMapLogic';
export { useSimulateMapLogic } from './useSimulateMapLogic';