/**
 * @fileoverview 用戶偏好設定命令服務單元測試
 * 
 * 測試 UserPreferenceCommandsSvc 類別的所有功能，包含：
 * - 偏好設定創建和驗證測試
 * - 偏好設定更新和配置測試
 * - 偏好設定刪除和清理測試
 * - 批量操作測試
 * - 默認值和重設測試
 * - 業務邏輯驗證測試
 * - 錯誤處理測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { UserPreferenceCommandsSvc } from '../../../src/services/commands/UserPreferenceCommandsSvc.js';
import { UserPreferenceQueriesSvc } from '../../../src/services/queries/UserPreferenceQueriesSvc.js';
import { UserPreferenceCommandsRepository } from '../../../src/repo/commands/UserPreferenceCommandsRepo.js';
import { UserPreferenceQueriesRepo } from '../../../src/repo/queries/UserPreferenceQueriesRepo.js';
import type { UserPreferenceCreationAttributes, UserPreferenceAttributes } from '../../../src/models/UserPreferenceModel.js';

// Mock logger
jest.mock('../../../src/configs/loggerConfig.js', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }))
}));

// Mock repositories
jest.mock('../../../src/repo/commands/UserPreferenceCommandsRepo.js');
jest.mock('../../../src/repo/queries/UserPreferenceQueriesRepo.js');

describe('UserPreferenceCommandsSvc', () => {
    let service: UserPreferenceCommandsSvc;
    let mockUserPreferenceQueriesSvc: jest.Mocked<UserPreferenceQueriesSvc>;
    let mockCommandsRepository: jest.Mocked<UserPreferenceCommandsRepository>;
    let mockQueriesRepo: jest.Mocked<UserPreferenceQueriesRepo>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock UserPreferenceQueriesSvc
        mockUserPreferenceQueriesSvc = {
            getUserPreferenceById: jest.fn(),
            getUserPreferenceByUserId: jest.fn(),
            getUserPreferences: jest.fn(),
            searchUserPreferences: jest.fn(),
            getDefaultPreferences: jest.fn(),
            validatePreferenceData: jest.fn(),
        } as any;

        // Mock repositories
        mockCommandsRepository = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            bulkCreate: jest.fn(),
            upsert: jest.fn(),
        } as any;

        mockQueriesRepo = {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findMany: jest.fn(),
        } as any;

        // Create service instance
        service = new UserPreferenceCommandsSvc(mockUserPreferenceQueriesSvc);
        
        // Manually set private properties for testing
        (service as any).commandsRepository = mockCommandsRepository;
        (service as any).queriesRepository = mockQueriesRepo;
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

            const createdPreference: UserPreferenceAttributes = {
                id: 1,
                ...preferenceData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mock: 用戶沒有現有的偏好設定
            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(null);
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({ valid: true });
            mockCommandsRepository.create.mockResolvedValue(createdPreference);

            const result = await service.createUserPreference(preferenceData);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(createdPreference);
            expect(mockCommandsRepository.create).toHaveBeenCalledWith(preferenceData);
        });

        it('應該在用戶偏好設定已存在時返回錯誤', async () => {
            const preferenceData: UserPreferenceCreationAttributes = {
                userId: 1,
                theme: 'dark'
            };

            const existingPreference: UserPreferenceAttributes = {
                id: 1,
                userId: 1,
                theme: 'light',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(existingPreference);

            const result = await service.createUserPreference(preferenceData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('該用戶的偏好設定已存在');
            expect(mockCommandsRepository.create).not.toHaveBeenCalled();
        });

        it('應該在偏好設定資料格式錯誤時返回錯誤', async () => {
            const preferenceData: UserPreferenceCreationAttributes = {
                userId: 1,
                theme: 'invalid-theme', // 無效主題
                language: 'invalid-lang' // 無效語言
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(null);
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({
                valid: false,
                errors: ['無效的主題設定', '無效的語言設定']
            });

            const result = await service.createUserPreference(preferenceData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('偏好設定資料格式錯誤');
            expect(mockCommandsRepository.create).not.toHaveBeenCalled();
        });

        it('應該處理創建過程中的異常', async () => {
            const preferenceData: UserPreferenceCreationAttributes = {
                userId: 1,
                theme: 'dark'
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(null);
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({ valid: true });
            mockCommandsRepository.create.mockRejectedValue(new Error('Database error'));

            const result = await service.createUserPreference(preferenceData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('偏好設定創建失敗');
        });
    });

    describe('updateUserPreference', () => {
        it('應該成功更新用戶偏好設定', async () => {
            const preferenceId = 1;
            const updateData = {
                theme: 'light',
                language: 'en-US',
                notifications: {
                    email: false,
                    push: true,
                    sms: false
                }
            };

            const existingPreference: UserPreferenceAttributes = {
                id: preferenceId,
                userId: 1,
                theme: 'dark',
                language: 'zh-TW',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const updatedPreference: UserPreferenceAttributes = {
                ...existingPreference,
                ...updateData,
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceById.mockResolvedValue(existingPreference);
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({ valid: true });
            mockCommandsRepository.update.mockResolvedValue(updatedPreference);

            const result = await service.updateUserPreference(preferenceId, updateData);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(updatedPreference);
            expect(mockCommandsRepository.update).toHaveBeenCalledWith(preferenceId, updateData);
        });

        it('應該在找不到偏好設定時返回錯誤', async () => {
            const preferenceId = 999;
            const updateData = { theme: 'dark' };

            mockUserPreferenceQueriesSvc.getUserPreferenceById.mockResolvedValue(null);

            const result = await service.updateUserPreference(preferenceId, updateData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('找不到指定的偏好設定');
            expect(mockCommandsRepository.update).not.toHaveBeenCalled();
        });

        it('應該在更新資料格式錯誤時返回錯誤', async () => {
            const preferenceId = 1;
            const updateData = {
                theme: 'invalid-theme',
                timezone: 'invalid-timezone'
            };

            const existingPreference: UserPreferenceAttributes = {
                id: preferenceId,
                userId: 1,
                theme: 'dark',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceById.mockResolvedValue(existingPreference);
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({
                valid: false,
                errors: ['無效的主題設定', '無效的時區設定']
            });

            const result = await service.updateUserPreference(preferenceId, updateData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('偏好設定資料格式錯誤');
            expect(mockCommandsRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteUserPreference', () => {
        it('應該成功刪除用戶偏好設定', async () => {
            const preferenceId = 1;
            const existingPreference: UserPreferenceAttributes = {
                id: preferenceId,
                userId: 1,
                theme: 'dark',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceById.mockResolvedValue(existingPreference);
            mockCommandsRepository.delete.mockResolvedValue(true);

            const result = await service.deleteUserPreference(preferenceId);

            expect(result.success).toBe(true);
            expect(result.message).toContain('用戶偏好設定刪除成功');
            expect(mockCommandsRepository.delete).toHaveBeenCalledWith(preferenceId);
        });

        it('應該在找不到偏好設定時返回錯誤', async () => {
            const preferenceId = 999;
            mockUserPreferenceQueriesSvc.getUserPreferenceById.mockResolvedValue(null);

            const result = await service.deleteUserPreference(preferenceId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('找不到指定的偏好設定');
            expect(mockCommandsRepository.delete).not.toHaveBeenCalled();
        });

        it('應該處理刪除過程中的異常', async () => {
            const preferenceId = 1;
            const existingPreference: UserPreferenceAttributes = {
                id: preferenceId,
                userId: 1,
                theme: 'dark',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceById.mockResolvedValue(existingPreference);
            mockCommandsRepository.delete.mockRejectedValue(new Error('Database error'));

            const result = await service.deleteUserPreference(preferenceId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('偏好設定刪除失敗');
        });
    });

    describe('bulkCreateUserPreferences', () => {
        it('應該成功批量創建用戶偏好設定', async () => {
            const preferencesData: UserPreferenceCreationAttributes[] = [
                { userId: 1, theme: 'dark', language: 'zh-TW' },
                { userId: 2, theme: 'light', language: 'en-US' }
            ];

            const createdPreferences: UserPreferenceAttributes[] = preferencesData.map((data, index) => ({
                id: index + 1,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            // Mock: 兩個用戶都沒有現有的偏好設定
            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({ valid: true });
            
            mockCommandsRepository.bulkCreate.mockResolvedValue({
                successful: createdPreferences,
                failed: [],
                successCount: 2,
                failedCount: 0
            });

            const result = await service.bulkCreateUserPreferences(preferencesData);

            expect(result.success).toBe(true);
            expect(result.data?.successCount).toBe(2);
            expect(result.data?.failedCount).toBe(0);
            expect(result.data?.successful).toEqual(createdPreferences);
        });

        it('應該處理部分成功的批量創建', async () => {
            const preferencesData: UserPreferenceCreationAttributes[] = [
                { userId: 1, theme: 'dark' },
                { userId: 2, theme: 'invalid-theme' } // 這個會失敗
            ];

            const successfulPreference: UserPreferenceAttributes = {
                id: 1,
                userId: 1,
                theme: 'dark',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mock: 第一個用戶沒有現有設定，第二個用戶的資料無效
            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
                
            mockUserPreferenceQueriesSvc.validatePreferenceData
                .mockReturnValueOnce({ valid: true })
                .mockReturnValueOnce({ 
                    valid: false, 
                    errors: ['無效的主題設定'] 
                });

            const result = await service.bulkCreateUserPreferences(preferencesData);

            expect(result.success).toBe(true);
            expect(result.data?.successCount).toBe(1);
            expect(result.data?.failedCount).toBe(1);
            expect(result.data?.successful).toHaveLength(1);
            expect(result.data?.failed).toHaveLength(1);
        });

        it('應該在沒有有效資料時返回錯誤', async () => {
            const preferencesData: UserPreferenceCreationAttributes[] = [
                { userId: 1, theme: 'invalid' },
                { userId: 2, theme: 'also-invalid' }
            ];

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(null);
            mockUserPreferenceQueriesSvc.validatePreferenceData.mockReturnValue({ 
                valid: false, 
                errors: ['無效的主題設定'] 
            });

            const result = await service.bulkCreateUserPreferences(preferencesData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('沒有有效的偏好設定資料');
        });
    });

    describe('resetUserPreferences', () => {
        it('應該成功重設用戶偏好設定為默認值', async () => {
            const userId = 1;
            const existingPreference: UserPreferenceAttributes = {
                id: 1,
                userId: userId,
                theme: 'dark',
                language: 'en-US',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const defaultPreferences = {
                theme: 'light',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                }
            };

            const resetPreference: UserPreferenceAttributes = {
                ...existingPreference,
                ...defaultPreferences,
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(existingPreference);
            mockUserPreferenceQueriesSvc.getDefaultPreferences.mockReturnValue(defaultPreferences);
            mockCommandsRepository.update.mockResolvedValue(resetPreference);

            const result = await service.resetUserPreferences(userId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(resetPreference);
            expect(mockCommandsRepository.update).toHaveBeenCalledWith(
                existingPreference.id,
                defaultPreferences
            );
        });

        it('應該在沒有現有偏好設定時創建默認設定', async () => {
            const userId = 1;
            const defaultPreferences = {
                theme: 'light',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                notifications: {
                    email: true,
                    push: true,
                    sms: false
                }
            };

            const createdPreference: UserPreferenceAttributes = {
                id: 1,
                userId: userId,
                ...defaultPreferences,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(null);
            mockUserPreferenceQueriesSvc.getDefaultPreferences.mockReturnValue(defaultPreferences);
            mockCommandsRepository.create.mockResolvedValue(createdPreference);

            const result = await service.resetUserPreferences(userId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(createdPreference);
            expect(mockCommandsRepository.create).toHaveBeenCalledWith({
                userId: userId,
                ...defaultPreferences
            });
        });

        it('應該處理重設過程中的異常', async () => {
            const userId = 1;
            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockRejectedValue(
                new Error('Database error')
            );

            const result = await service.resetUserPreferences(userId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('偏好設定重設失敗');
        });
    });

    describe('migrateUserPreferences', () => {
        it('應該成功遷移用戶偏好設定', async () => {
            const fromUserId = 1;
            const toUserId = 2;

            const sourcePreference: UserPreferenceAttributes = {
                id: 1,
                userId: fromUserId,
                theme: 'dark',
                language: 'zh-TW',
                timezone: 'Asia/Taipei',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const migratedPreference: UserPreferenceAttributes = {
                id: 2,
                userId: toUserId,
                theme: sourcePreference.theme,
                language: sourcePreference.language,
                timezone: sourcePreference.timezone,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId
                .mockResolvedValueOnce(sourcePreference) // 來源用戶
                .mockResolvedValueOnce(null); // 目標用戶沒有現有設定

            mockCommandsRepository.create.mockResolvedValue(migratedPreference);

            const result = await service.migrateUserPreferences(fromUserId, toUserId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(migratedPreference);
            expect(mockCommandsRepository.create).toHaveBeenCalledWith({
                userId: toUserId,
                theme: sourcePreference.theme,
                language: sourcePreference.language,
                timezone: sourcePreference.timezone
            });
        });

        it('應該在來源用戶沒有偏好設定時返回錯誤', async () => {
            const fromUserId = 1;
            const toUserId = 2;

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId.mockResolvedValue(null);

            const result = await service.migrateUserPreferences(fromUserId, toUserId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('來源用戶沒有偏好設定可供遷移');
        });

        it('應該在目標用戶已有偏好設定時返回錯誤', async () => {
            const fromUserId = 1;
            const toUserId = 2;

            const sourcePreference: UserPreferenceAttributes = {
                id: 1,
                userId: fromUserId,
                theme: 'dark',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const targetPreference: UserPreferenceAttributes = {
                id: 2,
                userId: toUserId,
                theme: 'light',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockUserPreferenceQueriesSvc.getUserPreferenceByUserId
                .mockResolvedValueOnce(sourcePreference)
                .mockResolvedValueOnce(targetPreference);

            const result = await service.migrateUserPreferences(fromUserId, toUserId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('目標用戶已有偏好設定');
        });
    });
});