/**
 * RTKInitRepo - RTK 初始化資料存取層
 * ==================================
 * 負責處理 RTK 定位資料的初始化相關操作，包含資料統計和批次建立功能。
 * 此 Repository 專門用於系統初始化階段的 RTK 資料處理。
 * 
 * 主要功能：
 * - 統計現有 RTK 資料筆數
 * - 批次建立多筆 RTK 定位資料
 * 
 * 使用情境：
 * - 系統初始化時檢查是否已有基準資料
 * - 匯入初始化的 RTK 基站或校正點資料
 * - 大量定位資料的快速插入作業
 */

import { RTKDataModel } from '../models/RTKDataModel.js';

/**
 * RTK 初始化資料存取介面
 * 定義 RTK 初始化相關的資料操作方法
 */
export interface IRTKInitRepository {
    /**
     * 統計 RTK 資料總筆數
     * @returns Promise<number> 資料庫中 RTK 資料的總筆數
     */
    count(): Promise<number>;
    
    /**
     * 批次建立多筆 RTK 定位資料
     * @param data 包含緯度和經度的座標資料陣列
     * @returns Promise<RTKDataModel[]> 成功建立的 RTK 資料模型陣列
     */
    bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKDataModel[]>;
}

/**
 * RTK 初始化資料存取實作類別
 * 實作 IRTKInitRepository 介面，提供具體的資料操作功能
 */
export class RTKInitRepository implements IRTKInitRepository {
    /**
     * 統計 RTK 資料總筆數
     * 用於檢查系統是否已有初始化資料
     * 
     * @returns Promise<number> 資料庫中所有 RTK 資料的筆數
     * 
     * @example
     * ```typescript
     * const repo = new RTKInitRepository();
     * const totalCount = await repo.count();
     * console.log(`目前共有 ${totalCount} 筆 RTK 資料`);
     * ```
     */
    async count(): Promise<number> {
        return await RTKDataModel.count();
    }

    /**
     * 批次建立多筆 RTK 定位資料
     * 適用於系統初始化或大量資料匯入作業
     * 
     * @param data 座標資料陣列，每個元素包含 latitude 和 longitude
     * @returns Promise<RTKDataModel[]> 成功建立的 RTK 資料模型陣列
     * 
     * @throws {Error} 當資料格式錯誤或資料庫操作失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * const repo = new RTKInitRepository();
     * const coordinates = [
     *   { latitude: 25.033964, longitude: 121.564468 },
     *   { latitude: 25.034123, longitude: 121.565789 }
     * ];
     * const createdData = await repo.bulkCreate(coordinates);
     * console.log(`成功建立 ${createdData.length} 筆 RTK 資料`);
     * ```
     */
    async bulkCreate(data: { latitude: number; longitude: number }[]): Promise<RTKDataModel[]> {
        return await RTKDataModel.bulkCreate(data);
    }
}