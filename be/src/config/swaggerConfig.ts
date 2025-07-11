import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 讀取獨立的 Swagger YAML 文檔
const swaggerPath = path.join(__dirname, '../../docs/swagger.yaml');

let specs: any;

try {
  const swaggerDocument = fs.readFileSync(swaggerPath, 'utf8');
  specs = yaml.load(swaggerDocument);
  
  // 動態更新服務器 URL 根據環境變數
  if (specs.servers) {
    specs.servers[0].url = process.env.API_BASE_URL || 'http://localhost:8000';
  }
  
  console.log('✅ Swagger specification loaded from YAML file');
} catch (error) {
  console.error('❌ Error loading Swagger YAML file:', error);
  // 提供默認的基本規格以避免應用程式崩潰
  specs = {
    openapi: '3.0.0',
    info: {
      title: 'AIOT API',
      version: '1.0.0',
      description: 'API documentation for AIOT project (fallback)',
    },
    paths: {},
  };
}

export { specs };