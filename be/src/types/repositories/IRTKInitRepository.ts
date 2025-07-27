/**
 * @fileoverview RTK 初始化資料存取層介面定義
 * 
 * 定義 RTK 初始化相關資料操作的標準介面，為 RTK 初始化資料存取層提供契約。
 * 此介面確保所有 RTK 初始化相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { RTKModel } from '../../models/RTKModel.js';

/**
 * RTK 初始化資料存取介面
 * 
 * 定義 RTK 初始化相關的資料操作方法，遵循介面隔離原則，
 * 只包含初始化階段所需的基本操作。
 * 
 * @interface IRTKInitRepository
 * @description 提供 RTK 資料初始化的標準操作介面
 * @version 1.0.0
 */
export interface IRTKInitRepository {
    /**
     * 統計 RTK 資料總筆數
     * 
     * 此方法用於檢查資料庫中現有的 RTK 資料筆數，
     * 通常在系統初始化前用來判斷是否需要匯入基準資料。
     * 
     * @returns {Promise<number>} 資料庫中 RTK 資料的總筆數
     * @throws {Error} 當資料庫連線失敗或查詢錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const repo: IRTKInitRepository = new RTKInitRepository();
     * const count = await repo.count();
     * if (count === 0) {
     *   console.log('尚未有 RTK 資料，需要進行初始化');
     * }
     * ```
     */
    count(): Promise<number>;
    
    /**
     * 批次建立多筆 RTK 定位資料
     * 
     * 此方法專門用於大量資料的批次插入操作，提升資料匯入效率。
     * 適用於系統初始化時一次性匯入大量的 RTK 基站或校正點資料。
     * 
     * @param {Array<{latitude: number, longitude: number}>} data 包含緯度和經度的座標資料陣列
     * @param data[].latitude 緯度座標（-90 到 90 之間的浮點數）
     * @param data[].longitude 經度座標（-180 到 180 之間的浮點數）
     * @returns {Promise<RTKModel[]>} 成功建立的 RTK 資料模型陣列
     * @throws {Error} 當資料格式錯誤、座標值超出範圍或資料庫操作失敗時拋出異常
     * 
     * @example
     * ```typescript
     * const repo: IRTKInitRepository = new RTKInitRepository();
     * const coordinates = [
     *   { latitude: 25.033964, longitude: 121.564468 }, // 台北101
     *   { latitude: 25.047924, longitude: 121.517081 }  // 台北車站
     * ];
     * const results = await repo.bulkCreate(coordinates);
     * console.log(`成功建立 ${results.length} 筆 RTK 資料`);
     * ```
     */
    bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKModel[]>;
}