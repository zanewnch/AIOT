/**
 * @fileoverview Utils 模組統一導出文件
 * 
 * 提供前端工具函數和類別的統一導入介面，簡化模組引用。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-08-18
 */

// 請求結果處理相關 - 本地實作
export { ReqResult } from './ReqResult';
export type { ApiResponseFormat } from '../types/ApiResponseTypes';

// HTTP 請求工具相關
export { ResUtils, resUtilsInstance } from './ResUtils';

// Google Maps 載入器相關
export { googleMapsLoader } from './GoogleMapsLoader';

/**
 * @example
 * ```typescript
 * // 使用統一導出
 * import { ReqResult, resUtilsInstance, googleMapsLoader } from '@/utils';
 * 
 * // 使用 API 客戶端
 * const result = await resUtilsInstance.getWithResult<User[]>('/users');
 * if (result.isSuccess()) {
 *   console.log('用戶列表:', result.data);
 * }
 * 
 * // 載入 Google Maps
 * await googleMapsLoader.load();
 * ```
 */