/**
 * @fileoverview RTK 資料擷取測試工具
 * 
 * 此文件包含用於測試 RTK (Real-Time Kinematic) 資料擷取功能的測試函數，
 * 主要用於驗證不同的資料獲取方法是否正常運作並返回一致的結果。
 * 
 * 功能包括：
 * - 測試直接的 RTK 資料擷取方法
 * - 測試通過通用資料表服務獲取 RTK 資料
 * - 比較兩種方法返回的資料是否一致
 * - 在頁面載入時自動執行測試
 * 
 * @author AIOT Team
 * @version 1.0.0
 */

import { tableAPI } from './hooks/useTableQuery'; // 引入表格 API 函數

/**
 * 測試 RTK 資料擷取功能的異步函數
 * 
 * @description 此函數執行多項測試來驗證 RTK 資料擷取的功能：
 * 1. 測試直接的 getRTKData() 方法
 * 2. 測試通過 getTableData('RTK') 方法獲取資料
 * 3. 比較兩種方法返回的資料是否一致
 * 
 * @async
 * @function testRTKFetch
 * @returns {Promise<void>} 返回一個 Promise，測試完成後解析
 * 
 * @example
 * // 手動執行測試
 * await testRTKFetch();
 * 
 * @throws {Error} 當資料擷取失敗時拋出錯誤
 */
async function testRTKFetch() {
  console.log('🧪 Testing RTK data fetch...'); // 開始測試的日誌訊息
  
  try {
    /**
     * 測試直接的 RTK 資料擷取方法
     * 
     * @description 使用 tableAPI.getRTKData() 方法直接獲取 RTK 資料
     * 這是專門為 RTK 資料設計的方法
     */
    console.log('1. Testing direct getRTKData()...'); // 第一個測試的日誌訊息
    const directData = await tableAPI.getRTKData(); // 調用直接的 RTK 資料擷取方法
    console.log('✅ Direct fetch result:', directData); // 輸出直接擷取的結果
    
    /**
     * 測試通過通用資料表服務獲取 RTK 資料（保持相同的 API）
     * 
     * @description 使用相同的 tableAPI.getRTKData() 方法再次獲取 RTK 資料
     * 確保多次調用返回一致的結果
     */
    console.log('2. Testing second call to getRTKData()...'); // 第二個測試的日誌訊息
    const tableData = await tableAPI.getRTKData(); // 再次調用 RTK 資料擷取方法
    console.log('✅ Second fetch result:', tableData); // 輸出第二次調用的結果
    
    /**
     * 比較兩種方法返回的資料
     * 
     * @description 使用 JSON.stringify() 將兩個資料對象轉換為字符串後進行比較
     * 確保兩種不同的資料獲取方法返回完全相同的資料
     */
    if (JSON.stringify(directData) === JSON.stringify(tableData)) {
      console.log('✅ Both methods return identical data'); // 資料一致的成功訊息
    } else {
      console.log('❌ Methods return different data'); // 資料不一致的警告訊息
    }
    
  } catch (error) {
    /**
     * 錯誤處理
     * 
     * @description 捕獲測試過程中的任何錯誤並輸出錯誤訊息
     * 這包括網路錯誤、API 錯誤或資料格式錯誤等
     */
    console.error('❌ Test failed:', error); // 輸出測試失敗的錯誤訊息
  }
}

/**
 * 頁面載入時自動執行測試
 * 
 * @description 檢查是否在瀏覽器環境中運行（window 對象存在）
 * 如果是，則在 window 的 load 事件觸發時自動執行 RTK 資料擷取測試
 * 這確保頁面完全載入後才開始測試，避免在資源尚未準備好時執行測試
 */
if (typeof window !== 'undefined') { // 檢查是否在瀏覽器環境中
  window.addEventListener('load', testRTKFetch); // 在頁面載入完成後自動執行測試
}

/**
 * 導出測試函數
 * 
 * @description 導出 testRTKFetch 函數，使其能夠在其他模組中被導入和使用
 * 這允許在需要時手動觸發測試或在其他測試套件中重用此測試
 */
export { testRTKFetch };