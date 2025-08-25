/**
 * @fileoverview 使用者命令控制器單元測試
 *
 * 測試 UserCommands 類別的所有功能，包含：
 * - 使用者創建測試
 * - 使用者更新測試
 * - 使用者刪除測試
 * - 使用者狀態管理測試
 * - 輸入驗證測試
 * - 錯誤處理測試
 *
 * @author AIOT Team
 * @since 1.0.0
 */

import {Request, Response} from 'express';
import {UserCommands} from '../../../src/controllers/commands/UserCommandsCtrl.js';
import {UserCommandsService} from '../../../src/services/commands/UserCommandsService.js';
import {ResResult} from '../../../src/utils/ResResult.js';

// Mock ResResult
jest.mock('../../../src/utils/ResResult.js', () => ({
    ControllerResult: {
        badRequest: jest.fn((message: string, data?: any) => ({status: 400, message, data})),
        created: jest.fn((message: string, data?: any) => ({status: 201, message, data})),
        success: jest.fn((message: string, data?: any) => ({status: 200, message, data})),
        notFound: jest.fn((message: string, data?: any) => ({status: 404, message, data})),
        conflict: jest.fn((message: string, data?: any) => ({status: 409, message, data})),
        unauthorized: jest.fn((message: string, data?: any) => ({status: 401, message, data})),
        forbidden: jest.fn((message: string, data?: any) => ({status: 403, message, data})),
        internalServerError: jest.fn((message: string, data?: any) => ({status: 500, message, data})),
    }
}));

// Mock logger
jest.mock('../../../src/configs/loggerConfig.js', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    })),
    logRequest: jest.fn(),
}));

describe('UserCommands', () => {
    let controller: UserCommands;
    let mockUserCommandsService: jest.Mocked<UserCommandsService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock UserCommandsService
        mockUserCommandsService = {
            createUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            updateUserProfile: jest.fn(),
            changePassword: jest.fn(),
            activateUser: jest.fn(),
            deactivateUser: jest.fn(),
            resetPassword: jest.fn(),
            assignRole: jest.fn(),
            removeRole: jest.fn(),
        } as any;

        controller = new UserCommands(mockUserCommandsService);

        // Mock Express objects
        mockRequest = {
            body: {},
            params: {},
            user: {id: 1, username: 'admin'}, // Mock authenticated user
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('createUser', () => {
        it('應該成功創建使用者', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'securePassword123',
                confirmPassword: 'securePassword123'
            };

            mockRequest.body = userData;
            const createdUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserCommandsService.createUser.mockResolvedValue({
                success: true,
                user: createdUser
            });

            await controller.createUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.createUser).toHaveBeenCalledWith({
                username: userData.username,
                email: userData.email,
                password: userData.password
            });
            expect(ResResult.created).toHaveBeenCalledWith(
                '使用者創建成功',
                createdUser
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('應該在缺少必要欄位時返回錯誤', async () => {
            mockRequest.body = {username: 'testuser'}; // 缺少 email 和 password

            await controller.createUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('缺少必要的使用者資訊');
            expect(mockUserCommandsService.createUser).not.toHaveBeenCalled();
        });

        it('應該在密碼確認不匹配時返回錯誤', async () => {
            mockRequest.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'differentPassword'
            };

            await controller.createUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('密碼確認不匹配');
            expect(mockUserCommandsService.createUser).not.toHaveBeenCalled();
        });

        it('應該在使用者名稱已存在時返回衝突錯誤', async () => {
            const userData = {
                username: 'existinguser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            };

            mockRequest.body = userData;
            mockUserCommandsService.createUser.mockResolvedValue({
                success: false,
                message: '使用者名稱已存在'
            });

            await controller.createUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.conflict).toHaveBeenCalledWith('使用者名稱已存在');
        });

        it('應該處理服務拋出的異常', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            };

            mockRequest.body = userData;
            const error = new Error('Database connection failed');
            mockUserCommandsService.createUser.mockRejectedValue(error);

            await controller.createUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.internalServerError).toHaveBeenCalledWith(
                '系統內部錯誤，請稍後再試'
            );
        });
    });

    describe('updateUser', () => {
        it('應該成功更新使用者', async () => {
            const userId = '1';
            const updateData = {
                email: 'newemail@example.com',
                display_name: 'New Display Name'
            };

            mockRequest.params = {id: userId};
            mockRequest.body = updateData;

            const updatedUser = {
                id: 1,
                username: 'testuser',
                email: 'newemail@example.com',
                display_name: 'New Display Name',
                updated_at: new Date()
            };

            mockUserCommandsService.updateUser.mockResolvedValue({
                success: true,
                user: updatedUser
            });

            await controller.updateUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.updateUser).toHaveBeenCalledWith(
                parseInt(userId),
                updateData
            );
            expect(ResResult.success).toHaveBeenCalledWith(
                '使用者更新成功',
                updatedUser
            );
        });

        it('應該在無效 ID 時返回錯誤', async () => {
            mockRequest.params = {id: 'invalid'};
            mockRequest.body = {email: 'test@example.com'};

            await controller.updateUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('無效的使用者 ID 格式');
            expect(mockUserCommandsService.updateUser).not.toHaveBeenCalled();
        });

        it('應該在找不到使用者時返回 404', async () => {
            const userId = '999';
            mockRequest.params = {id: userId};
            mockRequest.body = {email: 'test@example.com'};

            mockUserCommandsService.updateUser.mockResolvedValue({
                success: false,
                message: '使用者不存在'
            });

            await controller.updateUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.notFound).toHaveBeenCalledWith('使用者不存在');
        });
    });

    describe('deleteUser', () => {
        it('應該成功刪除使用者', async () => {
            const userId = '1';
            mockRequest.params = {id: userId};

            mockUserCommandsService.deleteUser.mockResolvedValue({
                success: true,
                message: '使用者刪除成功'
            });

            await controller.deleteUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.deleteUser).toHaveBeenCalledWith(parseInt(userId));
            expect(ResResult.success).toHaveBeenCalledWith('使用者刪除成功');
        });

        it('應該在嘗試刪除自己時返回錯誤', async () => {
            const userId = '1'; // 與 mockRequest.user.id 相同
            mockRequest.params = {id: userId};

            await controller.deleteUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('不能刪除自己的帳號');
            expect(mockUserCommandsService.deleteUser).not.toHaveBeenCalled();
        });

        it('應該在找不到使用者時返回 404', async () => {
            const userId = '999';
            mockRequest.params = {id: userId};

            mockUserCommandsService.deleteUser.mockResolvedValue({
                success: false,
                message: '使用者不存在'
            });

            await controller.deleteUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.notFound).toHaveBeenCalledWith('使用者不存在');
        });
    });

    describe('changePassword', () => {
        it('應該成功更改密碼', async () => {
            const userId = '1';
            const passwordData = {
                currentPassword: 'oldPassword123',
                newPassword: 'newPassword123',
                confirmNewPassword: 'newPassword123'
            };

            mockRequest.params = {id: userId};
            mockRequest.body = passwordData;

            mockUserCommandsService.changePassword.mockResolvedValue({
                success: true,
                message: '密碼更新成功'
            });

            await controller.changePassword(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.changePassword).toHaveBeenCalledWith(
                parseInt(userId),
                passwordData.currentPassword,
                passwordData.newPassword
            );
            expect(ResResult.success).toHaveBeenCalledWith('密碼更新成功');
        });

        it('應該在缺少必要欄位時返回錯誤', async () => {
            mockRequest.params = {id: '1'};
            mockRequest.body = {currentPassword: 'old123'}; // 缺少新密碼

            await controller.changePassword(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('缺少必要的密碼資訊');
            expect(mockUserCommandsService.changePassword).not.toHaveBeenCalled();
        });

        it('應該在新密碼確認不匹配時返回錯誤', async () => {
            mockRequest.params = {id: '1'};
            mockRequest.body = {
                currentPassword: 'old123',
                newPassword: 'new123',
                confirmNewPassword: 'different123'
            };

            await controller.changePassword(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('新密碼確認不匹配');
            expect(mockUserCommandsService.changePassword).not.toHaveBeenCalled();
        });

        it('應該在舊密碼錯誤時返回未授權錯誤', async () => {
            const userId = '1';
            const passwordData = {
                currentPassword: 'wrongPassword',
                newPassword: 'newPassword123',
                confirmNewPassword: 'newPassword123'
            };

            mockRequest.params = {id: userId};
            mockRequest.body = passwordData;

            mockUserCommandsService.changePassword.mockResolvedValue({
                success: false,
                message: '目前密碼錯誤'
            });

            await controller.changePassword(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.unauthorized).toHaveBeenCalledWith('目前密碼錯誤');
        });
    });

    describe('activateUser', () => {
        it('應該成功啟用使用者', async () => {
            const userId = '1';
            mockRequest.params = {id: userId};

            const activatedUser = {
                id: 1,
                username: 'testuser',
                is_active: true,
                updated_at: new Date()
            };

            mockUserCommandsService.activateUser.mockResolvedValue({
                success: true,
                user: activatedUser
            });

            await controller.activateUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.activateUser).toHaveBeenCalledWith(parseInt(userId));
            expect(ResResult.success).toHaveBeenCalledWith(
                '使用者啟用成功',
                activatedUser
            );
        });
    });

    describe('deactivateUser', () => {
        it('應該成功停用使用者', async () => {
            const userId = '2'; // 不是當前使用者
            mockRequest.params = {id: userId};

            const deactivatedUser = {
                id: 2,
                username: 'testuser',
                is_active: false,
                updated_at: new Date()
            };

            mockUserCommandsService.deactivateUser.mockResolvedValue({
                success: true,
                user: deactivatedUser
            });

            await controller.deactivateUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.deactivateUser).toHaveBeenCalledWith(parseInt(userId));
            expect(ResResult.success).toHaveBeenCalledWith(
                '使用者停用成功',
                deactivatedUser
            );
        });

        it('應該在嘗試停用自己時返回錯誤', async () => {
            const userId = '1'; // 與 mockRequest.user.id 相同
            mockRequest.params = {id: userId};

            await controller.deactivateUser(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('不能停用自己的帳號');
            expect(mockUserCommandsService.deactivateUser).not.toHaveBeenCalled();
        });
    });

    describe('assignRole', () => {
        it('應該成功分配角色給使用者', async () => {
            const userId = '1';
            const roleData = {roleId: 2};

            mockRequest.params = {id: userId};
            mockRequest.body = roleData;

            mockUserCommandsService.assignRole.mockResolvedValue({
                success: true,
                message: '角色分配成功'
            });

            await controller.assignRole(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.assignRole).toHaveBeenCalledWith(
                parseInt(userId),
                roleData.roleId
            );
            expect(ResResult.success).toHaveBeenCalledWith('角色分配成功');
        });

        it('應該在缺少角色 ID 時返回錯誤', async () => {
            mockRequest.params = {id: '1'};
            mockRequest.body = {}; // 缺少 roleId

            await controller.assignRole(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.badRequest).toHaveBeenCalledWith('缺少角色 ID');
            expect(mockUserCommandsService.assignRole).not.toHaveBeenCalled();
        });

        it('應該在角色已存在時返回衝突錯誤', async () => {
            const userId = '1';
            const roleData = {roleId: 2};

            mockRequest.params = {id: userId};
            mockRequest.body = roleData;

            mockUserCommandsService.assignRole.mockResolvedValue({
                success: false,
                message: '使用者已擁有此角色'
            });

            await controller.assignRole(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.conflict).toHaveBeenCalledWith('使用者已擁有此角色');
        });
    });

    describe('removeRole', () => {
        it('應該成功移除使用者角色', async () => {
            const userId = '1';
            const roleData = {roleId: 2};

            mockRequest.params = {id: userId};
            mockRequest.body = roleData;

            mockUserCommandsService.removeRole.mockResolvedValue({
                success: true,
                message: '角色移除成功'
            });

            await controller.removeRole(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockUserCommandsService.removeRole).toHaveBeenCalledWith(
                parseInt(userId),
                roleData.roleId
            );
            expect(ResResult.success).toHaveBeenCalledWith('角色移除成功');
        });

        it('應該在找不到角色關聯時返回 404', async () => {
            const userId = '1';
            const roleData = {roleId: 2};

            mockRequest.params = {id: userId};
            mockRequest.body = roleData;

            mockUserCommandsService.removeRole.mockResolvedValue({
                success: false,
                message: '找不到指定的角色關聯'
            });

            await controller.removeRole(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(ResResult.notFound).toHaveBeenCalledWith('找不到指定的角色關聯');
        });
    });
});