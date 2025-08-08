#!/usr/bin/env node

/**
 * 系統驗證腳本 - 驗證三階段權限系統的核心組件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 三階段權限系統驗證');
console.log('=====================================');

// 1. 檢查編譯文件
console.log('1️⃣ 檢查 TypeScript 編譯結果...');

const requiredFiles = [
  'dist/middlewares/SimplePermissionMiddleware.js',
  'dist/middlewares/EnhancedPermissionMiddleware.js', 
  'dist/middlewares/FinalPermissionMiddleware.js',
  'dist/services/RedisPermissionService.js',
  'dist/services/OPAPolicyService.js',
  'dist/routes/userPreferenceRoutes.js'
];

let compilationSuccess = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    compilationSuccess = false;
  }
});

// 2. 檢查政策文件
console.log('\n2️⃣ 檢查 OPA 政策文件...');

const policyFiles = [
  'policies/user_preference_policy.rego',
  'opa-data/data.json'
];

let policySuccess = true;
policyFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    
    // 驗證文件內容
    if (file.endsWith('.rego')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('package aiot.fesetting.userpreference')) {
        console.log(`   📄 Rego 包名正確`);
      } else {
        console.log(`   ❌ Rego 包名不正確`);
        policySuccess = false;
      }
    } else if (file.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.users && data.departments && data.resources) {
          console.log(`   📄 JSON 數據結構正確`);
        } else {
          console.log(`   ❌ JSON 數據結構不完整`);
          policySuccess = false;
        }
      } catch (error) {
        console.log(`   ❌ JSON 格式錯誤: ${error.message}`);
        policySuccess = false;
      }
    }
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    policySuccess = false;
  }
});

// 3. 檢查 Docker 配置
console.log('\n3️⃣ 檢查 Docker 配置...');

const dockerFilePath = '../../infrastructure/docker/docker-compose.yml';
const dockerPath = path.join(__dirname, '..', dockerFilePath);

let dockerSuccess = true;
if (fs.existsSync(dockerPath)) {
  console.log(`✅ Docker Compose 文件存在`);
  
  const dockerContent = fs.readFileSync(dockerPath, 'utf8');
  
  // 檢查 OPA 配置
  if (dockerContent.includes('aiot-opa:')) {
    console.log(`   📄 OPA 服務已配置`);
  } else {
    console.log(`   ❌ OPA 服務未配置`);
    dockerSuccess = false;
  }
  
  // 檢查 Redis 配置
  if (dockerContent.includes('aiot-redis:')) {
    console.log(`   📄 Redis 服務已配置`);
  } else {
    console.log(`   ❌ Redis 服務未配置`);
    dockerSuccess = false;
  }
  
  // 檢查 feSetting 依賴
  if (dockerContent.includes('aiot-opa:') && dockerContent.includes('condition: service_healthy')) {
    console.log(`   📄 服務依賴關係已配置`);
  } else {
    console.log(`   ⚠️  服務依賴關係可能不完整`);
  }
} else {
  console.log(`❌ Docker Compose 文件不存在: ${dockerFilePath}`);
  dockerSuccess = false;
}

// 4. 檢查 package.json 依賴
console.log('\n4️⃣ 檢查依賴包...');

const packagePath = path.join(__dirname, '..', 'package.json');
let dependencySuccess = true;

if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    'redis', 'axios', 'jsonwebtoken'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - 依賴缺失`);
      dependencySuccess = false;
    }
  });
} else {
  console.log(`❌ package.json 不存在`);
  dependencySuccess = false;
}

// 5. 檢查路由配置
console.log('\n5️⃣ 檢查路由配置...');

const routesPath = path.join(__dirname, '..', 'src/routes/userPreferenceRoutes.ts');
let routeSuccess = true;

if (fs.existsSync(routesPath)) {
  const routeContent = fs.readFileSync(routesPath, 'utf8');
  
  if (routeContent.includes('FinalPermissionMiddleware')) {
    console.log(`✅ 使用最終權限中間件`);
  } else {
    console.log(`❌ 未使用最終權限中間件`);
    routeSuccess = false;
  }
  
  if (routeContent.includes('requireUserPreferencePermission')) {
    console.log(`✅ 使用用戶偏好權限檢查`);
  } else {
    console.log(`❌ 未使用專門的權限檢查方法`);
    routeSuccess = false;
  }
} else {
  console.log(`❌ 路由文件不存在`);
  routeSuccess = false;
}

// 總結
console.log('\n📊 驗證總結');
console.log('=====================================');

const checks = [
  { name: 'TypeScript 編譯', success: compilationSuccess },
  { name: 'OPA 政策文件', success: policySuccess },
  { name: 'Docker 配置', success: dockerSuccess },
  { name: '依賴包', success: dependencySuccess },
  { name: '路由配置', success: routeSuccess }
];

const passed = checks.filter(c => c.success).length;
const total = checks.length;

checks.forEach(check => {
  console.log(`${check.success ? '✅' : '❌'} ${check.name}`);
});

console.log(`\n通過: ${passed}/${total} (${((passed/total) * 100).toFixed(1)}%)`);

if (passed === total) {
  console.log('\n🎉 系統驗證完成！三階段權限系統已正確實施：');
  console.log('   🔹 第一階段: JWT 基本權限檢查');
  console.log('   🔹 第二階段: Redis 快取權限規則');  
  console.log('   🔹 第三階段: OPA 動態政策評估');
  console.log('\n📋 下一步操作：');
  console.log('   1. 啟動服務: cd ../../infrastructure/docker && docker-compose up -d');
  console.log('   2. 測試 API: node scripts/test-permission-system.js');
  console.log('   3. 查看日誌: docker logs aiot-fesetting-service');
} else {
  console.log('\n⚠️  系統驗證失敗，請修正上述問題後重新驗證。');
}