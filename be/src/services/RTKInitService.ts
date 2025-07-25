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
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('RTKInitService');

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
  constructor() { // 建構函式，初始化 RTK 初始化服務
    // 建立 RTK 初始化資料存取層實例
    this.rtkInitRepository = new RTKInitRepository(); // 創建 RTK 資料存取層實例，用於與資料庫進行互動
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
  async seedRTKDemo(): Promise<{ message: string; count: number }> { // 異步方法：建立 RTK 示範資料
    logger.info('Starting RTK demo data seeding process'); // 記錄 RTK 資料建立流程開始的資訊日誌
    
    // 檢查資料庫中是否已有 RTK 資料
    const existingCount = await this.rtkInitRepository.count(); // 調用資料存取層計算現有 RTK 記錄的數量
    logger.debug(`Found ${existingCount} existing RTK records in database`); // 記錄找到的現有 RTK 記錄數量

    // 如果已有資料，則回傳現有資料筆數
    if (existingCount > 0) { // 如果資料庫中已經有 RTK 資料
      logger.info(`RTK demo data already exists with ${existingCount} records`); // 記錄資料已存在的資訊日誌
      return { // 回傳已存在資料的結果
        message: 'RTK demo data already exists', // 資料已存在的訊息
        count: existingCount // 現有資料的筆數
      };
    }

    // 生成 5000 筆隨機定位資料供壓力測試
    const TARGET_COUNT = 5000; // 設定目標資料筆數為 5000 筆
    const BATCH_SIZE = 1000; // 設定每批次處理的資料量，分批避免記憶體溢出問題
    let totalCreated = 0; // 初始化已創建的資料總數計數器

    logger.info(`Generating ${TARGET_COUNT} RTK test data records for stress testing`); // 記錄開始生成測試資料的資訊日誌

    // 分批處理 RTK 資料創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) { // 以批次大小為間隔遍歷，分批處理資料創建
      // 計算當前批次的結束位置
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT); // 計算當前批次的結束索引，確保不超過總目標數量
      const batchData = []; // 初始化當前批次的資料陣列

      // 生成當前批次的座標資料
      for (let i = batchStart; i < batchEnd; i++) { // 遍歷當前批次的每個索引位置
        // 台灣地區的經緯度範圍
        const latitude = this.generateRandomLatitude(21.8, 25.4);  // 調用私有方法生成台灣緯度範圍內的隨機緯度
        const longitude = this.generateRandomLongitude(119.3, 122.0); // 調用私有方法生成台灣經度範圍內的隨機經度

        // 將座標資料加入批次陣列
        batchData.push({ latitude, longitude }); // 將生成的經緯度座標加入當前批次的資料陣列
      }

      const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1; // 計算當前批次編號（從 1 開始）
      logger.info(`Processing batch ${batchNumber} (records ${batchStart + 1}-${batchEnd})`); // 記錄正在處理的批次資訊

      // 批量插入當前批次
      const createdRecords = await this.rtkInitRepository.bulkCreate(batchData); // 調用資料存取層進行批量資料插入
      totalCreated += createdRecords.length; // 累加已創建的記錄數量

      logger.debug(`Batch ${batchNumber} completed, inserted ${createdRecords.length} RTK records`); // 記錄批次完成的除錯日誌
    }

    logger.info(`Successfully inserted ${totalCreated} RTK records in total`); // 記錄總共成功插入的 RTK 記錄數量

    // 回傳創建成功的訊息和資料筆數
    return { // 回傳操作結果物件
      message: 'RTK demo data created successfully for stress testing', // 成功創建資料的訊息
      count: totalCreated // 實際創建的資料筆數
    };
  }

  /**
   * 生成指定範圍內的隨機緯度
   * @param min 最小緯度值
   * @param max 最大緯度值
   * @returns 隨機緯度值（保留 6 位小數）
   */
  private generateRandomLatitude(min: number, max: number): number { // 私有方法：生成指定範圍內的隨機緯度
    // 使用 Math.random() 生成隨機數，並限制在指定範圍內
    return parseFloat((Math.random() * (max - min) + min).toFixed(6)); // 生成範圍內的隨機數，保留 6 位小數並轉換為浮點數
  }

  /**
   * 生成指定範圍內的隨機經度
   * @param min 最小經度值
   * @param max 最大經度值
   * @returns 隨機經度值（保留 6 位小數）
   */
  private generateRandomLongitude(min: number, max: number): number { // 私有方法：生成指定範圍內的隨機經度
    // 使用 Math.random() 生成隨機數，並限制在指定範圍內
    return parseFloat((Math.random() * (max - min) + min).toFixed(6)); // 生成範圍內的隨機數，保留 6 位小數並轉換為浮點數
  }

  /**
   * 建立 RTK 示範資料（支援進度回調）
   * 與 seedRTKDemo 相同功能，但支援進度追蹤回調
   * 
   * @param progressCallback 進度回調函數
   * @returns Promise<{message: string, count: number}> 包含操作結果訊息和資料筆數
   */
  async seedRTKDemoWithProgress(progressCallback?: ProgressCallback): Promise<{ message: string; count: number }> { // 異步方法：支援進度回調的 RTK 示範資料建立
    // 檢查資料庫中是否已有 RTK 資料
    const existingCount = await this.rtkInitRepository.count(); // 調用資料存取層計算現有 RTK 記錄數量
    
    // 如果已有資料，則回傳現有資料筆數
    if (existingCount > 0) { // 如果資料庫中已經有 RTK 資料
      // 如果有進度回調，通知已存在資料
      if (progressCallback) { // 如果提供了進度回調函數
        progressCallback({ // 調用進度回調函數，通知任務已完成
          taskId: '', // 空的任務 ID（將由進度服務設定）
          status: 'completed' as any, // 設定任務狀態為已完成
          stage: TaskStage.INSERTING_RTK, // 設定任務階段為 RTK 資料插入
          percentage: 100, // 進度百分比為 100%
          current: existingCount, // 當前已完成數量為現有資料數量
          total: existingCount, // 總數量也為現有資料數量
          message: 'RTK data already exists', // 設定狀態訊息
          startTime: new Date(), // 設定開始時間為當前時間
          lastUpdated: new Date() // 設定最後更新時間為當前時間
        });
      }
      
      return { // 回傳已存在資料的結果
        message: 'RTK demo data already exists', // 資料已存在的訊息
        count: existingCount // 現有資料的筆數
      };
    }

    // 生成 5000 筆隨機定位資料供壓力測試
    const TARGET_COUNT = 5000; // 設定目標資料筆數為 5000 筆
    const BATCH_SIZE = 1000; // 設定每批次處理的資料量，分批避免記憶體溢出問題
    let totalCreated = 0; // 初始化已創建的資料總數計數器
    
    logger.info(`Generating ${TARGET_COUNT} RTK test data records with progress tracking`); // 記錄開始生成支援進度追蹤的測試資料資訊日誌
    
    // 分批處理 RTK 資料創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) { // 以批次大小為間隔遍歷，分批處理資料創建
      // 計算當前批次的結束位置
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT); // 計算當前批次的結束索引，確保不超過總目標數量
      const batchData = []; // 初始化當前批次的資料陣列
      
      // 生成當前批次的座標資料
      for (let i = batchStart; i < batchEnd; i++) { // 遍歷當前批次的每個索引位置
        // 台灣地區的經緯度範圍
        const latitude = this.generateRandomLatitude(21.8, 25.4);  // 調用私有方法生成台灣緯度範圍內的隨機緯度
        const longitude = this.generateRandomLongitude(119.3, 122.0); // 調用私有方法生成台灣經度範圍內的隨機經度
        
        // 將座標資料加入批次陣列
        batchData.push({ latitude, longitude }); // 將生成的經緯度座標加入當前批次的資料陣列
      }
      
      const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1; // 計算當前批次編號（從 1 開始）
      logger.info(`Processing batch ${batchNumber} with progress callback (records ${batchStart + 1}-${batchEnd})`); // 記錄正在處理的批次資訊（包含進度回調）
      
      // 通知進度
      if (progressCallback) { // 如果提供了進度回調函數
        progressCallback({ // 調用進度回調函數，更新任務進度
          taskId: '', // 空的任務 ID（將由進度服務設定）
          status: 'running' as any, // 設定任務狀態為執行中
          stage: TaskStage.INSERTING_RTK, // 設定任務階段為 RTK 資料插入
          percentage: 0, // 初始百分比為 0（會被 ProgressService 重新計算）
          current: batchStart, // 當前已完成數量為批次開始索引
          total: TARGET_COUNT, // 總目標數量
          message: `正在插入第 ${batchNumber} 批次 RTK 資料 (${batchStart + 1}-${batchEnd})`, // 當前操作的狀態訊息
          startTime: new Date(), // 設定開始時間為當前時間
          lastUpdated: new Date() // 設定最後更新時間為當前時間
        });
      }
      
      // 批量插入當前批次
      const createdRecords = await this.rtkInitRepository.bulkCreate(batchData); // 調用資料存取層進行批量資料插入
      totalCreated += createdRecords.length; // 累加已創建的記錄數量
      
      logger.debug(`Batch ${batchNumber} completed, inserted ${createdRecords.length} RTK records`); // 記錄批次完成的除錯日誌
    }
    
    logger.info(`Successfully inserted ${totalCreated} RTK records with progress tracking`); // 記錄成功插入的 RTK 記錄數量（包含進度追蹤）

    // 通知完成
    if (progressCallback) { // 如果提供了進度回調函數
      progressCallback({ // 調用進度回調函數，通知任務完成
        taskId: '', // 空的任務 ID（將由進度服務設定）
        status: 'running' as any, // 設定任務狀態為執行中（進度服務將會處理最終狀態）
        stage: TaskStage.INSERTING_RTK, // 設定任務階段為 RTK 資料插入
        percentage: 0, // 初始百分比為 0（會被 ProgressService 重新計算為 100%）
        current: totalCreated, // 當前已完成數量為總創建數量
        total: TARGET_COUNT, // 總目標數量
        message: `RTK 資料插入完成，共 ${totalCreated} 筆`, // 完成狀態訊息
        startTime: new Date(), // 設定開始時間為當前時間
        lastUpdated: new Date() // 設定最後更新時間為當前時間
      });
    }

    // 回傳創建成功的訊息和資料筆數
    return { // 回傳操作結果物件
      message: 'RTK demo data created successfully for stress testing', // 成功創建資料的訊息
      count: totalCreated // 實際創建的資料筆數
    };
  }
}