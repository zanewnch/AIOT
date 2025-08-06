/**
 * @fileoverview 查詢控制器統一導出
 * 
 * 此檔案統一導出所有查詢相關的控制器，
 * 遵循 CQRS 模式的查詢端，提供一致的導入介面。
 * 
 * @module QueryControllers
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

// 歸檔任務查詢控制器
export { ArchiveTaskQueries } from './ArchiveTaskQueriesCtrl.js';

// 使用者查詢控制器
export { UserQueries } from './UserQueriesCtrl.js';

// 角色查詢控制器
export { RoleQueries } from './RoleQueriesCtrl.js';

// 權限查詢控制器
export { PermissionQueries } from './PermissionQueriesCtrl.js';

// 認證查詢控制器
export { AuthQueries } from './AuthQueriesCtrl.js';

// Swagger 查詢控制器
export { SwaggerQueries } from './SwaggerQueriesCtrl.js';

// 使用者偏好設定查詢控制器
export { UserPreferenceQueries } from './UserPreferenceQueriesCtrl.js';

// 無人機相關查詢控制器
export { DroneStatusQueries } from './DroneStatusQueriesCtrl.js';
export { DronePositionQueries } from './DronePositionQueriesCtrl.js';
export { DroneRealTimeStatusQueries } from './DroneRealTimeStatusQueriesCtrl.js';
export { DroneCommandQueueQueries } from './DroneCommandQueueQueriesCtrl.js';
export { DroneCommandQueries } from './DroneCommandQueriesCtrl.js';

// 未來可以新增更多查詢控制器
// export { ReportQueries } from './ReportQueries.js';