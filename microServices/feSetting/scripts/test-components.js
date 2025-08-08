#!/usr/bin/env node

/**
 * 組件測試腳本 - 測試各個權限組件
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 獲取當前文件路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模擬 Express 環境
process.env.NODE_ENV = 'test';

// 測試 Redis 權限服務
async function testRedisPermissionService() {
  console.log('🔍 測試 Redis 權限服務...');
  
  try {
    // 動態導入 ES6 模組 (如果使用 TypeScript 編譯後的 JS)
    const RedisModule = await import('../dist/services/RedisPermissionService.js');
    const { redisPermissionService } = RedisModule;
    
    // 測試連接
    if (!redisPermissionService.isConnected()) {
      console.log('⚠️  Redis 未連接，跳過 Redis 測試');
      return false;
    }
    
    // 測試快取用戶權限
    const testPermissions = {
      userId: 999,
      roles: ['test-user'],
      permissions: ['read'],
      level: 1,
      lastUpdated: new Date().toISOString()
    };
    
    await redisPermissionService.cacheUserPermissions(testPermissions);
    const cached = await redisPermissionService.getCachedUserPermissions(999);
    
    if (cached && cached.userId === 999) {
      console.log('✅ Redis 權限快取測試通過');
      
      // 清理測試資料
      await redisPermissionService.clearUserPermissions(999);
      return true;
    } else {
      console.log('❌ Redis 權限快取測試失敗');
      return false;
    }
  } catch (error) {
    console.log(`❌ Redis 測試錯誤: ${error.message}`);
    return false;
  }
}

// 測試 OPA 政策服務
async function testOPAPolicyService() {
  console.log('🔍 測試 OPA 政策服務...');
  
  try {
    const OPAModule = await import('../dist/services/OPAPolicyService.js');
    const { opaPolicyService } = OPAModule;
    
    // 測試健康檢查
    const isHealthy = await opaPolicyService.checkHealth();
    
    if (!isHealthy) {
      console.log('⚠️  OPA 服務不可用，跳過 OPA 測試');
      return false;
    }
    
    // 測試政策評估
    const testInput = {
      user: {
        id: 1,
        username: 'test-admin',
        roles: ['admin'],
        level: 10
      },
      resource: 'user_preferences',
      action: 'read',
      context: {
        currentTime: new Date().toISOString(),
        timezone: 'Asia/Taipei'
      }
    };
    
    const result = await opaPolicyService.evaluate(testInput);
    
    if (result && typeof result.allow === 'boolean') {
      console.log(`✅ OPA 政策評估測試通過 (allow: ${result.allow})`);
      return true;
    } else {
      console.log('❌ OPA 政策評估測試失敗');
      return false;
    }
  } catch (error) {
    console.log(`❌ OPA 測試錯誤: ${error.message}`);
    return false;
  }
}

// 測試權限中間件模組載入
async function testMiddlewareModules() {
  console.log('🔍 測試權限中間件模組...');
  
  try {
    // 測試簡單權限中間件
    const SimpleModule = await import('../dist/middlewares/SimplePermissionMiddleware.js');
    if (SimpleModule.SimplePermissionMiddleware) {
      console.log('✅ 簡單權限中間件載入成功');
    }
    
    // 測試增強權限中間件
    const EnhancedModule = await import('../dist/middlewares/EnhancedPermissionMiddleware.js');
    if (EnhancedModule.EnhancedPermissionMiddleware) {
      console.log('✅ 增強權限中間件載入成功');
    }
    
    // 測試最終權限中間件
    const FinalModule = await import('../dist/middlewares/FinalPermissionMiddleware.js');
    if (FinalModule.FinalPermissionMiddleware) {
      console.log('✅ 最終權限中間件載入成功');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ 中間件模組測試錯誤: ${error.message}`);
    return false;
  }
}

// 檢查政策文件
function testPolicyFiles() {
  console.log('🔍 檢查政策文件...');
  
  try {
    // 檢查 Rego 政策文件
    const regoPath = path.join(__dirname, '../policies/user_preference_policy.rego');
    if (fs.existsSync(regoPath)) {
      const regoContent = fs.readFileSync(regoPath, 'utf8');
      if (regoContent.includes('package aiot.fesetting.userpreference')) {
        console.log('✅ Rego 政策文件檢查通過');
      } else {
        console.log('❌ Rego 政策文件格式不正確');
        return false;
      }
    } else {
      console.log('❌ Rego 政策文件不存在');
      return false;
    }
    
    // 檢查數據文件
    const dataPath = path.join(__dirname, '../opa-data/data.json');
    if (fs.existsSync(dataPath)) {
      const dataContent = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (dataContent.users && dataContent.departments) {
        console.log('✅ OPA 數據文件檢查通過');
      } else {
        console.log('❌ OPA 數據文件格式不正確');
        return false;
      }
    } else {
      console.log('❌ OPA 數據文件不存在');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ 政策文件檢查錯誤: ${error.message}`);
    return false;
  }
}

// 主測試函數
async function main() {
  console.log('🚀 開始組件測試');
  console.log('=====================================');
  
  const results = [];
  
  // 測試政策文件
  results.push({ name: '政策文件', success: testPolicyFiles() });
  
  // 測試中間件模組
  results.push({ name: '中間件模組', success: await testMiddlewareModules() });
  
  // 測試 Redis 服務
  results.push({ name: 'Redis 權限服務', success: await testRedisPermissionService() });
  
  // 測試 OPA 服務
  results.push({ name: 'OPA 政策服務', success: await testOPAPolicyService() });
  
  // 總結
  console.log('\n📊 組件測試總結');
  console.log('=====================================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n通過: ${passed}/${total} (${((passed/total) * 100).toFixed(1)}%)`);
  
  if (passed === total) {
    console.log('🎉 所有組件測試通過！');
  } else {
    console.log('⚠️  部分組件測試失敗，請檢查相關配置。');
  }
  
  return passed === total;
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };