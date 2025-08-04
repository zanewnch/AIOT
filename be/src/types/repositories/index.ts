/**
 * @fileoverview 資料存取層介面匯出模組
 * 
 * 統一匯出所有資料存取層相關的介面定義，方便其他模組使用。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

export type { IRoleRepository } from './IRoleRepository.js';
export type { IPermissionRepository } from './IPermissionRepository.js';
// export type { IProgressRepository } from './IProgressRepository.js'; // 已移除 Progress 功能
export type { ISessionRepository } from './ISessionRepository.js';
export type { IUserRepository } from './IUserRepository.js';
export type { IUserRoleRepository } from './IUserRoleRepository.js';
// export type { IRTKInitRepository } from './IRTKInitRepository.js'; // 已移除 RTK 功能
export type { IRolePermissionRepository } from './IRolePermissionRepository.js';
// export type { IRTKRepository } from './IRTKRepository.js'; // 已移除 RTK 功能