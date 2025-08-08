#!/usr/bin/env node

/**
 * 三階段權限系統測試腳本
 * 
 * 測試：
 * 1. 簡單 JWT 角色檢查
 * 2. Redis 快取權限檢查
 * 3. OPA 政策評估
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3003';
const JWT_SECRET = 'aiot-jwt-secret-key-2024';

// 測試用戶數據
const testUsers = [
  {
    id: 1,
    username: 'admin',
    roles: ['admin', 'superadmin'],
    departmentId: 1,
    level: 10
  },
  {
    id: 2,
    username: 'user1',
    roles: ['user'],
    departmentId: 2,
    level: 1
  },
  {
    id: 3,
    username: 'manager1',
    roles: ['manager', 'user'],
    departmentId: 2,
    level: 5
  }
];

// 生成 JWT Token
function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

// 創建 HTTP 客戶端
function createClient(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

// 測試用例
const testCases = [
  // 基本 JWT 權限測試
  {
    name: '管理員讀取所有用戶偏好設定',
    user: testUsers[0], // admin
    method: 'GET',
    url: '/api/user-preferences',
    expectedStatus: 200
  },
  {
    name: '普通用戶讀取所有用戶偏好設定 (應被拒絕)',
    user: testUsers[1], // user1
    method: 'GET',
    url: '/api/user-preferences',
    expectedStatus: 403
  },
  
  // 資源擁有權測試
  {
    name: '用戶讀取自己的偏好設定',
    user: testUsers[1], // user1 (id: 2)
    method: 'GET',
    url: '/api/user-preferences/user/2',
    expectedStatus: 200
  },
  {
    name: '用戶讀取他人的偏好設定 (應被拒絕)',
    user: testUsers[1], // user1 (id: 2)
    method: 'GET',
    url: '/api/user-preferences/user/3',
    expectedStatus: 403
  },
  
  // 複雜權限測試 - 時間限制
  {
    name: '營業時間內的操作',
    user: testUsers[2], // manager1
    method: 'GET',
    url: '/api/user-preferences/user/3',
    expectedStatus: 200,
    headers: {
      'x-timezone': 'Asia/Taipei'
    }
  },
  
  // 緊急覆蓋測試
  {
    name: '緊急情況覆蓋權限',
    user: { ...testUsers[1], roles: ['user', 'emergency_responder'] },
    method: 'GET',
    url: '/api/user-preferences',
    expectedStatus: 200,
    headers: {
      'x-emergency': 'true'
    }
  }
];

// 執行單個測試用例
async function runTestCase(testCase) {
  try {
    console.log(`\n測試: ${testCase.name}`);
    
    const token = generateToken(testCase.user);
    const client = createClient(token);
    
    const config = {
      method: testCase.method.toLowerCase(),
      url: testCase.url,
      headers: testCase.headers || {}
    };
    
    if (testCase.data) {
      config.data = testCase.data;
    }
    
    const response = await client.request(config);
    
    const success = response.status === testCase.expectedStatus;
    console.log(`結果: ${success ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`預期狀態: ${testCase.expectedStatus}, 實際狀態: ${response.status}`);
    
    if (success) {
      console.log(`回應時間: ${response.headers['x-response-time'] || 'N/A'}`);
      if (response.data?.evaluationTime) {
        console.log(`權限評估時間: ${response.data.evaluationTime}ms`);
      }
    }
    
    return success;
  } catch (error) {
    const success = error.response?.status === testCase.expectedStatus;
    console.log(`結果: ${success ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`預期狀態: ${testCase.expectedStatus}, 實際狀態: ${error.response?.status || 'ERROR'}`);
    
    if (!success) {
      console.log(`錯誤: ${error.message}`);
      if (error.response?.data) {
        console.log(`錯誤詳情:`, error.response.data);
      }
    }
    
    return success;
  }
}

// 檢查服務狀態
async function checkServiceHealth() {
  console.log('檢查服務健康狀態...');
  
  const services = [
    { name: 'feSetting Service', url: `${BASE_URL}/health` },
    { name: 'Redis', url: `${BASE_URL}/api/health/redis` },
    { name: 'OPA', url: 'http://localhost:8181/health' }
  ];
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      console.log(`${service.name}: ✅ 健康 (${response.status})`);
    } catch (error) {
      console.log(`${service.name}: ❌ 不可用 (${error.message})`);
    }
  }
}

// 測試 Redis 快取性能
async function testCachePerformance() {
  console.log('\n測試 Redis 快取性能...');
  
  const token = generateToken(testUsers[0]);
  const client = createClient(token);
  
  const testUrl = '/api/user-preferences';
  
  // 第一次請求 (無快取)
  const start1 = Date.now();
  try {
    await client.get(testUrl);
    const time1 = Date.now() - start1;
    console.log(`第一次請求 (無快取): ${time1}ms`);
  } catch (error) {
    console.log(`第一次請求失敗: ${error.message}`);
  }
  
  // 第二次請求 (有快取)
  const start2 = Date.now();
  try {
    await client.get(testUrl);
    const time2 = Date.now() - start2;
    console.log(`第二次請求 (有快取): ${time2}ms`);
  } catch (error) {
    console.log(`第二次請求失敗: ${error.message}`);
  }
}

// 主測試函數
async function main() {
  console.log('🚀 開始三階段權限系統測試');
  console.log('=====================================');
  
  // 檢查服務健康狀態
  await checkServiceHealth();
  
  console.log('\n📋 執行功能測試...');
  console.log('=====================================');
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    const success = await runTestCase(testCase);
    if (success) passed++;
    
    // 等待一秒避免請求過快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 性能測試
  await testCachePerformance();
  
  // 總結
  console.log('\n📊 測試總結');
  console.log('=====================================');
  console.log(`總測試數: ${total}`);
  console.log(`通過測試: ${passed}`);
  console.log(`失敗測試: ${total - passed}`);
  console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 所有測試通過！三階段權限系統運行正常。');
  } else {
    console.log('⚠️  部分測試失敗，請檢查系統配置。');
  }
}

// 錯誤處理
process.on('unhandledRejection', (error) => {
  console.error('未處理的 Promise 拒絕:', error);
  process.exit(1);
});

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  testCases,
  runTestCase,
  checkServiceHealth,
  testCachePerformance
};