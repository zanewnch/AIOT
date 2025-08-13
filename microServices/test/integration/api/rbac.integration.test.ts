/**
 * @fileoverview RBAC API 整合測試
 * 
 * 測試角色權限控制相關的 API 端點，包含：
 * - 使用者管理 API 測試
 * - 角色管理 API 測試
 * - 權限管理 API 測試
 * - 使用者角色分配測試
 * - 角色權限分配測試
 * - 權限驗證測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { IntegrationTestSetup, TestHelpers } from '../setup/testSetup.js';
import { AxiosInstance } from 'axios';

describe('RBAC API Integration Tests', () => {
    let testSetup: IntegrationTestSetup;
    let adminClient: AxiosInstance;
    let operatorClient: AxiosInstance;
    let viewerClient: AxiosInstance;

    beforeAll(async () => {
        testSetup = new IntegrationTestSetup();
        await testSetup.setup();
        
        // 設置不同權限的客戶端
        adminClient = await testSetup.getAuthenticatedClient('rbac', 'admin_test');
        operatorClient = await testSetup.getAuthenticatedClient('rbac', 'operator_test');
        viewerClient = await testSetup.getAuthenticatedClient('rbac', 'viewer_test');
    }, 30000);

    afterAll(async () => {
        await testSetup.teardown();
    }, 10000);

    describe('使用者管理 API', () => {
        it('管理員應該能獲取所有使用者列表', async () => {
            const response = await adminClient.get('/api/rbac/users');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
            
            const user = response.data.data[0];
            expect(user.id).toBeDefined();
            expect(user.username).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.is_active).toBeDefined();
            expect(user.created_at).toBeDefined();
            expect(user.password_hash).toBeUndefined(); // 不應返回密碼哈希
        });

        it('管理員應該能創建新使用者', async () => {
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };

            const response = await adminClient.post('/api/rbac/users', userData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.username).toBe(userData.username);
            expect(response.data.data.email).toBe(userData.email);
            expect(response.data.data.is_active).toBe(true);
        });

        it('管理員應該能更新使用者資訊', async () => {
            // 先創建一個測試使用者
            const createData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };
            
            const createResponse = await adminClient.post('/api/rbac/users', createData);
            const userId = createResponse.data.data.id;
            
            // 更新使用者資訊
            const updateData = {
                email: `updated_${TestHelpers.generateRandomString()}@test.com`,
                display_name: 'Updated Display Name'
            };
            
            const response = await adminClient.put(`/api/rbac/users/${userId}`, updateData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.email).toBe(updateData.email);
            expect(response.data.data.display_name).toBe(updateData.display_name);
        });

        it('管理員應該能停用使用者', async () => {
            // 先創建一個測試使用者
            const createData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };
            
            const createResponse = await adminClient.post('/api/rbac/users', createData);
            const userId = createResponse.data.data.id;
            
            // 停用使用者
            const response = await adminClient.patch(`/api/rbac/users/${userId}/deactivate`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.is_active).toBe(false);
        });

        it('管理員應該能重新啟用使用者', async () => {
            // 先創建並停用一個測試使用者
            const createData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };
            
            const createResponse = await adminClient.post('/api/rbac/users', createData);
            const userId = createResponse.data.data.id;
            
            await adminClient.patch(`/api/rbac/users/${userId}/deactivate`);
            
            // 重新啟用使用者
            const response = await adminClient.patch(`/api/rbac/users/${userId}/activate`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.is_active).toBe(true);
        });

        it('普通使用者應該無法創建使用者', async () => {
            const userData = {
                username: 'unauthorized_user',
                email: 'unauthorized@test.com',
                password: 'password123',
                confirmPassword: 'password123'
            };

            try {
                await viewerClient.post('/api/rbac/users', userData);
                fail('Expected permission denied');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限');
            }
        });

        it('使用者應該能查看自己的資料', async () => {
            const viewerUser = testSetup.testData?.users.find(u => u.username === 'viewer_test');
            if (!viewerUser) {
                throw new Error('Viewer test user not found');
            }

            const response = await viewerClient.get(`/api/rbac/users/${viewerUser.id}`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.id).toBe(viewerUser.id);
            expect(response.data.data.username).toBe(viewerUser.username);
        });

        it('使用者應該能更新自己的基本資料', async () => {
            const viewerUser = testSetup.testData?.users.find(u => u.username === 'viewer_test');
            if (!viewerUser) {
                throw new Error('Viewer test user not found');
            }

            const updateData = {
                display_name: 'My New Display Name'
            };
            
            const response = await viewerClient.put(`/api/rbac/users/${viewerUser.id}/profile`, updateData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.display_name).toBe(updateData.display_name);
        });
    });

    describe('角色管理 API', () => {
        it('應該能獲取所有角色列表', async () => {
            const response = await viewerClient.get('/api/rbac/roles');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
            
            const role = response.data.data[0];
            expect(role.id).toBeDefined();
            expect(role.name).toBeDefined();
            expect(role.description).toBeDefined();
            expect(role.created_at).toBeDefined();
        });

        it('管理員應該能創建新角色', async () => {
            const roleData = {
                name: `test_role_${TestHelpers.generateRandomString()}`,
                description: '測試角色描述'
            };

            const response = await adminClient.post('/api/rbac/roles', roleData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.name).toBe(roleData.name);
            expect(response.data.data.description).toBe(roleData.description);
        });

        it('管理員應該能更新角色資訊', async () => {
            // 先創建一個測試角色
            const createData = {
                name: `test_role_${TestHelpers.generateRandomString()}`,
                description: '原始描述'
            };
            
            const createResponse = await adminClient.post('/api/rbac/roles', createData);
            const roleId = createResponse.data.data.id;
            
            // 更新角色
            const updateData = {
                description: '更新後的描述'
            };
            
            const response = await adminClient.put(`/api/rbac/roles/${roleId}`, updateData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.description).toBe(updateData.description);
        });

        it('管理員應該能刪除角色', async () => {
            // 先創建一個測試角色
            const createData = {
                name: `deletable_role_${TestHelpers.generateRandomString()}`,
                description: '可刪除的測試角色'
            };
            
            const createResponse = await adminClient.post('/api/rbac/roles', createData);
            const roleId = createResponse.data.data.id;
            
            // 刪除角色
            const response = await adminClient.delete(`/api/rbac/roles/${roleId}`);
            
            TestHelpers.validateApiResponse(response, 200);
            
            // 驗證角色已被刪除
            try {
                await adminClient.get(`/api/rbac/roles/${roleId}`);
                fail('Expected role to be deleted');
            } catch (error: any) {
                expect(error.response.status).toBe(404);
            }
        });

        it('普通使用者應該無法創建角色', async () => {
            const roleData = {
                name: 'unauthorized_role',
                description: '未授權創建的角色'
            };

            try {
                await viewerClient.post('/api/rbac/roles', roleData);
                fail('Expected permission denied');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限');
            }
        });
    });

    describe('權限管理 API', () => {
        it('應該能獲取所有權限列表', async () => {
            const response = await viewerClient.get('/api/rbac/permissions');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
            
            const permission = response.data.data[0];
            expect(permission.id).toBeDefined();
            expect(permission.name).toBeDefined();
            expect(permission.description).toBeDefined();
            expect(permission.created_at).toBeDefined();
        });

        it('管理員應該能創建新權限', async () => {
            const permissionData = {
                name: `test.${TestHelpers.generateRandomString()}`,
                description: '測試權限描述'
            };

            const response = await adminClient.post('/api/rbac/permissions', permissionData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.name).toBe(permissionData.name);
            expect(response.data.data.description).toBe(permissionData.description);
        });

        it('應該驗證權限名稱格式', async () => {
            const invalidPermissionData = {
                name: 'Invalid Permission Name', // 應該使用點號分隔
                description: '無效的權限名稱'
            };

            try {
                await adminClient.post('/api/rbac/permissions', invalidPermissionData);
                fail('Expected validation error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('權限名稱格式');
            }
        });

        it('管理員應該能更新權限資訊', async () => {
            // 先創建一個測試權限
            const createData = {
                name: `test.${TestHelpers.generateRandomString()}`,
                description: '原始描述'
            };
            
            const createResponse = await adminClient.post('/api/rbac/permissions', createData);
            const permissionId = createResponse.data.data.id;
            
            // 更新權限
            const updateData = {
                description: '更新後的描述'
            };
            
            const response = await adminClient.put(`/api/rbac/permissions/${permissionId}`, updateData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.description).toBe(updateData.description);
        });

        it('普通使用者應該無法創建權限', async () => {
            const permissionData = {
                name: 'unauthorized.permission',
                description: '未授權創建的權限'
            };

            try {
                await viewerClient.post('/api/rbac/permissions', permissionData);
                fail('Expected permission denied');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限');
            }
        });
    });

    describe('使用者角色分配 API', () => {
        let testUserId: number;
        let testRoleId: number;

        beforeEach(async () => {
            // 創建測試使用者
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'testPassword123',
                confirmPassword: 'testPassword123'
            };
            
            const userResponse = await adminClient.post('/api/rbac/users', userData);
            testUserId = userResponse.data.data.id;
            
            // 創建測試角色
            const roleData = {
                name: `test_role_${TestHelpers.generateRandomString()}`,
                description: '測試角色'
            };
            
            const roleResponse = await adminClient.post('/api/rbac/roles', roleData);
            testRoleId = roleResponse.data.data.id;
        });

        it('管理員應該能為使用者分配角色', async () => {
            const response = await adminClient.post(`/api/rbac/users/${testUserId}/roles`, {
                roleId: testRoleId
            });
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.message).toContain('角色分配成功');
        });

        it('管理員應該能查看使用者的角色列表', async () => {
            // 先分配一個角色
            await adminClient.post(`/api/rbac/users/${testUserId}/roles`, {
                roleId: testRoleId
            });
            
            const response = await adminClient.get(`/api/rbac/users/${testUserId}/roles`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.some((role: any) => role.id === testRoleId)).toBe(true);
        });

        it('管理員應該能移除使用者的角色', async () => {
            // 先分配角色
            await adminClient.post(`/api/rbac/users/${testUserId}/roles`, {
                roleId: testRoleId
            });
            
            // 移除角色
            const response = await adminClient.delete(`/api/rbac/users/${testUserId}/roles/${testRoleId}`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.message).toContain('角色移除成功');
        });

        it('應該防止重複分配同一角色', async () => {
            // 首次分配
            await adminClient.post(`/api/rbac/users/${testUserId}/roles`, {
                roleId: testRoleId
            });
            
            // 嘗試重複分配
            try {
                await adminClient.post(`/api/rbac/users/${testUserId}/roles`, {
                    roleId: testRoleId
                });
                fail('Expected conflict error');
            } catch (error: any) {
                expect(error.response.status).toBe(409);
                expect(error.response.data.message).toContain('已擁有此角色');
            }
        });

        it('普通使用者應該無法分配角色', async () => {
            try {
                await viewerClient.post(`/api/rbac/users/${testUserId}/roles`, {
                    roleId: testRoleId
                });
                fail('Expected permission denied');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限');
            }
        });
    });

    describe('角色權限分配 API', () => {
        let testRoleId: number;
        let testPermissionId: number;

        beforeEach(async () => {
            // 創建測試角色
            const roleData = {
                name: `test_role_${TestHelpers.generateRandomString()}`,
                description: '測試角色'
            };
            
            const roleResponse = await adminClient.post('/api/rbac/roles', roleData);
            testRoleId = roleResponse.data.data.id;
            
            // 創建測試權限
            const permissionData = {
                name: `test.${TestHelpers.generateRandomString()}`,
                description: '測試權限'
            };
            
            const permissionResponse = await adminClient.post('/api/rbac/permissions', permissionData);
            testPermissionId = permissionResponse.data.data.id;
        });

        it('管理員應該能為角色分配權限', async () => {
            const response = await adminClient.post(`/api/rbac/roles/${testRoleId}/permissions`, {
                permissionId: testPermissionId
            });
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.message).toContain('權限分配成功');
        });

        it('管理員應該能查看角色的權限列表', async () => {
            // 先分配一個權限
            await adminClient.post(`/api/rbac/roles/${testRoleId}/permissions`, {
                permissionId: testPermissionId
            });
            
            const response = await adminClient.get(`/api/rbac/roles/${testRoleId}/permissions`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.some((perm: any) => perm.id === testPermissionId)).toBe(true);
        });

        it('管理員應該能移除角色的權限', async () => {
            // 先分配權限
            await adminClient.post(`/api/rbac/roles/${testRoleId}/permissions`, {
                permissionId: testPermissionId
            });
            
            // 移除權限
            const response = await adminClient.delete(`/api/rbac/roles/${testRoleId}/permissions/${testPermissionId}`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.message).toContain('權限移除成功');
        });

        it('應該防止重複分配同一權限', async () => {
            // 首次分配
            await adminClient.post(`/api/rbac/roles/${testRoleId}/permissions`, {
                permissionId: testPermissionId
            });
            
            // 嘗試重複分配
            try {
                await adminClient.post(`/api/rbac/roles/${testRoleId}/permissions`, {
                    permissionId: testPermissionId
                });
                fail('Expected conflict error');
            } catch (error: any) {
                expect(error.response.status).toBe(409);
                expect(error.response.data.message).toContain('已擁有此權限');
            }
        });
    });

    describe('權限驗證 API', () => {
        it('應該能檢查使用者是否擁有特定權限', async () => {
            const adminUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            if (!adminUser) {
                throw new Error('Admin test user not found');
            }

            const response = await adminClient.get(`/api/rbac/users/${adminUser.id}/permissions/check`, {
                params: {
                    permission: 'user.create'
                }
            });
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.hasPermission).toBe(true);
        });

        it('應該能獲取使用者的所有權限', async () => {
            const adminUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            if (!adminUser) {
                throw new Error('Admin test user not found');
            }

            const response = await adminClient.get(`/api/rbac/users/${adminUser.id}/permissions`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
            
            const permission = response.data.data[0];
            expect(permission.name).toBeDefined();
            expect(permission.description).toBeDefined();
        });

        it('不同權限的使用者應該有不同的權限集合', async () => {
            const adminUser = testSetup.testData?.users.find(u => u.username === 'admin_test');
            const viewerUser = testSetup.testData?.users.find(u => u.username === 'viewer_test');
            
            if (!adminUser || !viewerUser) {
                throw new Error('Test users not found');
            }

            const adminResponse = await adminClient.get(`/api/rbac/users/${adminUser.id}/permissions`);
            const viewerResponse = await adminClient.get(`/api/rbac/users/${viewerUser.id}/permissions`);
            
            expect(adminResponse.data.data.length).toBeGreaterThan(viewerResponse.data.data.length);
            
            // 管理員應該有創建使用者的權限，而觀察員沒有
            const adminHasUserCreate = adminResponse.data.data.some((p: any) => p.name === 'user.create');
            const viewerHasUserCreate = viewerResponse.data.data.some((p: any) => p.name === 'user.create');
            
            expect(adminHasUserCreate).toBe(true);
            expect(viewerHasUserCreate).toBe(false);
        });
    });

    describe('RBAC 統計 API', () => {
        it('應該能獲取 RBAC 系統統計資訊', async () => {
            const response = await adminClient.get('/api/rbac/statistics');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.totalUsers).toBeDefined();
            expect(response.data.data.activeUsers).toBeDefined();
            expect(response.data.data.totalRoles).toBeDefined();
            expect(response.data.data.totalPermissions).toBeDefined();
            expect(response.data.data.usersByRole).toBeDefined();
            expect(response.data.data.permissionsByRole).toBeDefined();
        });

        it('普通使用者應該無法查看系統統計', async () => {
            try {
                await viewerClient.get('/api/rbac/statistics');
                fail('Expected permission denied');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限');
            }
        });
    });

    describe('密碼管理 API', () => {
        let testUserId: number;

        beforeEach(async () => {
            // 創建測試使用者
            const userData = {
                username: TestHelpers.generateRandomString(),
                email: `${TestHelpers.generateRandomString()}@test.com`,
                password: 'originalPassword123',
                confirmPassword: 'originalPassword123'
            };
            
            const response = await adminClient.post('/api/rbac/users', userData);
            testUserId = response.data.data.id;
        });

        it('使用者應該能更改自己的密碼', async () => {
            // 先登入該測試使用者
            const client = testSetup.httpManager.getClient('rbac');
            await client.post('/api/auth/login', {
                username: 'test_user',
                password: 'originalPassword123'
            });

            const response = await client.put(`/api/rbac/users/${testUserId}/password`, {
                currentPassword: 'originalPassword123',
                newPassword: 'newPassword123',
                confirmNewPassword: 'newPassword123'
            });
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.message).toContain('密碼更新成功');
        });

        it('管理員應該能重設使用者密碼', async () => {
            const response = await adminClient.post(`/api/rbac/users/${testUserId}/reset-password`, {
                newPassword: 'resetPassword123'
            });
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.message).toContain('密碼重設成功');
        });

        it('應該驗證密碼強度', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            
            try {
                await client.put(`/api/rbac/users/${testUserId}/password`, {
                    currentPassword: 'originalPassword123',
                    newPassword: '123', // 弱密碼
                    confirmNewPassword: '123'
                });
                fail('Expected password validation error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('密碼強度');
            }
        });

        it('應該驗證舊密碼正確性', async () => {
            const client = testSetup.httpManager.getClient('rbac');
            
            try {
                await client.put(`/api/rbac/users/${testUserId}/password`, {
                    currentPassword: 'wrongPassword', // 錯誤的舊密碼
                    newPassword: 'newPassword123',
                    confirmNewPassword: 'newPassword123'
                });
                fail('Expected current password validation error');
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.message).toContain('目前密碼錯誤');
            }
        });
    });
});