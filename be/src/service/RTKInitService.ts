/**
 * @fileoverview RTK 初始化服務層
 * 
 * 負責處理 RTK 定位系統的初始化相關業務邏輯，提供示範資料的建立和管理功能。
 * 此服務專門用於系統初始化階段，建立台灣各縣市的基準定位點資料。
 * 
 * 主要功能：
 * - 檢查 RTK 資料是否已存在
 * - 建立台灣主要城市的示範定位資料
 * - 提供批次資料初始化功能
 * - 支援大量測試資料生成和壓力測試
 * 
 * 使用情境：
 * - 系統首次部署時的資料初始化
 * - 開發環境的測試資料建立
 * - RTK 定位功能的示範資料準備
 * - 壓力測試資料生成
 * 
 * 性能優化特色：
 * - 分批處理防止記憶體溢出
 * - 批量插入提高資料庫效率
 * - 並行執行減少總時間
 * - 進度顯示方便監控
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-18
 */

// 匯入 RTK 初始化資料存取層，提供資料庫操作功能
import { RTKInitRepository } from '../repo/RTKInitRepo.js';
// 匯入進度追蹤相關類型，用於支援進度回調和任務階段管理
import { ProgressCallback, TaskStage } from '../types/ProgressTypes.js';

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
    // 建立 RTK 初始化資料存取層實例
    this.rtkInitRepository = new RTKInitRepository();
  }

  /**
   * 建立 RTK 示範資料
   * 檢查資料庫中是否已有 RTK 資料，若無則建立 5000 筆隨機定位點資料進行壓力測試
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
   * 此方法會生成 5000 筆隨機的台灣地區經緯度座標供壓力測試使用：
   * - 緯度範圍：21.8 - 25.4 (台灣南北範圍)
   * - 經度範圍：119.3 - 122.0 (台灣東西範圍)
   * 
   * 若資料庫中已有 RTK 資料，則不會重複建立，並回傳現有資料筆數
   */
  async seedRTKDemo(): Promise<{ message: string; count: number }> {
    // 檢查資料庫中是否已有 RTK 資料
    const existingCount = await this.rtkInitRepository.count();

    // 如果已有資料，則回傳現有資料筆數
    if (existingCount > 0) {
      return {
        message: 'RTK demo data already exists',
        count: existingCount
      };
    }

    // 生成 5000 筆隨機定位資料供壓力測試
    const TARGET_COUNT = 5000;
    const BATCH_SIZE = 1000; // 分批處理避免記憶體問題
    let totalCreated = 0;

    console.log(`正在生成 ${TARGET_COUNT} 筆 RTK 測試資料...`);

    // 分批處理 RTK 資料創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) {
      // 計算當前批次的結束位置
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT);
      const batchData = [];

      // 生成當前批次的座標資料
      for (let i = batchStart; i < batchEnd; i++) {
        // 台灣地區的經緯度範圍
        const latitude = this.generateRandomLatitude(21.8, 25.4);  // 台灣緯度範圍
        const longitude = this.generateRandomLongitude(119.3, 122.0); // 台灣經度範圍

        // 將座標資料加入批次陣列
        batchData.push({ latitude, longitude });
      }

      console.log(`正在處理第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批次 (${batchStart + 1}-${batchEnd})...`);

      // 批量插入當前批次
      const createdRecords = await this.rtkInitRepository.bulkCreate(batchData);
      totalCreated += createdRecords.length;

      console.log(`批次完成，已插入 ${createdRecords.length} 筆 RTK 資料`);
    }

    console.log(`成功插入總計 ${totalCreated} 筆 RTK 資料`);

    // 回傳創建成功的訊息和資料筆數
    return {
      message: 'RTK demo data created successfully for stress testing',
      count: totalCreated
    };
  }

  /**
   * 生成指定範圍內的隨機緯度
   * @param min 最小緯度值
   * @param max 最大緯度值
   * @returns 隨機緯度值（保留 6 位小數）
   */
  private generateRandomLatitude(min: number, max: number): number {
    // 使用 Math.random() 生成隨機數，並限制在指定範圍內
    return parseFloat((Math.random() * (max - min) + min).toFixed(6));
  }

  /**
   * 生成指定範圍內的隨機經度
   * @param min 最小經度值
   * @param max 最大經度值
   * @returns 隨機經度值（保留 6 位小數）
   */
  private generateRandomLongitude(min: number, max: number): number {
    // 使用 Math.random() 生成隨機數，並限制在指定範圍內
    return parseFloat((Math.random() * (max - min) + min).toFixed(6));
  }

  /**
   * 建立 RTK 示範資料（支援進度回調）
   * 與 seedRTKDemo 相同功能，但支援進度追蹤回調
   * 
   * @param progressCallback 進度回調函數
   * @returns Promise<{message: string, count: number}> 包含操作結果訊息和資料筆數
   */
  async seedRTKDemoWithProgress(progressCallback?: ProgressCallback): Promise<{ message: string; count: number }> {
    // 檢查資料庫中是否已有 RTK 資料
    const existingCount = await this.rtkInitRepository.count();
    
    // 如果已有資料，則回傳現有資料筆數
    if (existingCount > 0) {
      // 如果有進度回調，通知已存在資料
      if (progressCallback) {
        progressCallback({
          taskId: '',
          status: 'completed' as any,
          stage: TaskStage.INSERTING_RTK,
          percentage: 100,
          current: existingCount,
          total: existingCount,
          message: 'RTK data already exists',
          startTime: new Date(),
          lastUpdated: new Date()
        });
      }
      
      return {
        message: 'RTK demo data already exists',
        count: existingCount
      };
    }

    // 生成 5000 筆隨機定位資料供壓力測試
    const TARGET_COUNT = 5000;
    const BATCH_SIZE = 1000; // 分批處理避免記憶體問題
    let totalCreated = 0;
    
    console.log(`正在生成 ${TARGET_COUNT} 筆 RTK 測試資料...`);
    
    // 分批處理 RTK 資料創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) {
      // 計算當前批次的結束位置
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT);
      const batchData = [];
      
      // 生成當前批次的座標資料
      for (let i = batchStart; i < batchEnd; i++) {
        // 台灣地區的經緯度範圍
        const latitude = this.generateRandomLatitude(21.8, 25.4);  // 台灣緯度範圍
        const longitude = this.generateRandomLongitude(119.3, 122.0); // 台灣經度範圍
        
        // 將座標資料加入批次陣列
        batchData.push({ latitude, longitude });
      }
      
      console.log(`正在處理第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批次 (${batchStart + 1}-${batchEnd})...`);
      
      // 通知進度
      if (progressCallback) {
        progressCallback({
          taskId: '',
          status: 'running' as any,
          stage: TaskStage.INSERTING_RTK,
          percentage: 0, // 會被 ProgressService 重新計算
          current: batchStart,
          total: TARGET_COUNT,
          message: `正在插入第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批次 RTK 資料 (${batchStart + 1}-${batchEnd})`,
          startTime: new Date(),
          lastUpdated: new Date()
        });
      }
      
      // 批量插入當前批次
      const createdRecords = await this.rtkInitRepository.bulkCreate(batchData);
      totalCreated += createdRecords.length;
      
      console.log(`批次完成，已插入 ${createdRecords.length} 筆 RTK 資料`);
    }
    
    console.log(`成功插入總計 ${totalCreated} 筆 RTK 資料`);

    // 通知完成
    if (progressCallback) {
      progressCallback({
        taskId: '',
        status: 'running' as any,
        stage: TaskStage.INSERTING_RTK,
        percentage: 0, // 會被 ProgressService 重新計算
        current: totalCreated,
        total: TARGET_COUNT,
        message: `RTK 資料插入完成，共 ${totalCreated} 筆`,
        startTime: new Date(),
        lastUpdated: new Date()
      });
    }

    // 回傳創建成功的訊息和資料筆數
    return {
      message: 'RTK demo data created successfully for stress testing',
      count: totalCreated
    };
  }
}