/**
 * @fileoverview RTK 定位資料控制器
 * 負責處理 RTK（Real-Time Kinematic）定位資料的 HTTP 端點
 * 提供即時動態定位資料的 CRUD 操作功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * @description API 端點說明：
 * - GET /api/rtk/data - 取得所有 RTK 定位資料
 * - PUT /api/rtk/data/:id - 更新指定 RTK 定位資料
 */

import { Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { RTKDataModel } from '../models/RTKDataModel.js'; // 匯入 RTK 資料模型

/**
 * RTK 定位資料控制器
 * 
 * @class RTKController
 * @description 處理 RTK（Real-Time Kinematic）定位資料的 API 請求
 * 提供即時動態定位資料的查詢、更新功能
 * 
 * @example
 * ```typescript
 * // 使用方式（在路由中）
 * const rtkController = new RTKController();
 * router.get('/rtk/data', rtkController.getRTKData);
 * router.put('/rtk/data/:id', rtkController.updateRTKData);
 * ```
 */
export class RTKController {
  /**
   * 初始化控制器實例
   * 
   * @constructor
   * @description 初始化 RTK 定位資料控制器
   * 控制器現在只負責業務邏輯，路由設定已移至 rtkRoutes.ts
   */
  constructor() {
    // Controller 現在只負責業務邏輯，路由已移至 rtkRoutes.ts
    // 此控制器專注於處理 RTK 定位資料相關的 HTTP 請求和回應
  }


  /**
   * 取得所有 RTK 定位資料
   * 
   * @method getRTKData
   * @param {Request} _req - Express 請求物件（未使用）
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   * 
   * @throws {500} 當資料庫查詢發生錯誤時
   * 
   * @description 從資料庫中取得所有 RTK 定位資料並格式化回傳
   * 資料會按建立時間降序排列，並轉換為前端期望的格式
   * 
   * @example
   * ```bash
   * GET /api/rtk/data
   * ```
   * 
   * @example 回應格式
   * ```json
   * [
   *   {
   *     "id": 1,
   *     "latitude": 25.0330,
   *     "longitude": 121.5654,
   *     "altitude": 45.0,
   *     "timestamp": "2024-01-01 12:00:00"
   *   }
   * ]
   * ```
   */
  public async getRTKData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 記錄開始取得 RTK 資料的資訊
      console.log('🔍 RTKController: Starting getRTKData...');
      
      // 從資料庫中取得所有 RTK 資料，按建立時間降序排列
      const rtkData = await RTKDataModel.findAll({
        order: [['createdAt', 'DESC']], // 按建立時間降序排列以取得最新資料
      });

      // 記錄從資料庫取得的原始資料
      console.log('📊 RTKController: Raw data from database:', rtkData);
      console.log('📊 RTKController: Number of records found:', rtkData.length);

      // 轉換資料格式以符合前端期望的結構
      const formattedData = rtkData.map((item) => ({
        id: item.id, // 資料識別碼
        latitude: item.latitude, // 緯度座標
        longitude: item.longitude, // 經度座標
        altitude: 45.0, // 預設海拔高度（可後續從其他來源獲取）
        timestamp: item.createdAt?.toISOString().replace('T', ' ').substring(0, 19) || '', // 格式: YYYY-MM-DD HH:mm:ss
      }));

      // 記錄格式化後的資料
      console.log('✅ RTKController: Formatted data:', formattedData);
      console.log('✅ RTKController: Sending response with', formattedData.length, 'records');

      // 回傳格式化後的 RTK 資料給客戶端
      res.status(200).json(formattedData);
    } catch (error) {
      // 將例外處理委派給 Express 錯誤處理中間件
      next(error);
    }
  }

  /**
   * 更新指定 RTK 定位資料
   * 
   * @method updateRTKData
   * @param {Request} req - Express 請求物件，包含 id 參數和更新資料
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   * 
   * @throws {400} 當必要欄位缺失時
   * @throws {404} 當指定的 RTK 資料不存在時
   * @throws {500} 當資料庫更新發生錯誤時
   * 
   * @description 更新指定 ID 的 RTK 定位資料
   * 需要提供緯度和經度，海拔高度和時間戳記為可選欄位
   * 
   * @example
   * ```bash
   * PUT /api/rtk/data/123
   * Content-Type: application/json
   * 
   * {
   *   "latitude": 25.0330,
   *   "longitude": 121.5654,
   *   "altitude": 45.0,
   *   "timestamp": "2024-01-01 12:00:00"
   * }
   * ```
   * 
   * @example 成功回應
   * ```json
   * {
   *   "success": true,
   *   "message": "RTK data updated successfully",
   *   "data": {
   *     "id": 123,
   *     "latitude": 25.0330,
   *     "longitude": 121.5654,
   *     "altitude": 45.0,
   *     "timestamp": "2024-01-01 12:00:00"
   *   }
   * }
   * ```
   */
  public async updateRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 從 URL 參數中取得資料 ID
      const { id } = req.params;
      // 從請求主體中解構取得更新資料
      const { latitude, longitude, altitude, timestamp } = req.body;

      // 記錄開始更新 RTK 資料的資訊
      console.log(`🔄 RTKController: Updating RTK data with ID: ${id}`);
      console.log('📝 RTKController: Update data:', { latitude, longitude, altitude, timestamp });

      // 驗證必要欄位是否存在
      if (!latitude || !longitude) {
        // 回傳 400 錯誤，表示請求資料不完整
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      // 檢查指定 ID 的記錄是否存在於資料庫中
      const existingRecord = await RTKDataModel.findByPk(id);
      if (!existingRecord) {
        // 回傳 404 錯誤，表示資料不存在
        res.status(404).json({
          success: false,
          message: 'RTK data not found'
        });
        return;
      }

      // 更新資料庫記錄
      const updatedRecord = await existingRecord.update({
        latitude: parseFloat(latitude), // 將緯度轉換為浮點數
        longitude: parseFloat(longitude) // 將經度轉換為浮點數
      });

      // 記錄更新成功的資訊
      console.log('✅ RTKController: RTK data updated successfully:', updatedRecord.toJSON());

      // 準備回傳的格式化資料
      const formattedData = {
        id: updatedRecord.id, // 資料識別碼
        latitude: updatedRecord.latitude, // 更新後的緯度
        longitude: updatedRecord.longitude, // 更新後的經度
        altitude: parseFloat(altitude) || 45.0, // 海拔高度（如果沒有提供則使用預設值）
        timestamp: timestamp || updatedRecord.updatedAt?.toISOString().replace('T', ' ').substring(0, 19) || '' // 時間戳記
      };

      // 回傳更新成功的回應
      res.status(200).json({
        success: true,
        message: 'RTK data updated successfully',
        data: formattedData
      });
    } catch (error) {
      // 記錄更新失敗的錯誤資訊
      console.error('❌ RTKController: Error updating RTK data:', error);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(error);
    }
  }
}