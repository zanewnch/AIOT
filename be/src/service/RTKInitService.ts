/**
 * RTKInitService - RTK 初始化服務層
 * =================================
 * 負責處理 RTK 定位系統的初始化相關業務邏輯，提供示範資料的建立和管理功能。
 * 此服務專門用於系統初始化階段，建立台灣各縣市的基準定位點資料。
 * 
 * 主要功能：
 * - 檢查 RTK 資料是否已存在
 * - 建立台灣主要城市的示範定位資料
 * - 提供批次資料初始化功能
 * 
 * 使用情境：
 * - 系統首次部署時的資料初始化
 * - 開發環境的測試資料建立
 * - RTK 定位功能的示範資料準備
 */

import { RTKInitRepository } from '../repo/RTKInitRepo.js';

/**
 * RTK 初始化服務類別
 * 提供 RTK 定位資料的初始化和管理功能
 */
export class RTKInitService {
  /** RTK 初始化資料存取層 */
  private rtkInitRepository: RTKInitRepository;

  /**
   * 建構函式
   * 初始化 RTK 資料存取層
   */
  constructor() {
    this.rtkInitRepository = new RTKInitRepository();
  }

  /**
   * 建立 RTK 示範資料
   * 檢查資料庫中是否已有 RTK 資料，若無則建立台灣主要城市的定位點資料
   * 
   * @returns Promise<{message: string, count: number}> 包含操作結果訊息和資料筆數
   * 
   * @example
   * ```typescript
   * const rtkService = new RTKInitService();
   * const result = await rtkService.seedRTKDemo();
   * 
   * console.log(result.message); // "RTK demo data created successfully"
   * console.log(`建立了 ${result.count} 筆 RTK 資料`);
   * ```
   * 
   * @remarks
   * 此方法包含台灣 10 個主要城市的經緯度座標：
   * - 台北、台中、高雄、宜蘭、嘉義、基隆、新竹、花蓮、台東、雲林
   * 
   * 若資料庫中已有 RTK 資料，則不會重複建立，並回傳現有資料筆數
   */
  async seedRTKDemo(): Promise<{ message: string; count: number }> {
    const existingCount = await this.rtkInitRepository.count();
    
    if (existingCount > 0) {
      return {
        message: 'RTK demo data already exists',
        count: existingCount
      };
    }

    const dummyData = [
      { latitude: 25.0330, longitude: 121.5654 }, // Taipei
      { latitude: 24.1477, longitude: 120.6736 }, // Taichung
      { latitude: 22.6273, longitude: 120.3014 }, // Kaohsiung
      { latitude: 24.9936, longitude: 121.3010 }, // Yilan
      { latitude: 23.6978, longitude: 120.9605 }, // Chiayi
      { latitude: 25.1276, longitude: 121.7392 }, // Keelung
      { latitude: 24.8068, longitude: 120.9686 }, // Hsinchu
      { latitude: 23.9609, longitude: 121.6015 }, // Hualien
      { latitude: 22.7972, longitude: 121.1561 }, // Taitung
      { latitude: 24.0737, longitude: 120.5420 }, // Yunlin
    ];

    const createdRecords = await this.rtkInitRepository.bulkCreate(dummyData);

    return {
      message: 'RTK demo data created successfully',
      count: createdRecords.length
    };
  }
}