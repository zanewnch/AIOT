/**
 * @fileoverview 用戶偏好設定命令控制器單元測試
 * 
 * 測試 UserPreferenceCommands 類別的所有功能，包含：
 * - 用戶偏好設定創建測試
 * - 用戶偏好設定更新測試
 * - 用戶偏好設定刪除測試
 * - 批量操作測試
 * - 輸入驗證測試
 * - 錯誤處理測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { UserPreferenceCommands } from '../../../src/controllers/commands/UserPreferenceCommandsCtrl.js';
import { UserPreferenceCommandsSvc } from '../../../src/services/commands/UserPreferenceCommandsSvc.js';
import { ControllerResult } from '../../../src/utils/ControllerResult.js';
import type { UserPreferenceCreationAttributes, UserPreferenceAttributes } from '../../../src/models/UserPreferenceModel.js';

// Mock ControllerResult
jest.mock('../../../src/utils/ControllerResult.js', () => ({
    ControllerResult: {
        badRequest: jest.fn((res: Response, message: string, data?: any) => {
            res.status(400).json({ status: 400, message, data });
        }),
        created: jest.fn((res: Response, message: string, data?: any) => {
            res.status(201).json({ status: 201, message, data });
        }),
        success: jest.fn((res: Response, message: string, data?: any) => {
            res.status(200).json({ status: 200, message, data });
        }),
        notFound: jest.fn((res: Response, message: string, data?: any) => {
            res.status(404).json({ status: 404, message, data });
        }),
        conflict: jest.fn((res: Response, message: string, data?: any) => {
            res.status(409).json({ status: 409, message, data });
        }),
        internalServerError: jest.fn((res: Response, message: string, data?: any) => {
            res.status(500).json({ status: 500, message, data });
        }),
    }
}));

// Mock Logger decorator
jest.mock('../../../src/decorators/LoggerDecorator.js', () => ({
    Logger: () => () => {},
}));

describe('UserPreferenceCommands', () => {
    let controller: UserPreferenceCommands;
    let mockUserPreferenceCommandsSvc: jest.Mocked<UserPreferenceCommandsSvc>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock UserPreferenceCommandsSvc
        mockUserPreferenceCommandsSvc = {
            createUserPreference: jest.fn(),
            updateUserPreference: jest.fn(),
            deleteUserPreference: jest.fn(),
            bulkCreateUserPreferences: jest.fn(),
            bulkUpdateUserPreferences: jest.fn(),
            resetUserPreferences: jest.fn(),
            migrateUserPreferences: jest.fn(),
        } as any;

        controller = new UserPreferenceCommands(mockUserPreferenceCommandsSvc);

        // Mock Express objects
        mockRequest = {
            body: {},
            params: {},
            user: { id: 1, username: 'testuser' }, // Mock authenticated user
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        mockNext = jest.fn();
    });

    describe('createUserPreference', () => {
        it('應該成功創建用戶偏好設定', async () => {
            const preferenceData: UserPreferenceCreationAttributes = {
                userId: 1,
                theme: 'dark',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                notifications: {
                    email: true,
                    push: false,
                    sms: false
                }
            };

            mockRequest.body = preferenceData;

            const createdPreference: UserPreferenceAttributes = {
                id: 1,
                ...preferenceData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceCommandsSvc.createUserPreference.mockResolvedValue({
                success: true,
                data: createdPreference
            });

            await controller.createUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockUserPreferenceCommandsSvc.createUserPreference).toHaveBeenCalledWith(preferenceData);
            expect(ControllerResult.created).toHaveBeenCalledWith(
                mockResponse,
                '用戶偏好設定創建成功',
                createdPreference
            );
        });

        it('應該在缺少用戶 ID 時返回錯誤', async () => {
            mockRequest.body = {
                theme: 'dark',
                language: 'zh-TW'
            }; // 缺少 userId

            await controller.createUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '用戶 ID 為必填項且必須為數字'
            );
            expect(mockUserPreferenceCommandsSvc.createUserPreference).not.toHaveBeenCalled();
        });

        it('應該在用戶 ID 格式錯誤時返回錯誤', async () => {
            mockRequest.body = {
                userId: 'invalid',
                theme: 'dark'
            };

            await controller.createUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '用戶 ID 為必填項且必須為數字'
            );
            expect(mockUserPreferenceCommandsSvc.createUserPreference).not.toHaveBeenCalled();
        });

        it('應該在偏好設定已存在時返回衝突錯誤', async () => {
            const preferenceData: UserPreferenceCreationAttributes = {
                userId: 1,
                theme: 'dark'
            };

            mockRequest.body = preferenceData;
            mockUserPreferenceCommandsSvc.createUserPreference.mockResolvedValue({
                success: false,
                message: '該用戶的偏好設定已存在'
            });

            await controller.createUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.conflict).toHaveBeenCalledWith(
                mockResponse,
                '該用戶的偏好設定已存在'
            );
        });

        it('應該處理服務拋出的異常', async () => {
            const preferenceData: UserPreferenceCreationAttributes = {
                userId: 1,
                theme: 'dark'
            };

            mockRequest.body = preferenceData;
            const error = new Error('Database connection failed');
            mockUserPreferenceCommandsSvc.createUserPreference.mockRejectedValue(error);

            await controller.createUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('updateUserPreference', () => {
        it('應該成功更新用戶偏好設定', async () => {
            const preferenceId = '1';
            const updateData = {
                theme: 'light',
                language: 'en-US',
                notifications: {
                    email: false,
                    push: true,
                    sms: false
                }
            };

            mockRequest.params = { id: preferenceId };
            mockRequest.body = updateData;

            const updatedPreference: UserPreferenceAttributes = {
                id: 1,
                userId: 1,
                ...updateData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceCommandsSvc.updateUserPreference.mockResolvedValue({
                success: true,
                data: updatedPreference
            });

            await controller.updateUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockUserPreferenceCommandsSvc.updateUserPreference).toHaveBeenCalledWith(
                parseInt(preferenceId),
                updateData
            );
            expect(ControllerResult.success).toHaveBeenCalledWith(
                mockResponse,
                '用戶偏好設定更新成功',
                updatedPreference
            );
        });

        it('應該在無效 ID 時返回錯誤', async () => {
            mockRequest.params = { id: 'invalid' };
            mockRequest.body = { theme: 'dark' };

            await controller.updateUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '無效的偏好設定 ID 格式'
            );
            expect(mockUserPreferenceCommandsSvc.updateUserPreference).not.toHaveBeenCalled();
        });

        it('應該在找不到偏好設定時返回 404', async () => {
            const preferenceId = '999';
            mockRequest.params = { id: preferenceId };
            mockRequest.body = { theme: 'dark' };

            mockUserPreferenceCommandsSvc.updateUserPreference.mockResolvedValue({
                success: false,
                message: '找不到指定的偏好設定'
            });

            await controller.updateUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.notFound).toHaveBeenCalledWith(
                mockResponse,
                '找不到指定的偏好設定'
            );
        });

        it('應該驗證更新資料格式', async () => {
            const preferenceId = '1';
            mockRequest.params = { id: preferenceId };
            mockRequest.body = {
                theme: 'invalid-theme', // 無效的主題值
                language: 123 // 無效的語言格式
            };

            mockUserPreferenceCommandsSvc.updateUserPreference.mockResolvedValue({
                success: false,
                message: '偏好設定資料格式錯誤'
            });

            await controller.updateUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '偏好設定資料格式錯誤'
            );
        });
    });

    describe('deleteUserPreference', () => {
        it('應該成功刪除用戶偏好設定', async () => {
            const preferenceId = '1';
            mockRequest.params = { id: preferenceId };

            mockUserPreferenceCommandsSvc.deleteUserPreference.mockResolvedValue({
                success: true,
                message: '用戶偏好設定刪除成功'
            });

            await controller.deleteUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockUserPreferenceCommandsSvc.deleteUserPreference).toHaveBeenCalledWith(
                parseInt(preferenceId)
            );
            expect(ControllerResult.success).toHaveBeenCalledWith(
                mockResponse,
                '用戶偏好設定刪除成功'
            );
        });

        it('應該在無效 ID 時返回錯誤', async () => {
            mockRequest.params = { id: 'invalid' };

            await controller.deleteUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '無效的偏好設定 ID 格式'
            );
            expect(mockUserPreferenceCommandsSvc.deleteUserPreference).not.toHaveBeenCalled();
        });

        it('應該在找不到偏好設定時返回 404', async () => {
            const preferenceId = '999';
            mockRequest.params = { id: preferenceId };

            mockUserPreferenceCommandsSvc.deleteUserPreference.mockResolvedValue({
                success: false,
                message: '找不到指定的偏好設定'
            });

            await controller.deleteUserPreference(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.notFound).toHaveBeenCalledWith(
                mockResponse,
                '找不到指定的偏好設定'
            );
        });
    });

    describe('bulkCreateUserPreferences', () => {
        it('應該成功批量創建用戶偏好設定', async () => {
            const preferencesData: UserPreferenceCreationAttributes[] = [
                {
                    userId: 1,
                    theme: 'dark',
                    language: 'zh-TW'
                },
                {
                    userId: 2,
                    theme: 'light',
                    language: 'en-US'
                }
            ];

            mockRequest.body = { preferences: preferencesData };

            const createdPreferences: UserPreferenceAttributes[] = preferencesData.map((data, index) => ({
                id: index + 1,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            mockUserPreferenceCommandsSvc.bulkCreateUserPreferences.mockResolvedValue({
                success: true,
                data: {
                    successful: createdPreferences,
                    failed: [],
                    successCount: 2,
                    failedCount: 0
                }
            });

            await controller.bulkCreateUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockUserPreferenceCommandsSvc.bulkCreateUserPreferences).toHaveBeenCalledWith(preferencesData);
            expect(ControllerResult.created).toHaveBeenCalledWith(
                mockResponse,
                '批量創建偏好設定成功',
                {
                    successful: createdPreferences,
                    failed: [],
                    successCount: 2,
                    failedCount: 0
                }
            );
        });

        it('應該在沒有提供偏好設定陣列時返回錯誤', async () => {
            mockRequest.body = {}; // 缺少 preferences

            await controller.bulkCreateUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '請提供有效的偏好設定陣列'
            );
            expect(mockUserPreferenceCommandsSvc.bulkCreateUserPreferences).not.toHaveBeenCalled();
        });

        it('應該在偏好設定陣列為空時返回錯誤', async () => {
            mockRequest.body = { preferences: [] };

            await controller.bulkCreateUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '請提供有效的偏好設定陣列'
            );
            expect(mockUserPreferenceCommandsSvc.bulkCreateUserPreferences).not.toHaveBeenCalled();
        });

        it('應該處理部分成功的批量創建', async () => {
            const preferencesData: UserPreferenceCreationAttributes[] = [
                { userId: 1, theme: 'dark' },
                { userId: 999, theme: 'light' } // 假設這個會失敗
            ];

            mockRequest.body = { preferences: preferencesData };

            const successfulPreference: UserPreferenceAttributes = {
                id: 1,
                userId: 1,
                theme: 'dark',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceCommandsSvc.bulkCreateUserPreferences.mockResolvedValue({
                success: true,
                data: {
                    successful: [successfulPreference],
                    failed: [{ data: preferencesData[1], error: 'User not found' }],
                    successCount: 1,
                    failedCount: 1
                }
            });

            await controller.bulkCreateUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.created).toHaveBeenCalledWith(
                mockResponse,
                '批量創建偏好設定完成，部分項目失敗',
                expect.objectContaining({
                    successCount: 1,
                    failedCount: 1
                })
            );
        });
    });

    describe('resetUserPreferences', () => {
        it('應該成功重設用戶偏好設定為默認值', async () => {
            const userId = '1';
            mockRequest.params = { userId };

            const defaultPreferences: UserPreferenceAttributes = {
                id: 1,
                userId: 1,
                theme: 'light',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceCommandsSvc.resetUserPreferences.mockResolvedValue({
                success: true,
                data: defaultPreferences
            });

            await controller.resetUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockUserPreferenceCommandsSvc.resetUserPreferences).toHaveBeenCalledWith(
                parseInt(userId)
            );
            expect(ControllerResult.success).toHaveBeenCalledWith(
                mockResponse,
                '用戶偏好設定已重設為默認值',
                defaultPreferences
            );
        });

        it('應該在無效用戶 ID 時返回錯誤', async () => {
            mockRequest.params = { userId: 'invalid' };

            await controller.resetUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                mockResponse,
                '無效的用戶 ID 格式'
            );
            expect(mockUserPreferenceCommandsSvc.resetUserPreferences).not.toHaveBeenCalled();
        });

        it('應該在找不到用戶時返回 404', async () => {
            const userId = '999';
            mockRequest.params = { userId };

            mockUserPreferenceCommandsSvc.resetUserPreferences.mockResolvedValue({
                success: false,
                message: '找不到指定的用戶'
            });

            await controller.resetUserPreferences(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.notFound).toHaveBeenCalledWith(
                mockResponse,
                '找不到指定的用戶'
            );
        });
    });
});