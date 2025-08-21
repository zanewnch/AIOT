/**
 * @fileoverview 文檔頁面控制器 - 支援智能緩存和自動文檔生成
 */

import type { Request, Response } from 'express';
import { availableServices, config } from '../config/index.js';
import { DocsGenerationSvc } from '../services/DocsGenerationSvc.js';
import fs from 'fs';
import path from 'path';

export class DocsController {
  /**
   * 顯示文檔首頁 - 快速載入，不執行初始化邏輯
   */
  public static getHomepage = async (req: Request, res: Response): Promise<void> => {
    try {
      // 快速返回頁面，包含手動初始化按鈕
      const templateData = {
        services: availableServices,
        version: config.service.version,
        lastUpdated: new Date().toLocaleString('zh-TW'),
        showInitButton: true
      };
      
      res.render('homepage', templateData);
      console.log('📄 Homepage 已快速載入');
      
    } catch (error) {
      console.error('❌ 處理文檔首頁請求時發生錯誤:', error);
      res.status(500).send('頁面載入失敗');
    }
  };

  /**
   * AJAX 端點：載入實際的首頁內容
   */
  public static loadHomepageContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now();
      const steps: string[] = [];
      
      // 步驟 1: 檢查文檔更新
      steps.push('🔍 檢查文檔是否需要更新...');
      console.log(steps[steps.length - 1]);
      
      const needsUpdate = await DocsGenerationSvc.checkIfDocsNeedUpdate();
      
      if (needsUpdate) {
        steps.push('📝 發現源代碼更新，開始生成最新文檔...');
        console.log(steps[steps.length - 1]);
        
        const generateSuccess = await DocsGenerationSvc.generateAllDocs();
        
        if (!generateSuccess) {
          steps.push('⚠️ 部分文檔生成失敗，但繼續顯示頁面');
          console.warn(steps[steps.length - 1]);
        } else {
          steps.push('✅ 文檔生成成功');
          console.log(steps[steps.length - 1]);
        }
      } else {
        steps.push('✅ 文檔是最新的，無需重新生成');
        console.log(steps[steps.length - 1]);
      }
      
      steps.push('🎨 準備頁面內容...');
      console.log(steps[steps.length - 1]);
      
      // 準備最終數據
      const contentData = {
        services: availableServices,
        version: config.service.version,
        lastUpdated: new Date().toLocaleString('zh-TW'),
        generationInfo: {
          needsUpdate,
          checkDuration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          steps: steps
        },
        showInitButton: false
      };
      
      steps.push(`📊 載入完成，總耗時: ${Date.now() - startTime}ms`);
      console.log(steps[steps.length - 1]);
      
      res.json({
        success: true,
        data: contentData
      });
      
    } catch (error) {
      console.error('❌ 載入首頁內容時發生錯誤:', error);
      
      res.json({
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        data: {
          services: availableServices,
          version: config.service.version,
          lastUpdated: new Date().toLocaleString('zh-TW'),
          generationInfo: {
            needsUpdate: false,
            checkDuration: 0,
            timestamp: new Date().toISOString(),
            steps: ['❌ 載入過程中發生錯誤'],
            error: 'Failed to load content'
          },
          showInitButton: false
        }
      });
    }
  };

  /**
   * 手動觸發文檔生成的端點
   */
  public static generateDocs = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 手動觸發文檔生成...');
      const success = await DocsGenerationSvc.generateAllDocs();
      
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
    const status = DocsGenerationSvc.getGenerationStatus();
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
   * 顯示路由配置分析頁面
   */
  public static getNotePage = async (req: Request, res: Response): Promise<void> => {
    try {
      // 讀取配置檔案
      const readConfigFile = (filePath: string): string => {
        try {
          return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
          console.warn(`無法讀取配置檔案 ${filePath}:`, error);
          return '配置檔案讀取失敗';
        }
      };

      // 從 ConfigMap 讀取配置檔案
      const configPath = '/app/configs';
      const configs = {
        gatewayMainConfig: readConfigFile(path.join(configPath, 'gateway-main.yaml')),
        gatewayK8sConfig: readConfigFile(path.join(configPath, 'gateway-k8s.yaml')),
        consulMainConfig: readConfigFile(path.join(configPath, 'consul-main.json')),
        consulK8sConfig: readConfigFile(path.join(configPath, 'consul-k8s.yaml')),
        consulRbacConfig: readConfigFile(path.join(configPath, 'consul-rbac-service.json')),
        consulDroneConfig: readConfigFile(path.join(configPath, 'consul-drone-service.json'))
      };

      // 渲染頁面
      res.render('notepage', configs);
      
    } catch (error) {
      console.error('❌ 處理 notepage 請求時發生錯誤:', error);
      res.status(500).send('頁面載入失敗');
    }
  };

  /**
   * 重定向到文檔首頁
   */
  public static redirectToHomepage = (_req: Request, res: Response): void => {
    res.redirect('/docs');
  };
}