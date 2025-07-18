/**
 * @fileoverview RTK 初始化資料存取層
 * ===================================
 * 
 * 此檔案提供 RTK (Real-Time Kinematic) 定位資料的初始化相關資料存取功能。
 * 主要用於系統初始化階段的 RTK 資料處理，包含資料統計和批次建立功能。
 * 
 * 設計模式：
 * - 倉庫模式 (Repository Pattern)：封裝資料存取邏輯
 * - 介面隔離原則 (Interface Segregation Principle)：定義明確的操作介面
 * - 依賴倒置原則 (Dependency Inversion Principle)：依賴抽象而非具體實作
 * 
 * 性能考量：
 * - 使用 Sequelize 的 bulkCreate 方法進行批次操作，提升大量資料插入效率
 * - count() 方法直接使用資料庫層級的計數，避免載入所有資料到記憶體
 * 
 * 主要功能：
 * - 統計現有 RTK 資料筆數
 * - 批次建立多筆 RTK 定位資料
 * 
 * 使用情境：
 * - 系統初始化時檢查是否已有基準資料
 * - 匯入初始化的 RTK 基站或校正點資料
 * - 大量定位資料的快速插入作業
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2024-01-01
 */

// 引入 RTK 資料模型，用於資料庫操作
import { RTKDataModel } from '../models/RTKDataModel.js';

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
     * @returns {Promise<RTKDataModel[]>} 成功建立的 RTK 資料模型陣列
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
    bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKDataModel[]>;
}

/**
 * RTK 初始化資料存取實作類別
 * 
 * 實作 IRTKInitRepository 介面，提供具體的資料操作功能。
 * 採用倉庫模式設計，封裝所有與 RTK 資料初始化相關的資料存取邏輯。
 * 
 * @class RTKInitRepository
 * @implements {IRTKInitRepository}
 * @description RTK 初始化資料存取層的具體實作類別
 * @version 1.0.0
 */
export class RTKInitRepository implements IRTKInitRepository {
    /**
     * 統計 RTK 資料總筆數
     * 
     * 此方法直接使用 Sequelize 的 count() 方法進行資料庫層級的計數操作，
     * 不會將資料載入到記憶體中，因此具有優異的性能表現。
     * 主要用於檢查系統是否已有初始化資料。
     * 
     * @returns {Promise<number>} 資料庫中所有 RTK 資料的筆數
     * @throws {Error} 當資料庫連線失敗或查詢操作發生錯誤時拋出異常
     * 
     * @example
     * ```typescript
     * const repo = new RTKInitRepository();
     * try {
     *   const totalCount = await repo.count();
     *   console.log(`目前共有 ${totalCount} 筆 RTK 資料`);
     *   
     *   // 判斷是否需要初始化資料
     *   if (totalCount === 0) {
     *     console.log('資料庫為空，需要進行初始化');
     *   }
     * } catch (error) {
     *   console.error('統計 RTK 資料失敗:', error);
     * }
     * ```
     */
    async count(): Promise<number> {
        // 使用 Sequelize 的 count() 方法進行高效的資料庫層級計數
        return await RTKDataModel.count();
    }

    /**
     * 批次建立多筆 RTK 定位資料
     * 
     * 此方法使用 Sequelize 的 bulkCreate() 方法進行批次插入操作，
     * 相較於逐一插入具有更好的性能表現。適用於系統初始化或大量資料匯入作業。
     * 
     * 性能優化特點：
     * - 使用單一 SQL 語句插入多筆資料
     * - 減少資料庫連線的往返次數
     * - 支援事務操作，確保資料一致性
     * 
     * @param {Array<{latitude: number, longitude: number}>} data 座標資料陣列，每個元素包含 latitude 和 longitude
     * @returns {Promise<RTKDataModel[]>} 成功建立的 RTK 資料模型陣列
     * @throws {Error} 當資料格式錯誤、座標值超出範圍或資料庫操作失敗時拋出異常
     * 
     * @example
     * ```typescript
     * const repo = new RTKInitRepository();
     * const coordinates = [
     *   { latitude: 25.033964, longitude: 121.564468 }, // 台北101座標
     *   { latitude: 25.034123, longitude: 121.565789 }, // 信義區座標
     *   { latitude: 25.047924, longitude: 121.517081 }  // 台北車站座標
     * ];
     * 
     * try {
     *   const createdData = await repo.bulkCreate(coordinates);
     *   console.log(`成功建立 ${createdData.length} 筆 RTK 資料`);
     *   
     *   // 檢查每筆建立的資料
     *   createdData.forEach((data, index) => {
     *     console.log(`第 ${index + 1} 筆 - ID: ${data.id}, 座標: (${data.latitude}, ${data.longitude})`);
     *   });
     * } catch (error) {
     *   console.error('批次建立 RTK 資料失敗:', error);
     *   throw error; // 重新拋出錯誤，讓上層處理
     * }
     * ```
     */
    async bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKDataModel[]> {
        // 使用 Sequelize 的 bulkCreate() 方法進行高效的批次插入操作
        // 此方法會自動處理事務，確保資料一致性
        return await RTKDataModel.bulkCreate(data);
    }
}