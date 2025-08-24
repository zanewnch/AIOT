/**
 * @fileoverview API Integration 測試
 * @description 測試各種 API 端點的整合行為
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient } from '../utils/test-utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { QueryClientProvider } from '@tanstack/react-query';

const API_BASE = 'http://localhost:8000/api';

// Mock hooks (我們需要實際的 hook 實現來測試)
// 這裡我們創建一個簡單的測試 hook
const useApiQuery = (endpoint: string) => {
  const queryClient = new QueryClient();
  
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };
};

describe('API Integration 測試', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('健康檢查 API', () => {
    it('應該正確回應健康檢查請求', async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Gateway Service 運行正常');
      expect(data.data).toHaveProperty('timestamp');
    });

    it('應該處理健康檢查失敗', async () => {
      server.use(
        http.get(`${API_BASE}/health`, () => {
          return HttpResponse.json({
            status: 503,
            success: false,
            message: '服務不可用',
            timestamp: new Date().toISOString()
          }, { status: 503 });
        })
      );

      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.message).toBe('服務不可用');
    });
  });

  describe('用戶管理 API', () => {
    it('應該正確獲取用戶列表', async () => {
      const response = await fetch(`${API_BASE}/rbac/users?page=1&limit=10`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('users');
      expect(data.data).toHaveProperty('pagination');
      expect(Array.isArray(data.data.users)).toBe(true);
      expect(data.data.pagination).toHaveProperty('page', 1);
      expect(data.data.pagination).toHaveProperty('limit', 10);
    });

    it('應該支援分頁參數', async () => {
      const response = await fetch(`${API_BASE}/rbac/users?page=2&limit=5`);
      const data = await response.json();

      expect(data.data.pagination.page).toBe(2);
      expect(data.data.pagination.limit).toBe(5);
    });

    it('應該處理用戶創建請求', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await fetch(`${API_BASE}/rbac/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      expect(response.status).toBe(200); // MSW 預設返回 200
      expect(data.success).toBe(true);
      expect(data.message).toBe('用戶創建成功');
      expect(data.data).toHaveProperty('id');
      expect(data.data.username).toBe(newUser.username);
    });
  });

  describe('無人機 API', () => {
    it('應該正確獲取無人機狀態', async () => {
      const response = await fetch(`${API_BASE}/drone/status?limit=10`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const drone = data.data[0];
        expect(drone).toHaveProperty('id');
        expect(drone).toHaveProperty('name');
        expect(drone).toHaveProperty('status');
        expect(drone).toHaveProperty('battery_level');
        expect(drone).toHaveProperty('signal_strength');
      }
    });

    it('應該正確獲取無人機位置', async () => {
      const response = await fetch(`${API_BASE}/drone/positions?limit=10`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const position = data.data[0];
        expect(position).toHaveProperty('latitude');
        expect(position).toHaveProperty('longitude');
        expect(position).toHaveProperty('altitude');
        expect(position).toHaveProperty('timestamp');
      }
    });

    it('應該處理無人機命令發送', async () => {
      const command = {
        drone_id: 'drone_001',
        command_type: 'takeoff',
        parameters: {}
      };

      const response = await fetch(`${API_BASE}/drone/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      const data = await response.json();

      expect(response.status).toBe(200); // MSW 預設返回 200
      expect(data.success).toBe(true);
      expect(data.message).toBe('命令發送成功');
      expect(data.data).toHaveProperty('id');
      expect(data.data.status).toBe('pending');
    });
  });

  describe('RBAC API', () => {
    it('應該正確獲取角色列表', async () => {
      const response = await fetch(`${API_BASE}/rbac/roles`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const role = data.data[0];
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('display_name');
        expect(role).toHaveProperty('permissions');
        expect(Array.isArray(role.permissions)).toBe(true);
      }
    });

    it('應該正確獲取權限列表', async () => {
      const response = await fetch(`${API_BASE}/rbac/permissions`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const permission = data.data[0];
        expect(permission).toHaveProperty('id');
        expect(permission).toHaveProperty('name');
        expect(permission).toHaveProperty('display_name');
        expect(permission).toHaveProperty('resource');
        expect(permission).toHaveProperty('action');
      }
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理 404 錯誤', async () => {
      const response = await fetch(`${API_BASE}/nonexistent`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toContain('API 端點不存在');
    });

    it('應該處理無效的 JSON 請求', async () => {
      server.use(
        http.post(`${API_BASE}/rbac/users`, () => {
          return HttpResponse.json({
            status: 400,
            success: false,
            message: '無效的請求格式',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        })
      );

      const response = await fetch(`${API_BASE}/rbac/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('認證相關 API', () => {
    it('應該處理未認證的請求', async () => {
      server.use(
        http.get(`${API_BASE}/auth/me`, ({ request }) => {
          const cookie = request.headers.get('cookie');
          if (!cookie?.includes('auth_token')) {
            return HttpResponse.json({
              status: 401,
              success: false,
              message: '未認證',
              timestamp: new Date().toISOString()
            }, { status: 401 });
          }
          
          return HttpResponse.json({
            status: 200,
            success: true,
            message: '用戶已認證',
            timestamp: new Date().toISOString()
          });
        })
      );

      // 測試未認證請求
      const responseUnauth = await fetch(`${API_BASE}/auth/me`);
      const dataUnauth = await responseUnauth.json();

      expect(responseUnauth.status).toBe(401);
      expect(dataUnauth.success).toBe(false);
      expect(dataUnauth.message).toBe('未認證');

      // 測試已認證請求
      const responseAuth = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Cookie': 'auth_token=valid_token'
        }
      });
      const dataAuth = await responseAuth.json();

      expect(responseAuth.status).toBe(200);
      expect(dataAuth.success).toBe(true);
      expect(dataAuth.message).toBe('用戶已認證');
    });

    it('應該處理登出請求', async () => {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST'
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('登出成功');
    });
  });

  describe('請求格式驗證', () => {
    it('所有成功回應應該有統一格式', async () => {
      const endpoints = [
        { url: `${API_BASE}/health`, method: 'GET' },
        { url: `${API_BASE}/rbac/roles`, method: 'GET' },
        { url: `${API_BASE}/rbac/permissions`, method: 'GET' },
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint.url, { method: endpoint.method });
        const data = await response.json();

        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.status).toBe('number');
        expect(typeof data.success).toBe('boolean');
        expect(typeof data.message).toBe('string');
        expect(typeof data.timestamp).toBe('string');
      }
    });

    it('所有錯誤回應應該有統一格式', async () => {
      server.use(
        http.get(`${API_BASE}/test-error`, () => {
          return HttpResponse.json({
            status: 500,
            success: false,
            message: '測試錯誤',
            timestamp: new Date().toISOString()
          }, { status: 500 });
        })
      );

      const response = await fetch(`${API_BASE}/test-error`);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('status', 500);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('並發請求處理', () => {
    it('應該正確處理多個並發請求', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        fetch(`${API_BASE}/health?test=${i}`)
      );

      const responses = await Promise.all(promises);
      
      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });
});