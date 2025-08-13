/**
 * @fileoverview 認證 API 整合測試
 * 
 * 測試認證相關的 API 端點，包含：
 * - 用戶註冊流程測試
 * - 用戶登入驗證測試
 * - JWT Token 管理測試
 * - 權限驗證測試
 * - 登出功能測試
 * - 跨服務認證測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { IntegrationTestSetup, TestHelpers } from '../setup/testSetup.js';
import { AxiosResponse } from 'axios';

describe('Authentication API Integration Tests', () => {
    let testSetup: IntegrationTestSetup;

    beforeAll(async () => {
        testSetup = new IntegrationTestSetup();
        await testSetup.setup();
    }, 30000);

    afterAll(async () => {
        await testSetup.teardown();
    }, 10000);

    beforeEach(() => {
        // 清除所有認證信息
        testSetup.httpManager.clearAuthentication();
    });

    describe('用戶註冊 API', () => {
        it('應該成功註冊新用戶', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };

            const response = await client.post('/api/rbac/users', userData);

            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data).toBeDefined();
            expect(response.data.data.username).toBe(userData.username);
            expect(response.data.data.email).toBe(userData.email);
            expect(response.data.data.password_hash).toBeUndefined(); // 不應返回密碼哈希
            expect(response.data.data.is_active).toBe(true);
        });

        it('應該拒絕重複的用戶名', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const existingUser = testSetup.testData?.users[0];
            
            if (!existingUser) {
                throw new Error('No test users available');
            }

            const userData = {
                username: existingUser.username, // 使用已存在的用戶名
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };

            try {
                await client.post('/api/rbac/users', userData);
                fail('Expected request to fail with conflict');
            } catch (error: any) {
                expect(error.response.status).toBe(409);
                expect(error.response.data.message).toContain('使用者名稱已存在');
            }
        });

        it('應該驗證密碼強度', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: '123', // 弱密碼
                confirmPassword: '123'
            };

            try {
                await client.post('/api/rbac/users', userData);
                fail('Expected request to fail with weak password');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('密碼');
            }
        });

        it('應該驗證電子郵件格式', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: 'invalid-email', // 無效的電子郵件格式
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };

            try {
                await client.post('/api/rbac/users', userData);
                fail('Expected request to fail with invalid email');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('電子郵件');
            }
        });
    });

    describe('用戶登入 API', () => {
        it('應該成功登入有效用戶', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const testUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            
            if (!testUser) {
                throw new Error('Admin test user not found');
            }

            const response = await client.post('/api/auth/login', {
                username: testUser.username,
                password: testUser.password
            });

            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data).toBeDefined();
            expect(response.data.data.token).toBeDefined();
            expect(response.data.data.user).toBeDefined();
            expect(response.data.data.user.username).toBe(testUser.username);
            expect(response.data.data.user.email).toBe(testUser.email);
        });

        it('應該拒絕無效的用戶名', async () => {
            const client = testSetup.httpManager.getClient('rbac');

            try {
                await client.post('/api/auth/login', {
                    username: 'nonexistent_user',
                    password: 'anypassword'
                });
                fail('Expected login to fail');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('登入失敗');
            }
        });

        it('應該拒絕錯誤的密碼', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const testUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            
            if (!testUser) {
                throw new Error('Admin test user not found');
            }

            try {
                await client.post('/api/auth/login', {
                    username: testUser.username,
                    password: 'wrongpassword'
                });
                fail('Expected login to fail');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('登入失敗');
            }
        });

        it('應該拒絕已停用的用戶', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            
            // 先創建一個用戶然後停用
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };

            const createResponse = await client.post('/api/rbac/users', userData);
            const userId = createResponse.data.data.id;

            // 停用用戶
            await client.patch(`/api/rbac/users/${userId}/deactivate`);

            // 嘗試登入已停用的用戶
            try {
                await client.post('/api/auth/login', {
                    username: userData.username,
                    password: userData.password
                });
                fail('Expected login to fail for deactivated user');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('用戶已被停用');
            }
        });
    });

    describe('JWT Token 驗證', () => {
        it('應該接受有效的 JWT Token', async () => {
            const authenticatedClient = await testSetup.getAuthenticatedClient('rbac');
            
            // 測試需要認證的端點
            const response = await authenticatedClient.get('/api/auth/me');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.user).toBeDefined();
            expect(response.data.data.user.username).toBe('admin_test');
        });

        it('應該拒絕無效的 JWT Token', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            
            // 設置無效的 token
            client.defaults.headers.common['Authorization'] = 'Bearer invalid-token';

            try {
                await client.get('/api/auth/me');
                fail('Expected request to fail with invalid token');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('認證失敗');
            }
        });

        it('應該拒絕過期的 JWT Token', async () => {
            // 這個測試需要模擬過期的 token，在實際實現中可能需要調整 JWT 的過期時間
            const client = testSetup.httpManager.getClient('rbac');
            
            // 設置一個已知過期的 token（這裡使用一個模擬的過期 token）
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxMDE2MjM5MDIyLCJleHAiOjEwMTYyMzkwMjJ9.invalid';
            client.defaults.headers.common['Authorization'] = `Bearer ${expiredToken}`;

            try {
                await client.get('/api/auth/me');
                fail('Expected request to fail with expired token');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
            }
        });

        it('應該在沒有提供 Token 時要求認證', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            
            // 確保沒有設置 Authorization 標頭
            delete client.defaults.headers.common['Authorization'];

            try {
                await client.get('/api/auth/me');
                fail('Expected request to fail without token');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('認證失敗');
            }
        });
    });

    describe('權限驗證', () => {
        it('管理員應該能訪問所有端點', async () => {
            const adminClient = await testSetup.getAuthenticatedClient('rbac', 'admin_test');
            
            // 測試管理員權限端點
            const response = await adminClient.get('/api/rbac/users');
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
        });

        it('普通用戶應該無法訪問管理員端點', async () => {
            const viewerClient = await testSetup.getAuthenticatedClient('rbac', 'viewer_test');
            
            try {
                await viewerClient.post('/api/rbac/users', {
                    username: 'test',
                    email: 'test@example.com',
                    password: 'password123'
                });
                fail('Expected request to fail due to insufficient permissions');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限不足');
            }
        });

        it('用戶應該能查看自己的資料', async () => {
            const viewerClient = await testSetup.getAuthenticatedClient('rbac', 'viewer_test');
            const viewerUser = testSetup.testData?.users.find(u => u.username === 'viewer_test');
            
            if (!viewerUser) {
                throw new Error('Viewer test user not found');
            }

            const response = await viewerClient.get(`/api/rbac/users/${viewerUser.id}`);
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.username).toBe('viewer_test');
        });

        it('用戶應該無法查看其他人的私密資料', async () => {
            const viewerClient = await testSetup.getAuthenticatedClient('rbac', 'viewer_test');
            const adminUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            
            if (!adminUser) {
                throw new Error('Admin test user not found');
            }

            try {
                await viewerClient.get(`/api/rbac/users/${adminUser.id}/profile`);
                fail('Expected request to fail due to insufficient permissions');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限不足');
            }
        });
    });

    describe('跨服務認證', () => {
        it('RBAC service 的 token 應該在 drone service 中有效', async () => {
            // 在 RBAC service 中登入
            await testSetup.httpManager.authenticateUser('rbac', 'admin_test', 'admin123');
            
            // 使用同一個 token 訪問 drone service
            const droneClient = testSetup.httpManager.getClient('drone');
            const rbacClient = testSetup.httpManager.getClient('rbac');
            
            // 從 RBAC client 複製 Authorization 標頭到 drone client
            const authHeader = rbacClient.defaults.headers.common['Authorization'];
            droneClient.defaults.headers.common['Authorization'] = authHeader;
            
            const response = await droneClient.get('/api/drones');
            TestHelpers.validateApiResponse(response, 200);
        });

        it('應該在 token 過期時統一拒絕訪問', async () => {
            // 這個測試檢查跨服務的 token 過期處理是否一致
            const expiredToken = 'Bearer expired-token';
            
            const services = ['rbac', 'drone', 'general'];
            
            for (const serviceName of services) {
                const client = testSetup.httpManager.getClient(serviceName);
                client.defaults.headers.common['Authorization'] = expiredToken;
                
                try {
                    await client.get('/api/auth/me');
                    fail(`Expected ${serviceName} to reject expired token`);
                } catch (error: any) {
                    expect(error.response.status).toBe(401);
                }
            }
        });
    });

    describe('登出功能', () => {
        it('應該成功登出用戶', async () => {
            const client = await testSetup.getAuthenticatedClient('rbac');
            
            // 登出
            const response = await client.post('/api/auth/logout');
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.message).toContain('登出成功');
        });

        it('登出後 token 應該失效', async () => {
            const client = await testSetup.getAuthenticatedClient('rbac');
            
            // 先確認 token 有效
            await client.get('/api/auth/me');
            
            // 登出
            await client.post('/api/auth/logout');
            
            // 嘗試使用已登出的 token
            try {
                await client.get('/api/auth/me');
                fail('Expected request to fail after logout');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
            }
        });
    });

    describe('安全性測試', () => {
        it('應該防範 SQL 注入攻擊', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            
            const maliciousInput = "admin'; DROP TABLE users; --";
            
            try {
                await client.post('/api/auth/login', {
                    username: maliciousInput,
                    password: 'anypassword'
                });
            } catch (error: any) {
                // 應該是正常的登入失敗，而不是資料庫錯誤
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('登入失敗');
            }
            
            // 驗證用戶表仍然存在（通過查詢現有用戶）
            const adminClient = await testSetup.getAuthenticatedClient('rbac');
            const response = await adminClient.get('/api/rbac/users');
            expect(response.status).toBe(200);
        });

        it('應該限制暴力破解攻擊', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            const testUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            
            if (!testUser) {
                throw new Error('Test user not found');
            }

            // 嘗試多次錯誤登入
            const maxAttempts = 5;
            for (let i = 0; i < maxAttempts; i++) {
                try {
                    await client.post('/api/auth/login', {
                        username: testUser.username,
                        password: `wrongpassword${i}`
                    });
                } catch (error: any) {
                    expect(error.response.status).toBe(401);
                }
            }

            // 第六次嘗試應該被限制
            try {
                await client.post('/api/auth/login', {
                    username: testUser.username,
                    password: 'wrongpassword'
                });
                fail('Expected rate limiting to kick in');
            } catch (error: any) {
                // 可能是 429 (Too Many Requests) 或 401 但包含特殊訊息
                expect([401, 429].includes(error.response.status)).toBe(true);
                if (error.response.status === 401) {
                    expect(error.response.data.message).toContain('過多嘗試');
                }
            }
        });
    });
});