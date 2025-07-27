/**
 * @fileoverview RTK 初始化服務介面
 * 
 * 定義 RTK 定位系統初始化服務的標準介面。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - RTK 示範資料建立的標準方法定義
 * - 支援進度追蹤的初始化方法
 * - 大量測試資料生成功能
 * - 台灣地區基準定位點資料初始化
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import { ProgressCallback } from '../ProgressTypes.js';
import { ServiceResult } from '../../utils/ServiceResult.js';

/**
 * RTK 初始化服務介面
 * 
 * 定義 RTK 定位系統初始化服務的標準方法，包含示範資料建立、
 * 大量測試資料生成和進度追蹤功能。
 */
export interface IRTKInitService {
    /**
     * 建立 RTK 示範資料
     * 檢查資料庫中是否已有 RTK 資料，若無則建立 5000 筆隨機定位點資料進行壓力測試
     * 
     * @returns Promise<ServiceResult<{ count: number }>> 包含操作結果訊息和資料筆數
     * 
     * @example
     * ```typescript
     * const rtkService = new RTKInitService();
     * const result = await rtkService.seedRTKDemo();
     * 
     * if (result.success) {
     *   console.log(result.message); // "RTK demo data created successfully"
     *   console.log(`建立了 ${result.data.count} 筆 RTK 資料`);
     * }
     * ```
     * 
     * @remarks
     * 此方法會生成 5000 筆隨機的台灣地區經緯度座標供壓力測試使用：
     * - 緯度範圍：21.8 - 25.4 (台灣南北範圍)
     * - 經度範圍：119.3 - 122.0 (台灣東西範圍)
     * 
     * 若資料庫中已有 RTK 資料，則不會重複建立，並回傳現有資料筆數
     */
    seedRTKDemo(): Promise<ServiceResult<{ count: number }>>;

    /**
     * 建立 RTK 示範資料（支援進度回調）
     * 與 seedRTKDemo 相同功能，但支援進度追蹤回調
     * 
     * @param progressCallback 進度回調函數，用於追蹤初始化進度
     * @returns Promise<ServiceResult<{ count: number }>> 包含操作結果訊息和資料筆數
     * 
     * @example
     * ```typescript
     * const rtkService = new RTKInitService();
     * const result = await rtkService.seedRTKDemoWithProgress((progress) => {
     *   console.log(`進度: ${progress.percentage}% - ${progress.message}`);
     * });
     * 
     * if (result.success) {
     *   console.log(`RTK 資料初始化完成，共 ${result.data.count} 筆`);
     * }
     * ```
     * 
     * @remarks
     * 此方法提供與 seedRTKDemo 相同的功能，但額外支援：
     * - 即時進度回報
     * - 批次處理狀態通知
     * - 完成狀態確認
     * 
     * 進度回調會在每個批次處理時被調用，提供詳細的處理狀態資訊
     */
    seedRTKDemoWithProgress(progressCallback?: ProgressCallback): Promise<ServiceResult<{ count: number }>>;
}