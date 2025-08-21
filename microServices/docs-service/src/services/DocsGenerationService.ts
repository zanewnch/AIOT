/**
 * @fileoverview 文檔生成服務 - 智能緩存和自動生成 TypeDoc 文檔
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { availableServices, config } from '../config/index.js';

interface GenerationStatus {
  isGenerating: boolean;
  lastGenerated: Date | null;
  lastChecked: Date | null;
}

export class DocsGenerationSvc {
  private static generationStatus = new Map<string, GenerationStatus>();
  private static globalLock = false;

  /**
   * 檢查所有微服務是否需要更新文檔
   */
  public static async checkIfDocsNeedUpdate(): Promise<boolean> {
    try {
      for (const service of availableServices) {
        const serviceName = this.getServiceFolderName(service.name);
        if (await this.checkServiceNeedsUpdate(serviceName)) {
          console.log(`📝 服務 ${service.name} 需要更新文檔`);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('檢查文檔更新狀態時發生錯誤:', error);
      return false; // 發生錯誤時不強制更新
    }
  }

  /**
   * 檢查單個服務是否需要更新
   */
  private static async checkServiceNeedsUpdate(serviceName: string): Promise<boolean> {
    try {
      // 微服務完整目錄掛載到 /app/microservices/ 目錄
      const serviceDir = path.join('/app/microservices', serviceName);
        
      const docsDir = path.join(serviceDir, 'docs');
      const srcDir = path.join(serviceDir, 'src');

      // 檢查源代碼目錄是否存在
      try {
        await fs.access(srcDir);
      } catch {
        console.log(`⚠️ 服務 ${serviceName} 的源代碼目錄不存在: ${srcDir}`);
        return false;
      }

      // 檢查文檔目錄是否存在
      let docsExists = false;
      try {
        await fs.access(docsDir);
        docsExists = true;
      } catch {
        console.log(`📄 服務 ${serviceName} 的文檔目錄不存在，需要生成`);
        return true;
      }

      if (!docsExists) {
        return true;
      }

      // 獲取最新的源文件修改時間
      const latestSrcTime = await this.getLatestModificationTime(srcDir);
      
      // 獲取文檔目錄的修改時間
      const docsStats = await fs.stat(docsDir);
      const docsTime = docsStats.mtime;

      // 如果源文件比文檔新，則需要更新
      const needsUpdate = latestSrcTime > docsTime;
      
      if (needsUpdate) {
        console.log(`⏰ 服務 ${serviceName} 源文件更新時間: ${latestSrcTime.toISOString()}`);
        console.log(`⏰ 服務 ${serviceName} 文檔更新時間: ${docsTime.toISOString()}`);
      }

      return needsUpdate;
    } catch (error) {
      console.error(`檢查服務 ${serviceName} 更新狀態時發生錯誤:`, error);
      return false;
    }
  }

  /**
   * 獲取目錄中最新的文件修改時間
   */
  private static async getLatestModificationTime(dir: string): Promise<Date> {
    let latestTime = new Date(0);

    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          // 遞歸檢查子目錄
          const subDirLatest = await this.getLatestModificationTime(itemPath);
          if (subDirLatest > latestTime) {
            latestTime = subDirLatest;
          }
        } else if (item.isFile() && this.isSourceFile(item.name)) {
          // 只檢查源代碼文件
          const stats = await fs.stat(itemPath);
          if (stats.mtime > latestTime) {
            latestTime = stats.mtime;
          }
        }
      }
    } catch (error) {
      console.error(`讀取目錄 ${dir} 時發生錯誤:`, error);
    }

    return latestTime;
  }

  /**
   * 判斷是否為源代碼文件
   */
  private static isSourceFile(filename: string): boolean {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    const excludePatterns = ['node_modules', '.git', 'dist', 'build', 'docs'];
    
    // 排除特定目錄和文件
    if (excludePatterns.some(pattern => filename.includes(pattern))) {
      return false;
    }
    
    return sourceExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * 生成所有微服務的文檔
   */
  public static async generateAllDocs(): Promise<boolean> {
    if (this.globalLock) {
      console.log('📋 文檔生成已在進行中，跳過重複請求');
      return true;
    }

    this.globalLock = true;
    const startTime = Date.now();
    
    try {
      console.log('🚀 開始生成所有微服務文檔...');
      
      const results = await Promise.allSettled(
        availableServices.map(async (service) => {
          const serviceName = this.getServiceFolderName(service.name);
          return this.generateServiceDocs(serviceName);
        })
      );

      // 檢查結果
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const totalCount = availableServices.length;
      
      const duration = Date.now() - startTime;
      console.log(`✅ 文檔生成完成！成功: ${successCount}/${totalCount}, 耗時: ${duration}ms`);
      
      return successCount === totalCount;
    } catch (error) {
      console.error('❌ 文檔生成過程中發生錯誤:', error);
      return false;
    } finally {
      this.globalLock = false;
    }
  }

  /**
   * 生成單個服務的文檔
   */
  private static async generateServiceDocs(serviceName: string): Promise<boolean> {
    const status = this.generationStatus.get(serviceName) || {
      isGenerating: false,
      lastGenerated: null,
      lastChecked: null
    };

    if (status.isGenerating) {
      console.log(`⏳ 服務 ${serviceName} 文檔生成已在進行中`);
      return true;
    }

    status.isGenerating = true;
    this.generationStatus.set(serviceName, status);

    try {
      // 微服務完整目錄掛載到 /app/microservices/ 目錄
      const serviceDir = path.join('/app/microservices', serviceName);
      
      // 檢查服務目錄是否存在
      try {
        await fs.access(serviceDir);
      } catch {
        console.log(`⚠️ 跳過不存在的服務: ${serviceName}`);
        return false;
      }

      // 檢查是否有 package.json 和 TypeDoc 配置
      const packageJsonPath = path.join(serviceDir, 'package.json');
      try {
        await fs.access(packageJsonPath);
      } catch {
        console.log(`⚠️ 服務 ${serviceName} 沒有 package.json，跳過文檔生成`);
        return false;
      }

      console.log(`📚 正在生成服務 ${serviceName} 的文檔...`);
      
      // 執行 npm run docs:generate
      const success = await this.runDocCommand(serviceDir, serviceName);
      
      if (success) {
        status.lastGenerated = new Date();
        console.log(`✅ 服務 ${serviceName} 文檔生成成功`);
      } else {
        console.log(`❌ 服務 ${serviceName} 文檔生成失敗`);
      }
      
      return success;
    } catch (error) {
      console.error(`生成服務 ${serviceName} 文檔時發生錯誤:`, error);
      return false;
    } finally {
      status.isGenerating = false;
      status.lastChecked = new Date();
      this.generationStatus.set(serviceName, status);
    }
  }

  /**
   * 執行文檔生成命令
   */
  private static async runDocCommand(serviceDir: string, serviceName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('npm', ['run', 'docs:generate'], {
        cwd: serviceDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log(`📄 服務 ${serviceName} TypeDoc 生成成功`);
          resolve(true);
        } else {
          console.error(`❌ 服務 ${serviceName} TypeDoc 生成失敗 (退出碼: ${code})`);
          if (stderr) {
            console.error(`錯誤輸出: ${stderr}`);
          }
          resolve(false);
        }
      });

      process.on('error', (error) => {
        console.error(`執行 npm run docs:generate 時發生錯誤 (${serviceName}):`, error);
        resolve(false);
      });

      // 30 秒超時
      setTimeout(() => {
        process.kill();
        console.error(`⏰ 服務 ${serviceName} 文檔生成超時`);
        resolve(false);
      }, 30000);
    });
  }

  /**
   * 將服務顯示名稱映射到資料夾名稱
   */
  private static getServiceFolderName(serviceName: string): string {
    const serviceNameMapping: Record<string, string> = {
      'RBAC Service': 'rbac-service',
      'Drone Service': 'drone-service',
      'Drone WebSocket Service': 'drone-websocket-service',
      'General Service': 'general-service'
    };

    return serviceNameMapping[serviceName] || serviceName;
  }

  /**
   * 獲取生成狀態（用於監控和調試）
   */
  public static getGenerationStatus(): Map<string, GenerationStatus> {
    return new Map(this.generationStatus);
  }

  /**
   * 清除生成狀態（用於重置）
   */
  public static clearGenerationStatus(): void {
    this.generationStatus.clear();
    this.globalLock = false;
  }
}