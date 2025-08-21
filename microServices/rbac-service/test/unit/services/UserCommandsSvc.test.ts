/**
 * @fileoverview 使用者命令服務單元測試
 * 
 * 測試 UserCommandsSvc 類別的所有功能，包含：
 * - 使用者創建和驗證測試
 * - 使用者更新和密碼變更測試
 * - 使用者刪除和狀態管理測試
 * - 角色分配和移除測試
 * - Redis 快取管理測試
 * - 密碼加密和驗證測試
 * - 業務邏輯驗證測試
 * - 錯誤處理測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { UserCommandsSvc, CreateUserRequest } from '../../../src/services/commands/UserCommandsSvc.js';
import { UserQueriesSvc, UserDTO } from '../../../src/services/queries/UserQueriesSvc.js';
import { UserCommandsRepo } from '../../../src/repo/commands/rbac/UserCommandsRepo.js';
import { UserModel } from '../../../src/models/rbac/UserModel.js';
import bcrypt from 'bcrypt';
import type { RedisClientType } from 'redis';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
    genSalt: jest.fn(),
}));

// Mock redis config
jest.mock('../../../src/configs/redisConfig.js', () => ({
    getRedisClient: jest.fn(),
}));

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
jest.mock('../../../src/repo/commands/rbac/UserCommandsRepo.js');
jest.mock('../../../src/models/rbac/UserModel.js');

describe('UserCommandsSvc', () => {
    let service: UserCommandsSvc;
    let mockUserQueriesSvc: jest.Mocked<UserQueriesSvc>;
    let mockUserCommandsRepo: jest.Mocked<UserCommandsRepo>;
    let mockRedisClient: jest.Mocked<RedisClientType>;
    let mockUserModel: jest.Mocked<typeof UserModel>;

    const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
    const mockGetRedisClient = jest.mocked(require('../../../src/configs/redisConfig.js').getRedisClient);

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock UserQueriesSvc
        mockUserQueriesSvc = {
            getUserById: jest.fn(),
            getUserByUsername: jest.fn(),
            getUserByEmail: jest.fn(),
            getUsers: jest.fn(),
            searchUsers: jest.fn(),
            getUsersWithRoles: jest.fn(),
            getUsersByRole: jest.fn(),
            getUserPermissions: jest.fn(),
            validateUserCredentials: jest.fn(),
        } as any;

        // Mock UserCommandsRepo
        mockUserCommandsRepo = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            bulkCreate: jest.fn(),
            findById: jest.fn(),
        } as any;

        // Mock Redis client
        mockRedisClient = {
            del: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
            exists: jest.fn(),
            expire: jest.fn(),
        } as any;

        // Mock UserModel
        mockUserModel = {
            create: jest.fn(),
            findByPk: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            findOne: jest.fn(),
        } as any;

        mockGetRedisClient.mockReturnValue(mockRedisClient);

        // Create service instance
        service = new UserCommandsSvc(mockUserQueriesSvc);
        
        // Manually set private properties for testing
        (service as any).userCommandsRepo = mockUserCommandsRepo;
        (UserModel as any) = mockUserModel;
    });

    describe('createUser', () => {
        it('應該成功創建使用者', async () => {
            const createRequest: CreateUserRequest = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'securePassword123'
            };

            const hashedPassword = 'hashedPassword123';
            const createdUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password_hash: hashedPassword,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
                toJSON: () => ({
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                })
            };

            // Mock dependencies
            mockUserQueriesSvc.getUserByUsername.mockResolvedValue(null);
            mockUserQueriesSvc.getUserByEmail.mockResolvedValue(null);
            mockBcrypt.genSalt.mockResolvedValue('salt');
            mockBcrypt.hash.mockResolvedValue(hashedPassword);
            mockUserCommandsRepo.create.mockResolvedValue(createdUser as any);

            const result = await service.createUser(createRequest);

            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user?.username).toBe('testuser');
            expect(mockUserCommandsRepo.create).toHaveBeenCalledWith({
                username: createRequest.username,
                email: createRequest.email,
                password_hash: hashedPassword,
                is_active: true
            });
            expect(mockBcrypt.hash).toHaveBeenCalledWith(createRequest.password, 'salt');
        });

        it('應該在使用者名稱已存在時返回錯誤', async () => {
            const createRequest: CreateUserRequest = {
                username: 'existinguser',
                email: 'test@example.com',
                password: 'password123'
            };

            const existingUser: UserDTO = {
                id: 1,
                username: 'existinguser',
                email: 'existing@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserByUsername.mockResolvedValue(existingUser);

            const result = await service.createUser(createRequest);

            expect(result.success).toBe(false);
            expect(result.message).toContain('使用者名稱已存在');
            expect(mockUserCommandsRepo.create).not.toHaveBeenCalled();
        });

        it('應該在電子郵件已存在時返回錯誤', async () => {
            const createRequest: CreateUserRequest = {
                username: 'testuser',
                email: 'existing@example.com',
                password: 'password123'
            };

            const existingUser: UserDTO = {
                id: 1,
                username: 'anotheruser',
                email: 'existing@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserByUsername.mockResolvedValue(null);
            mockUserQueriesSvc.getUserByEmail.mockResolvedValue(existingUser);

            const result = await service.createUser(createRequest);

            expect(result.success).toBe(false);
            expect(result.message).toContain('電子郵件已存在');
            expect(mockUserCommandsRepo.create).not.toHaveBeenCalled();
        });

        it('應該在密碼加密失敗時處理錯誤', async () => {
            const createRequest: CreateUserRequest = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            mockUserQueriesSvc.getUserByUsername.mockResolvedValue(null);
            mockUserQueriesSvc.getUserByEmail.mockResolvedValue(null);
            mockBcrypt.genSalt.mockRejectedValue(new Error('Salt generation failed'));

            const result = await service.createUser(createRequest);

            expect(result.success).toBe(false);
            expect(result.message).toContain('使用者創建失敗');
        });
    });

    describe('updateUser', () => {
        it('應該成功更新使用者', async () => {
            const userId = 1;
            const updateData = {
                email: 'updated@example.com',
                display_name: 'Updated Name'
            };

            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'old@example.com',
                display_name: 'Old Name',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const updatedUser = {
                ...existingUser,
                ...updateData,
                updated_at: new Date(),
                toJSON: () => ({ ...existingUser, ...updateData })
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserQueriesSvc.getUserByEmail.mockResolvedValue(null); // email 不衝突
            mockUserCommandsRepo.update.mockResolvedValue(updatedUser as any);
            mockRedisClient.del.mockResolvedValue(1);

            const result = await service.updateUser(userId, updateData);

            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(mockUserCommandsRepo.update).toHaveBeenCalledWith(userId, updateData);
            expect(mockRedisClient.del).toHaveBeenCalledWith(`user:${userId}`);
        });

        it('應該在使用者不存在時返回錯誤', async () => {
            const userId = 999;
            const updateData = { email: 'new@example.com' };

            mockUserQueriesSvc.getUserById.mockResolvedValue(null);

            const result = await service.updateUser(userId, updateData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('使用者不存在');
            expect(mockUserCommandsRepo.update).not.toHaveBeenCalled();
        });

        it('應該在新電子郵件已被使用時返回錯誤', async () => {
            const userId = 1;
            const updateData = { email: 'taken@example.com' };

            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'old@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const conflictUser: UserDTO = {
                id: 2,
                username: 'anotheruser',
                email: 'taken@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserQueriesSvc.getUserByEmail.mockResolvedValue(conflictUser);

            const result = await service.updateUser(userId, updateData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('電子郵件已被其他使用者使用');
        });
    });

    describe('deleteUser', () => {
        it('應該成功刪除使用者', async () => {
            const userId = 1;
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.delete.mockResolvedValue(true);
            mockRedisClient.del.mockResolvedValue(1);

            const result = await service.deleteUser(userId);

            expect(result.success).toBe(true);
            expect(result.message).toContain('使用者刪除成功');
            expect(mockUserCommandsRepo.delete).toHaveBeenCalledWith(userId);
            expect(mockRedisClient.del).toHaveBeenCalledWith(`user:${userId}`);
        });

        it('應該在使用者不存在時返回錯誤', async () => {
            const userId = 999;
            mockUserQueriesSvc.getUserById.mockResolvedValue(null);

            const result = await service.deleteUser(userId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('使用者不存在');
            expect(mockUserCommandsRepo.delete).not.toHaveBeenCalled();
        });
    });

    describe('changePassword', () => {
        it('應該成功更改密碼', async () => {
            const userId = 1;
            const currentPassword = 'oldPassword123';
            const newPassword = 'newPassword123';
            
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const userWithPassword = {
                ...existingUser,
                password_hash: 'hashedOldPassword'
            };

            const newHashedPassword = 'hashedNewPassword';

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.findById.mockResolvedValue(userWithPassword as any);
            mockBcrypt.compare.mockResolvedValue(true);
            mockBcrypt.genSalt.mockResolvedValue('salt');
            mockBcrypt.hash.mockResolvedValue(newHashedPassword);
            mockUserCommandsRepo.update.mockResolvedValue(userWithPassword as any);
            mockRedisClient.del.mockResolvedValue(1);

            const result = await service.changePassword(userId, currentPassword, newPassword);

            expect(result.success).toBe(true);
            expect(result.message).toContain('密碼更新成功');
            expect(mockBcrypt.compare).toHaveBeenCalledWith(currentPassword, 'hashedOldPassword');
            expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
            expect(mockUserCommandsRepo.update).toHaveBeenCalledWith(userId, {
                password_hash: newHashedPassword
            });
        });

        it('應該在目前密碼錯誤時返回錯誤', async () => {
            const userId = 1;
            const currentPassword = 'wrongPassword';
            const newPassword = 'newPassword123';

            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const userWithPassword = {
                ...existingUser,
                password_hash: 'hashedPassword'
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.findById.mockResolvedValue(userWithPassword as any);
            mockBcrypt.compare.mockResolvedValue(false);

            const result = await service.changePassword(userId, currentPassword, newPassword);

            expect(result.success).toBe(false);
            expect(result.message).toContain('目前密碼錯誤');
            expect(mockUserCommandsRepo.update).not.toHaveBeenCalled();
        });

        it('應該在使用者不存在時返回錯誤', async () => {
            const userId = 999;
            mockUserQueriesSvc.getUserById.mockResolvedValue(null);

            const result = await service.changePassword(userId, 'oldPass', 'newPass');

            expect(result.success).toBe(false);
            expect(result.message).toContain('使用者不存在');
        });
    });

    describe('activateUser', () => {
        it('應該成功啟用使用者', async () => {
            const userId = 1;
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: false,
                created_at: new Date(),
                updated_at: new Date()
            };

            const activatedUser = {
                ...existingUser,
                is_active: true,
                updated_at: new Date(),
                toJSON: () => ({ ...existingUser, is_active: true })
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.update.mockResolvedValue(activatedUser as any);
            mockRedisClient.del.mockResolvedValue(1);

            const result = await service.activateUser(userId);

            expect(result.success).toBe(true);
            expect(result.user?.is_active).toBe(true);
            expect(mockUserCommandsRepo.update).toHaveBeenCalledWith(userId, {
                is_active: true
            });
        });

        it('應該在使用者已啟用時返回適當訊息', async () => {
            const userId = 1;
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true, // 已經啟用
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);

            const result = await service.activateUser(userId);

            expect(result.success).toBe(true);
            expect(result.message).toContain('使用者已經是啟用狀態');
            expect(mockUserCommandsRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('deactivateUser', () => {
        it('應該成功停用使用者', async () => {
            const userId = 1;
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const deactivatedUser = {
                ...existingUser,
                is_active: false,
                updated_at: new Date(),
                toJSON: () => ({ ...existingUser, is_active: false })
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.update.mockResolvedValue(deactivatedUser as any);
            mockRedisClient.del.mockResolvedValue(1);

            const result = await service.deactivateUser(userId);

            expect(result.success).toBe(true);
            expect(result.user?.is_active).toBe(false);
            expect(mockUserCommandsRepo.update).toHaveBeenCalledWith(userId, {
                is_active: false
            });
        });

        it('應該在使用者已停用時返回適當訊息', async () => {
            const userId = 1;
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: false, // 已經停用
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);

            const result = await service.deactivateUser(userId);

            expect(result.success).toBe(true);
            expect(result.message).toContain('使用者已經是停用狀態');
            expect(mockUserCommandsRepo.update).not.toHaveBeenCalled();
        });
    });

    describe('Redis 快取管理', () => {
        it('應該在更新使用者後清除快取', async () => {
            const userId = 1;
            const updateData = { display_name: 'New Name' };

            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const updatedUser = {
                ...existingUser,
                ...updateData,
                toJSON: () => ({ ...existingUser, ...updateData })
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.update.mockResolvedValue(updatedUser as any);
            mockRedisClient.del.mockResolvedValue(1);

            await service.updateUser(userId, updateData);

            expect(mockRedisClient.del).toHaveBeenCalledWith(`user:${userId}`);
        });

        it('應該在刪除使用者後清除快取', async () => {
            const userId = 1;
            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.delete.mockResolvedValue(true);
            mockRedisClient.del.mockResolvedValue(1);

            await service.deleteUser(userId);

            expect(mockRedisClient.del).toHaveBeenCalledWith(`user:${userId}`);
        });

        it('應該處理 Redis 錯誤但不影響主要功能', async () => {
            const userId = 1;
            const updateData = { display_name: 'New Name' };

            const existingUser: UserDTO = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                display_name: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            };

            const updatedUser = {
                ...existingUser,
                ...updateData,
                toJSON: () => ({ ...existingUser, ...updateData })
            };

            mockUserQueriesSvc.getUserById.mockResolvedValue(existingUser);
            mockUserCommandsRepo.update.mockResolvedValue(updatedUser as any);
            mockRedisClient.del.mockRejectedValue(new Error('Redis connection failed'));

            const result = await service.updateUser(userId, updateData);

            // 主要功能仍應成功，即使 Redis 失敗
            expect(result.success).toBe(true);
            expect(mockRedisClient.del).toHaveBeenCalledWith(`user:${userId}`);
        });
    });
});