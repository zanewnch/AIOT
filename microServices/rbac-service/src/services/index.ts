/**
 * @fileoverview 服務層模組匯出檔案
 * 
 * 此檔案作為服務層的統一匯出入口點，提供對所有服務類別的存取。
 * 服務層負責處理業務邏輯、資料驗證、認證授權等核心功能。
 * 
 * 包含的服務：
 * - AuthService: 認證服務，處理使用者登入、登出、權限驗證
 * - RbacInitService: 角色基礎存取控制初始化服務
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-18
 */

// AuthService has been refactored to CQRS pattern - see AuthCommandsSvc and AuthQueriesSvc below

// 角色基礎存取控制初始化服務已移除 - 不再需要
// export { RbacInitService } from './RbacInitService.js';

// 匯出 CQRS 模式的使用者服務
export { UserQueriesSvc } from './queries/UserQueriesSvc.js';
export { UserCommandsSvc } from './commands/UserCommandsSvc.js';


// 匯出 CQRS 模式的會話服務
export { SessionQueriesSvc } from './queries/SessionQueriesSvc.js';
// SessionCommandsSvc 尚未實現
// export { SessionCommandsSvc } from './commands/SessionCommandsSvc.js';

