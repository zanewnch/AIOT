/**
 * @fileoverview Unit tests for UserService
 */

import { UserService } from '../../../services/UserService';
import { UserRepositorysitorysitorysitory } from.*Repositorysitorysitorysitorysitory';
import { createMockRepository } from '../../setup';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService - Unit Tests', () => {
  let userService: UserService;
  let mockUserRepositorysitorysitorysitory: jest.Mocked<UserRepositorysitorysitorysitory>;

  beforeEach(() => {
    // Create mock repository
    mockUserRepositorysitorysitorysitory = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getAllUsers: jest.fn(),
      getUsersWithRoles: jest.fn(),
      getUserPermissions: jest.fn(),
      searchUsers: jest.fn()
    } as any;

    userService = new UserService(mockUserRepositorysitorysitorysitory);
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword'
      };
      
      const hashedPassword = 'hashedpassword';
      const createdUser = {
        id: 1,
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        isActive: true
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepositorysitorysitorysitory.createUser.mockResolvedValue(createdUser as any);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepositorysitorysitorysitory.createUser).toHaveBeenCalledWith({
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        isActive: true
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw error if username already exists', async () => {
      // Arrange
      const userData = {
        username: 'existing',
        email: 'test@example.com',
        password: 'password'
      };

      mockUserRepositorysitorysitorysitory.getUserByUsername.mockResolvedValue({} as any);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Username already exists');
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password'
      };

      mockUserRepositorysitorysitorysitory.getUserByUsername.mockResolvedValue(null);
      mockUserRepositorysitorysitorysitory.getUserByEmail.mockResolvedValue({} as any);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Email already exists');
    });

    it('should validate email format', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password'
      };

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Invalid email format');
    });

    it('should validate password strength', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too weak
      };

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      // Arrange
      const credentials = {
        username: 'testuser',
        password: 'correctpassword'
      };
      
      const user = {
        id: 1,
        username: credentials.username,
        passwordHash: 'hashedpassword',
        isActive: true
      };

      mockUserRepositorysitorysitorysitory.getUserByUsername.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await userService.authenticateUser(credentials);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.getUserByUsername).toHaveBeenCalledWith(credentials.username);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(credentials.password, user.passwordHash);
      expect(result).toEqual(user);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      const credentials = {
        username: 'nonexistent',
        password: 'password'
      };

      mockUserRepositorysitorysitorysitory.getUserByUsername.mockResolvedValue(null);

      // Act
      const result = await userService.authenticateUser(credentials);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      // Arrange
      const credentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      
      const user = {
        id: 1,
        username: credentials.username,
        passwordHash: 'hashedpassword',
        isActive: true
      };

      mockUserRepositorysitorysitorysitory.getUserByUsername.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await userService.authenticateUser(credentials);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      const credentials = {
        username: 'testuser',
        password: 'correctpassword'
      };
      
      const user = {
        id: 1,
        username: credentials.username,
        passwordHash: 'hashedpassword',
        isActive: false
      };

      mockUserRepositorysitorysitorysitory.getUserByUsername.mockResolvedValue(user as any);

      // Act
      const result = await userService.authenticateUser(credentials);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 1;
      const user = { id: userId, username: 'testuser' };
      
      mockUserRepositorysitorysitorysitory.getUserById.mockResolvedValue(user as any);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 999;
      
      mockUserRepositorysitorysitorysitory.getUserById.mockResolvedValue(null);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for invalid user ID', async () => {
      // Arrange
      const invalidId = -1;

      // Act & Assert
      await expect(userService.getUserById(invalidId)).rejects.toThrow('Invalid user ID');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        email: 'newemail@example.com'
      };
      
      const updatedUser = {
        id: userId,
        username: 'testuser',
        email: updateData.email,
        isActive: true
      };

      mockUserRepositorysitorysitorysitory.updateUser.mockResolvedValue(updatedUser as any);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should hash new password when updating', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        password: 'newpassword'
      };
      
      const hashedPassword = 'newhashedpassword';
      const updatedUser = {
        id: userId,
        passwordHash: hashedPassword
      };

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepositorysitorysitorysitory.updateUser.mockResolvedValue(updatedUser as any);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(updateData.password, 10);
      expect(mockUserRepositorysitorysitorysitory.updateUser).toHaveBeenCalledWith(userId, {
        passwordHash: hashedPassword
      });
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 999;
      const updateData = { email: 'test@example.com' };
      
      mockUserRepositorysitorysitorysitory.updateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow('User not found');
    });

    it('should validate email format when updating', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 1;
      
      mockUserRepositorysitorysitorysitory.deleteUser.mockResolvedValue(true);

      // Act
      const result = await userService.deleteUser(userId);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Arrange
      const userId = 999;
      
      mockUserRepositorysitorysitorysitory.deleteUser.mockResolvedValue(false);

      // Act
      const result = await userService.deleteUser(userId);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error for invalid user ID', async () => {
      // Arrange
      const invalidId = -1;

      // Act & Assert
      await expect(userService.deleteUser(invalidId)).rejects.toThrow('Invalid user ID');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];
      
      mockUserRepositorysitorysitorysitory.getAllUsers.mockResolvedValue(users as any);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(mockUserRepositorysitorysitorysitory.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockUserRepositorysitorysitorysitory.getAllUsers.mockResolvedValue([]);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      // Arrange
      const userId = 1;
      const permissions = [
        { id: 1, name: 'read_users' },
        { id: 2, name: 'write_users' }
      ];
      
      mockUserRepositorysitorysitorysitory.getUserPermissions.mockResolvedValue(permissions as any);

      // Act
      const result = await userService.getUserPermissions(userId);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.getUserPermissions).toHaveBeenCalledWith(userId);
      expect(result).toEqual(permissions);
    });

    it('should throw error for invalid user ID', async () => {
      // Arrange
      const invalidId = -1;

      // Act & Assert
      await expect(userService.getUserPermissions(invalidId)).rejects.toThrow('Invalid user ID');
    });
  });

  describe('searchUsers', () => {
    it('should search users with criteria', async () => {
      // Arrange
      const searchCriteria = { username: 'test' };
      const searchResults = [
        { id: 1, username: 'testuser1' },
        { id: 2, username: 'testuser2' }
      ];
      
      mockUserRepositorysitorysitorysitory.searchUsers.mockResolvedValue(searchResults as any);

      // Act
      const result = await userService.searchUsers(searchCriteria);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.searchUsers).toHaveBeenCalledWith(searchCriteria, undefined);
      expect(result).toEqual(searchResults);
    });

    it('should search users with pagination', async () => {
      // Arrange
      const searchCriteria = { username: 'test' };
      const pagination = { limit: 10, offset: 0 };
      const searchResults = [{ id: 1, username: 'testuser1' }];
      
      mockUserRepositorysitorysitorysitory.searchUsers.mockResolvedValue(searchResults as any);

      // Act
      const result = await userService.searchUsers(searchCriteria, pagination);

      // Assert
      expect(mockUserRepositorysitorysitorysitory.searchUsers).toHaveBeenCalledWith(searchCriteria, pagination);
      expect(result).toEqual(searchResults);
    });

    it('should return empty array for no matches', async () => {
      // Arrange
      const searchCriteria = { username: 'nonexistent' };
      
      mockUserRepositorysitorysitorysitory.searchUsers.mockResolvedValue([]);

      // Act
      const result = await userService.searchUsers(searchCriteria);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 1;
      const oldPassword = 'oldpassword';
      const newPassword = 'newpassword';
      
      const user = {
        id: userId,
        passwordHash: 'oldhashedpassword'
      };
      
      const hashedNewPassword = 'newhashedpassword';
      const updatedUser = {
        id: userId,
        passwordHash: hashedNewPassword
      };

      mockUserRepositorysitorysitorysitory.getUserById.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue(hashedNewPassword as never);
      mockUserRepositorysitorysitorysitory.updateUser.mockResolvedValue(updatedUser as any);

      // Act
      const result = await userService.changePassword(userId, oldPassword, newPassword);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(oldPassword, user.passwordHash);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUserRepositorysitorysitorysitory.updateUser).toHaveBeenCalledWith(userId, {
        passwordHash: hashedNewPassword
      });
      expect(result).toBe(true);
    });

    it('should throw error for incorrect old password', async () => {
      // Arrange
      const userId = 1;
      const oldPassword = 'wrongpassword';
      const newPassword = 'newpassword';
      
      const user = {
        id: userId,
        passwordHash: 'hashedpassword'
      };

      mockUserRepositorysitorysitorysitory.getUserById.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(userService.changePassword(userId, oldPassword, newPassword))
        .rejects.toThrow('Incorrect old password');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 999;
      
      mockUserRepositorysitorysitorysitory.getUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.changePassword(userId, 'old', 'new'))
        .rejects.toThrow('User not found');
    });
  });
});