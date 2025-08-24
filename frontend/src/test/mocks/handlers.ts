/**
 * @fileoverview MSW API 處理器
 * @description 模擬所有 API 端點回應，用於測試環境
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { http, HttpResponse } from 'msw';
import { authFixtures } from '../fixtures/auth.fixtures';
import { userFixtures } from '../fixtures/user.fixtures';
import { droneFixtures } from '../fixtures/drone.fixtures';
import { rbacFixtures } from '../fixtures/rbac.fixtures';

const API_BASE = 'http://localhost:8000/api';

export const handlers = [
  // ======================================================================
  // 認證相關 API
  // ======================================================================
  
  // 登入
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const { username, password } = await request.json() as { username: string; password: string };
    
    if (username === 'admin' && password === 'admin') {
      return HttpResponse.json({
        status: 200,
        success: true,
        message: '登入成功',
        data: authFixtures.loginSuccess,
        timestamp: new Date().toISOString()
      });
    }
    
    return HttpResponse.json({
      status: 401,
      success: false,
      message: '用戶名或密碼錯誤',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }),

  // 登出
  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: '登出成功',
      timestamp: new Date().toISOString()
    });
  }),

  // 檢查用戶狀態
  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const cookie = request.headers.get('cookie');
    if (cookie?.includes('auth_token')) {
      return HttpResponse.json({
        status: 200,
        success: true,
        message: '用戶已認證',
        data: authFixtures.currentUser,
        timestamp: new Date().toISOString()
      });
    }
    
    return HttpResponse.json({
      status: 401,
      success: false,
      message: '未認證',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }),

  // ======================================================================
  // 用戶管理 API
  // ======================================================================
  
  // 獲取用戶列表
  http.get(`${API_BASE}/rbac/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    return HttpResponse.json({
      status: 200,
      success: true,
      message: '獲取用戶列表成功',
      data: {
        users: userFixtures.userList.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: userFixtures.userList.length,
          pages: Math.ceil(userFixtures.userList.length / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  }),

  // 創建用戶
  http.post(`${API_BASE}/rbac/users`, async ({ request }) => {
    const userData = await request.json();
    const newUser = {
      id: crypto.randomUUID(),
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return HttpResponse.json({
      status: 201,
      success: true,
      message: '用戶創建成功',
      data: newUser,
      timestamp: new Date().toISOString()
    });
  }),

  // ======================================================================
  // 無人機相關 API
  // ======================================================================
  
  // 獲取無人機狀態
  http.get(`${API_BASE}/drone/status`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    return HttpResponse.json({
      status: 200,
      success: true,
      message: '獲取無人機狀態成功',
      data: droneFixtures.statusList.slice(0, limit),
      timestamp: new Date().toISOString()
    });
  }),

  // 獲取無人機位置
  http.get(`${API_BASE}/drone/positions`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    return HttpResponse.json({
      status: 200,
      success: true,
      message: '獲取無人機位置成功',
      data: droneFixtures.positionList.slice(0, limit),
      timestamp: new Date().toISOString()
    });
  }),

  // 發送無人機命令
  http.post(`${API_BASE}/drone/commands`, async ({ request }) => {
    const commandData = await request.json();
    const newCommand = {
      id: crypto.randomUUID(),
      ...commandData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    return HttpResponse.json({
      status: 201,
      success: true,
      message: '命令發送成功',
      data: newCommand,
      timestamp: new Date().toISOString()
    });
  }),

  // ======================================================================
  // RBAC 相關 API
  // ======================================================================
  
  // 獲取角色列表
  http.get(`${API_BASE}/rbac/roles`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: '獲取角色列表成功',
      data: rbacFixtures.roleList,
      timestamp: new Date().toISOString()
    });
  }),

  // 獲取權限列表
  http.get(`${API_BASE}/rbac/permissions`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: '獲取權限列表成功',
      data: rbacFixtures.permissionList,
      timestamp: new Date().toISOString()
    });
  }),

  // ======================================================================
  // 健康檢查 API
  // ======================================================================
  
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      status: 200,
      success: true,
      message: 'Gateway Service 運行正常',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  }),

  // ======================================================================
  // 錯誤處理 - 未匹配的請求
  // ======================================================================
  
  http.all('*', ({ request }) => {
    console.error(`未處理的請求: ${request.method} ${request.url}`);
    return HttpResponse.json({
      status: 404,
      success: false,
      message: `API 端點不存在: ${request.method} ${request.url}`,
      timestamp: new Date().toISOString()
    }, { status: 404 });
  }),
];