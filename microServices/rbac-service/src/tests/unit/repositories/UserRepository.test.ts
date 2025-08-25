/**
 * @fileoverview Unit tests for UserRepositorysitorysitorysitory
 */

import { UserRepositorysitorysitorysitory } from.*Repositorysitorysitorysitorysitory';
import { testHelpers, setupTestDb, cleanupTestDb } from '../../setup';
import { Sequelize } from 'sequelize';

describe('UserRepositorysitorysitorysitory - Unit Tests', () => {
  let sequelize: Sequelize;
  let userRepositorysitorysitorysitory: UserRepositorysitorysitorysitory;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    userRepositorysitorysitorysitory = new UserRepositorysitorysitorysitory();
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        passwordHash: 'hashedpassword',
        isActive: true
      };

      // Act
      const result = await userRepositorysitorysitorysitory.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.username).toBe(userData.username);
      expect(result.email).toBe(userData.email);
      expect(result.isActive).toBe(true);
    });

    it('should throw error for duplicate username', async () => {
      // Arrange
      const userData = {
        username: 'duplicate',
        email: 'test1@example.com',
        passwordHash: 'hash1',
        isActive: true
      };
      
      await userRepositorysitorysitorysitory.createUser(userData);

      // Act & Assert
      await expect(userRepositorysitorysitorysitory.createUser({
        ...userData,
        email: 'test2@example.com'
      })).rejects.toThrow();
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        passwordHash: 'hash',
        isActive: true
      };

      // Act & Assert
      await expect(userRepositorysitorysitorysitory.createUser(userData)).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should return user when id exists', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const result = await userRepositorysitorysitorysitory.getUserById(user.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.username).toBe(user.username);
    });

    it('should return null when id does not exist', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.getUserById(99999);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      // Act & Assert
      await expect(userRepositorysitorysitorysitory.getUserById('invalid' as any)).rejects.toThrow();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when username exists', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const result = await userRepositorysitorysitorysitory.getUserByUsername(user.username);

      // Assert
      expect(result).toBeDefined();
      expect(result.username).toBe(user.username);
    });

    it('should return null when username does not exist', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.getUserByUsername('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should be case sensitive', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize, {
        username: 'CaseSensitive',
        email: 'case@example.com',
        passwordHash: 'hash',
        isActive: true
      });

      // Act
      const result = await userRepositorysitorysitorysitory.getUserByUsername('casesensitive');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const result = await userRepositorysitorysitorysitory.getUserByEmail(user.email);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(user.email);
    });

    it('should return null when email does not exist', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.getUserByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const updateData = {
        email: 'updated@example.com',
        isActive: false
      };

      // Act
      const result = await userRepositorysitorysitorysitory.updateUser(user.id, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(updateData.email);
      expect(result.isActive).toBe(updateData.isActive);
    });

    it('should return null when user does not exist', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.updateUser(99999, { email: 'test@example.com' });

      // Assert
      expect(result).toBeNull();
    });

    it('should not update immutable fields', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const originalUsername = user.username;

      // Act
      const result = await userRepositorysitorysitorysitory.updateUser(user.id, { 
        username: 'newusername' 
      } as any);

      // Assert
      expect(result.username).toBe(originalUsername);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const result = await userRepositorysitorysitorysitory.deleteUser(user.id);

      // Assert
      expect(result).toBe(true);
      
      const deletedUser = await userRepositorysitorysitorysitory.getUserById(user.id);
      expect(deletedUser.isActive).toBe(false);
    });

    it('should return false when user does not exist', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.deleteUser(99999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return all active users', async () => {
      // Arrange
      await testHelpers.createTestUser(sequelize, {
        username: 'user1',
        email: 'user1@example.com',
        passwordHash: 'hash1',
        isActive: true
      });
      
      await testHelpers.createTestUser(sequelize, {
        username: 'user2', 
        email: 'user2@example.com',
        passwordHash: 'hash2',
        isActive: false
      });

      // Act
      const result = await userRepositorysitorysitorysitory.getAllUsers();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    });

    it('should return empty array when no users exist', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.getAllUsers();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getUsersWithRoles', () => {
    it('should return users with their roles', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const role = await testHelpers.createTestRole(sequelize);
      await testHelpers.createUserRole(sequelize, user.id, role.id);

      // Act
      const result = await userRepositorysitorysitorysitory.getUsersWithRoles();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].roles).toBeDefined();
      expect(result[0].roles).toHaveLength(1);
      expect(result[0].roles[0].name).toBe(role.name);
    });

    it('should handle users without roles', async () => {
      // Arrange
      await testHelpers.createTestUser(sequelize);

      // Act
      const result = await userRepositorysitorysitorysitory.getUsersWithRoles();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].roles).toEqual([]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions through roles', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const role = await testHelpers.createTestRole(sequelize);
      const permission = await testHelpers.createTestPermission(sequelize);
      
      await testHelpers.createUserRole(sequelize, user.id, role.id);
      await testHelpers.createRolePermission(sequelize, role.id, permission.id);

      // Act
      const result = await userRepositorysitorysitorysitory.getUserPermissions(user.id);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(permission.name);
    });

    it('should return empty array for user without permissions', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const result = await userRepositorysitorysitorysitory.getUserPermissions(user.id);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent user', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.getUserPermissions(99999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      await testHelpers.createTestUser(sequelize, {
        username: 'john_doe',
        email: 'john@example.com',
        passwordHash: 'hash1',
        isActive: true
      });
      
      await testHelpers.createTestUser(sequelize, {
        username: 'jane_smith',
        email: 'jane@example.com', 
        passwordHash: 'hash2',
        isActive: true
      });
    });

    it('should search users by username', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.searchUsers({ username: 'john' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('john_doe');
    });

    it('should search users by email', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.searchUsers({ email: 'jane@' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('jane@example.com');
    });

    it('should return empty array for no matches', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.searchUsers({ username: 'nonexistent' });

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle pagination', async () => {
      // Act
      const result = await userRepositorysitorysitorysitory.searchUsers({}, { limit: 1, offset: 0 });

      // Assert
      expect(result).toHaveLength(1);
    });
  });
});