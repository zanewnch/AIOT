/**
 * RTKController - RTK 定位資料控制器
 * =================================
 * 處理 RTK（Real-Time Kinematic）定位資料的 API 請求
 * 
 * API Endpoints:
 * - GET /api/rtk/data - 取得所有 RTK 定位資料
 */

import { Router, Request, Response, NextFunction } from 'express';
import { RTKDataModel } from '../models/RTKDataModel.js';
import { JwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';

export class RTKController {
  public router: Router;
  private jwtAuth: JwtAuthMiddleware;

  /**
   * 初始化控制器實例
   * 設置路由和必要的服務依賴
   */
  constructor() {
    this.router = Router();
    this.jwtAuth = new JwtAuthMiddleware();
    this.initializeRoutes();
  }

  /**
   * 初始化路由配置
   * 
   * 設置 RTK 相關的 API 路由
   * 
   * @private
   * @returns {void}
   */
  private initializeRoutes = (): void => {
    /**
     * GET /api/rtk/data
     * -------------------------------------------------
     * 取得所有 RTK 定位資料
     * 需要 JWT 驗證
     */
    this.router.get('/api/rtk/data', this.jwtAuth.authenticate, this.getRTKData);
    
    /**
     * PUT /api/rtk/data/:id
     * -------------------------------------------------
     * 更新指定 RTK 定位資料
     * 需要 JWT 驗證
     */
    this.router.put('/api/rtk/data/:id', this.jwtAuth.authenticate, this.updateRTKData);
  }

  /**
   * 取得所有 RTK 定位資料
   * GET /api/rtk/data
   */
  public async getRTKData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('🔍 RTKController: Starting getRTKData...');
      
      const rtkData = await RTKDataModel.findAll({
        order: [['createdAt', 'DESC']], // 按建立時間降序排列
      });

      console.log('📊 RTKController: Raw data from database:', rtkData);
      console.log('📊 RTKController: Number of records found:', rtkData.length);

      // 轉換資料格式以符合前端期望的結構
      const formattedData = rtkData.map((item) => ({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        altitude: 45.0, // 預設海拔高度（可後續從其他來源獲取）
        timestamp: item.createdAt?.toISOString().replace('T', ' ').substring(0, 19) || '', // 格式: YYYY-MM-DD HH:mm:ss
      }));

      console.log('✅ RTKController: Formatted data:', formattedData);
      console.log('✅ RTKController: Sending response with', formattedData.length, 'records');

      res.status(200).json(formattedData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新指定 RTK 定位資料
   * PUT /api/rtk/data/:id
   */
  public async updateRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { latitude, longitude, altitude, timestamp } = req.body;

      console.log(`🔄 RTKController: Updating RTK data with ID: ${id}`);
      console.log('📝 RTKController: Update data:', { latitude, longitude, altitude, timestamp });

      // 驗證必要欄位
      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      // 檢查記錄是否存在
      const existingRecord = await RTKDataModel.findByPk(id);
      if (!existingRecord) {
        res.status(404).json({
          success: false,
          message: 'RTK data not found'
        });
        return;
      }

      // 更新記錄
      const updatedRecord = await existingRecord.update({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });

      console.log('✅ RTKController: RTK data updated successfully:', updatedRecord.toJSON());

      // 返回更新後的格式化資料
      const formattedData = {
        id: updatedRecord.id,
        latitude: updatedRecord.latitude,
        longitude: updatedRecord.longitude,
        altitude: parseFloat(altitude) || 45.0,
        timestamp: timestamp || updatedRecord.updatedAt?.toISOString().replace('T', ' ').substring(0, 19) || ''
      };

      res.status(200).json({
        success: true,
        message: 'RTK data updated successfully',
        data: formattedData
      });
    } catch (error) {
      console.error('❌ RTKController: Error updating RTK data:', error);
      next(error);
    }
  }
}