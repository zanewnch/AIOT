/**
 * @fileoverview 統一的 hooks 導出檔案
 * 
 * 導出所有自定義 hooks，提供統一的引用入口
 * 
 * @author AIOT Development Team
 */

// 主要查詢 hooks - 統一的 useXxxQuery 格式
export { AuthQuery, authQuery, useInitializeAuth, useLogin, useLogout } from './useAuthQuery';
export { 
  UserQuery, 
  userQuery, 
  useCurrentUser, 
  useCurrentUserSession, 
  useHasPermission, 
  useHasRole, 
  useUserInfo, 
  useRbacUsers, 
  useUserRoles, 
  useUpdateUser 
} from './useUserQuery';
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
export { 
  DroneStatusQuery,
  droneStatusQuery, 
  useDroneStatusQuery,
  useAllDroneStatuses,
  useDroneStatusById,
  useCreateDroneStatus,
  useUpdateDroneStatus,
  useDeleteDroneStatus
} from './useDroneStatusQuery';
export { 
  DronePositionQuery,
  dronePositionQuery,
  useDronePositionsQuery, 
  useAllDronePositions,
  useLatestDronePositions,
  useDronePositionById,
  useCreateDronePosition,
  useUpdateDronePosition,
  useDeleteDronePosition
} from './useDronePositionQuery';
export { 
  PermissionQuery,
  permissionQuery,
  usePermissionQuery,
  useAllPermissions,
  usePermissionById,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission
} from './usePermissionQuery';
export { 
  RoleQuery,
  roleQuery,
  useRoleQuery,
  useAllRoles,
  useRoleById,
  useRolePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissionsToRole
} from './useRoleQuery';
export { 
  RTKQuery,
  rtkQuery,
  useRTKQuery,
  useRTKData,
  useCreateRTKData,
  useUpdateRTKData,
  useDeleteRTKData
} from './useRTKQuery';

// 其他專用 hooks
export * from './useArchiveTaskQuery';
export { useDroneCommandArchiveQuery, useGetAllCommandsArchive, useGetCommandsArchiveByDroneId, useGetLatestCommandsArchive } from './useDroneCommandArchiveQuery';
export { 
  DronePositionsArchiveQuery,
  dronePositionsArchiveQuery,
  useDronePositionsArchiveQuery,
  useAllPositionArchives,
  useLatestPositionArchives,
  usePositionArchiveById,
  useCreatePositionArchive,
  useUpdatePositionArchive,
  useDeletePositionArchive
} from './useDronePositionsArchiveQuery';
export { 
  DroneStatusArchiveQuery,
  droneStatusArchiveQuery,
  useDroneStatusArchiveQuery,
  useAllStatusArchives,
  useLatestStatusArchives,
  useStatusArchiveById,
  useCreateStatusArchive,
  useUpdateStatusArchive,
  useDeleteStatusArchive
} from './useDroneStatusArchiveQuery';
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