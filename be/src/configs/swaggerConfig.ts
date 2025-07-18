/**
 * @fileoverview Swagger API 文檔配置模組
 * 此模組負責載入和配置 Swagger/OpenAPI 規格文檔
 * 用於生成和提供 RESTful API 的互動式文檔
 */

// 匯入 js-yaml 函式庫用於解析 YAML 格式的 Swagger 文檔
import yaml from 'js-yaml';
// 匯入 fs 模組用於檔案系統操作
import fs from 'fs';
// 匯入 path 模組用於處理檔案路徑
import path from 'path';
// 匯入 fileURLToPath 用於將文件 URL 轉換為檔案路徑
import { fileURLToPath } from 'url';

// 將當前模組的 URL 轉換為檔案路徑
const __filename = fileURLToPath(import.meta.url);
// 獲取當前檔案的目錄路徑
const __dirname = path.dirname(__filename);

// 構建 Swagger YAML 文檔的完整路徑
const swaggerPath = path.join(__dirname, '../assets/swagger.yaml');

// 宣告 Swagger 規格物件變數
let specs: any;

// 嘗試載入 Swagger YAML 文檔
try {
  // 同步讀取 Swagger YAML 檔案內容
  const swaggerDocument = fs.readFileSync(swaggerPath, 'utf8');
  // 將 YAML 內容解析為 JavaScript 物件
  specs = yaml.load(swaggerDocument);
  
  // 檢查是否存在 servers 配置
  if (specs.servers) {
    // 根據環境變數動態更新 API 伺服器 URL，預設為本地端
    specs.servers[0].url = process.env.API_BASE_URL || 'http://localhost:8000';
  }
  
  // 記錄成功載入訊息
  console.log('✅ Swagger specification loaded from YAML file');
} catch (error) {
  // 記錄載入錯誤訊息
  console.error('❌ Error loading Swagger YAML file:', error);
  // 提供預設的基本 OpenAPI 規格作為後備方案，避免應用程式崩潰
  specs = {
    // 指定 OpenAPI 版本
    openapi: '3.0.0',
    // API 基本資訊
    info: {
      // API 標題
      title: 'AIOT API',
      // API 版本
      version: '1.0.0',
      // API 描述，標明這是後備版本
      description: 'API documentation for AIOT project (fallback)',
    },
    // 空的路徑物件，作為預設值
    paths: {},
  };
}

// 匯出 Swagger 規格物件供其他模組使用
export { specs };