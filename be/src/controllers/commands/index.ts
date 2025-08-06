/**
 * @fileoverview 命令控制器統一導出
 * 
 * 此檔案統一導出所有命令相關的控制器，
 * 遵循 CQRS 模式的命令端，提供一致的導入介面。
 * 
 * @module CommandControllers
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

// 歸檔任務命令控制器
export { ArchiveTaskCommands } from './ArchiveTaskCommandsCtrl.js';

// 使用者命令控制器
export { UserCommands } from './UserCommandsCtrl.js';

// 角色命令控制器
export { RoleCommands } from './RoleCommandsCtrl.js';

// 權限命令控制器
export { PermissionCommands } from './PermissionCommandsCtrl.js';

// 認證命令控制器
export { AuthCommands } from './AuthCommandsCtrl.js';

// 使用者偏好設定命令控制器
export { UserPreferenceCommands } from './UserPreferenceCommandsCtrl.js';

// 無人機相關命令控制器
export { DroneStatusCommands } from './DroneStatusCommandsCtrl.js';
export { DronePositionCommands } from './DronePositionCommandsCtrl.js';
export { DroneRealTimeStatusCommands } from './DroneRealTimeStatusCommandsCtrl.js';
export { DroneCommandQueueCommands } from './DroneCommandQueueCommandsCtrl.js';
export { DroneCommandCommands } from './DroneCommandCommandsCtrl.js';

// 未來可以新增更多命令控制器
// export { SystemCommands } from './SystemCommands.js';