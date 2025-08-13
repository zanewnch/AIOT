/**
 * @fileoverview 文檔頁面控制器 - 支援智能緩存和自動文檔生成
 */

import type { Request, Response } from 'express';
import { availableServices, config } from '../config/index.js';
import { DocsGenerationService } from '../services/DocsGenerationService.js';

export class DocsController {
  /**
   * 顯示文檔首頁 - 支援智能緩存
   * 只有當源代碼有更新時才重新生成文檔
   */
  public static getHomepage = async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now();
      
      // 檢查是否需要更新文檔
      console.log('🔍 檢查文檔是否需要更新...');
      const needsUpdate = await DocsGenerationService.checkIfDocsNeedUpdate();
      
      if (needsUpdate) {
        console.log('📝 發現源代碼更新，開始生成最新文檔...');
        const generateSuccess = await DocsGenerationService.generateAllDocs();
        
        if (!generateSuccess) {
          console.warn('⚠️ 部分文檔生成失敗，但繼續顯示頁面');
        }
      } else {
        console.log('✅ 文檔是最新的，無需重新生成');
      }
      
      // 準備模板數據
      const templateData = {
        services: availableServices,
        version: config.service.version,
        lastUpdated: new Date().toLocaleString('zh-TW'),
        // 添加生成信息供調試使用
        generationInfo: {
          needsUpdate,
          checkDuration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      
      // 渲染頁面
      res.render('homepage', templateData);
      
      console.log(`📊 頁面渲染完成，總耗時: ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error('❌ 處理文檔首頁請求時發生錯誤:', error);
      
      // 發生錯誤時，仍然嘗試渲染基本頁面
      const fallbackData = {
        services: availableServices,
        version: config.service.version,
        lastUpdated: new Date().toLocaleString('zh-TW'),
        generationInfo: {
          needsUpdate: false,
          checkDuration: 0,
          timestamp: new Date().toISOString(),
          error: 'Failed to check or generate docs'
        }
      };
      
      res.render('homepage', fallbackData);
    }
  };

  /**
   * 手動觸發文檔生成的端點
   */
  public static generateDocs = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 手動觸發文檔生成...');
      const success = await DocsGenerationService.generateAllDocs();
      
      if (success) {
        res.json({
          status: 'success',
          message: '所有文檔生成成功',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: '部分文檔生成失敗',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('手動生成文檔時發生錯誤:', error);
      res.status(500).json({
        status: 'error',
        message: '文檔生成過程中發生錯誤',
        error: error instanceof Error ? error.message : '未知錯誤',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 獲取文檔生成狀態
   */
  public static getGenerationStatus = (req: Request, res: Response): void => {
    const status = DocsGenerationService.getGenerationStatus();
    const statusArray = Array.from(status.entries()).map(([service, info]) => ({
      service,
      ...info
    }));
    
    res.json({
      services: statusArray,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * 重定向到文檔首頁
   */
  public static redirectToHomepage = (_req: Request, res: Response): void => {
    res.redirect('/docs');
  };
}