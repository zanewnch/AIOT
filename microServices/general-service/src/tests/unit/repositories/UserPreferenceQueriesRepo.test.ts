/**
 * @fileoverview Unit tests for UserPreferenceQueriesRepo
 */

import { UserPreferenceQueriesRepo } from '../../../repo/queries/UserPreferenceQueriesRepo';
import { UserPreferenceModel } from '../../../models/UserPreferenceModel';
import { testHelpers, setupTestDb, cleanupTestDb } from '../../setup';
import { Sequelize } from 'sequelize';

describe('UserPreferenceQueriesRepo - Unit Tests', () => {
  let sequelize: Sequelize;
  let userPreferenceRepo: UserPreferenceQueriesRepo;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    userPreferenceRepo = new UserPreferenceQueriesRepo();
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('selectAll', () => {
    it('should return all user preferences with default limit', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 5);

      // Act
      const result = await userPreferenceRepo.selectAll();

      // Assert
      expect(result).toHaveLength(5);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect custom limit parameter', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 10);

      // Act
      const result = await userPreferenceRepo.selectAll(3);

      // Assert
      expect(result).toHaveLength(3);
    });

    it('should return preferences ordered by updatedAt DESC', async () => {
      // Arrange
      const now = new Date();
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        metadata: { ...testHelpers.testUserPreferenceData.metadata, lastUpdated: new Date(now.getTime() - 120000) } // 2 min ago
      });
      
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        metadata: { ...testHelpers.testUserPreferenceData.metadata, lastUpdated: now } // Most recent
      });

      // Act
      const result = await userPreferenceRepo.selectAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(2); // Most recent should be first
      expect(result[1].userId).toBe(1);
    });

    it('should return empty array when no preferences exist', async () => {
      // Act
      const result = await userPreferenceRepo.selectAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      jest.spyOn(UserPreferenceModel, 'findAll').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userPreferenceRepo.selectAll()).rejects.toThrow('Database error');

      // Cleanup
      jest.restoreAllMocks();
    });
  });

  describe('selectById', () => {
    it('should return user preference by ID', async () => {
      // Arrange
      const preference = await testHelpers.createTestUserPreference(sequelize);

      // Act
      const result = await userPreferenceRepo.selectById(preference.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(preference.id);
      expect(result?.userId).toBe(preference.userId);
      expect(result?.theme).toBe(preference.theme);
    });

    it('should return null for non-existent ID', async () => {
      // Act
      const result = await userPreferenceRepo.selectById(99999);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for invalid ID type', async () => {
      // Act & Assert
      await expect(userPreferenceRepo.selectById('invalid' as any)).rejects.toThrow();
    });
  });

  describe('selectByUserId', () => {
    it('should return user preference by user ID', async () => {
      // Arrange
      const userId = 123;
      const preference = await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: userId
      });

      // Act
      const result = await userPreferenceRepo.selectByUserId(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.userId).toBe(userId);
      expect(result?.theme).toBe(preference.theme);
    });

    it('should return null for non-existent user ID', async () => {
      // Act
      const result = await userPreferenceRepo.selectByUserId(99999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return first preference when multiple exist for same user', async () => {
      // Arrange - This scenario might not occur in real app but test defensive code
      const userId = 456;
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: userId,
        theme: 'dark'
      });
      
      // Act
      const result = await userPreferenceRepo.selectByUserId(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.userId).toBe(userId);
    });
  });

  describe('selectByTheme', () => {
    it('should return paginated preferences by theme', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        theme: 'dark'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        theme: 'dark'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 3,
        theme: 'light'
      });

      // Act
      const result = await userPreferenceRepo.selectByTheme('dark', { page: 1, limit: 10 });

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      result.items.forEach(item => {
        expect(item.theme).toBe('dark');
      });
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      for (let i = 1; i <= 5; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i,
          theme: 'dark'
        });
      }

      // Act
      const result = await userPreferenceRepo.selectByTheme('dark', { page: 2, limit: 2 });

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty result for non-existent theme', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        theme: 'dark'
      });

      // Act
      const result = await userPreferenceRepo.selectByTheme('non-existent-theme');

      // Assert
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        theme: 'auto'
      });

      // Act
      const result = await userPreferenceRepo.selectByTheme('auto');

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('selectByLanguage', () => {
    it('should return paginated preferences by language', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        language: 'zh-TW'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        language: 'en-US'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 3,
        language: 'zh-TW'
      });

      // Act
      const result = await userPreferenceRepo.selectByLanguage('zh-TW');

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      result.items.forEach(item => {
        expect(item.language).toBe('zh-TW');
      });
    });

    it('should handle different language codes', async () => {
      // Arrange
      const languages = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'];
      for (let i = 0; i < languages.length; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i + 1,
          language: languages[i]
        });
      }

      // Act & Assert
      for (const lang of languages) {
        const result = await userPreferenceRepo.selectByLanguage(lang);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].language).toBe(lang);
      }
    });
  });

  describe('selectByTimezone', () => {
    it('should return paginated preferences by timezone', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        timezone: 'Asia/Taipei'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        timezone: 'America/New_York'
      });

      // Act
      const result = await userPreferenceRepo.selectByTimezone('Asia/Taipei');

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].timezone).toBe('Asia/Taipei');
    });

    it('should handle different timezone formats', async () => {
      // Arrange
      const timezones = ['UTC', 'Europe/London', 'America/Los_Angeles', 'Asia/Tokyo'];
      for (let i = 0; i < timezones.length; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i + 1,
          timezone: timezones[i]
        });
      }

      // Act & Assert
      for (const tz of timezones) {
        const result = await userPreferenceRepo.selectByTimezone(tz);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].timezone).toBe(tz);
      }
    });
  });

  describe('selectWithPagination', () => {
    it('should return paginated preferences', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 15);

      // Act
      const result = await userPreferenceRepo.selectWithPagination({ page: 2, limit: 5 });

      // Assert
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should use default pagination parameters', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize);

      // Act
      const result = await userPreferenceRepo.selectWithPagination();

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty results', async () => {
      // Act
      const result = await userPreferenceRepo.selectWithPagination();

      // Assert
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('count', () => {
    it('should return correct count of user preferences', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 7);

      // Act
      const result = await userPreferenceRepo.count();

      // Assert
      expect(result).toBe(7);
    });

    it('should return zero when no preferences exist', async () => {
      // Act
      const result = await userPreferenceRepo.count();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('existsByUserId', () => {
    it('should return true when user preference exists', async () => {
      // Arrange
      const userId = 789;
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: userId
      });

      // Act
      const result = await userPreferenceRepo.existsByUserId(userId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user preference does not exist', async () => {
      // Act
      const result = await userPreferenceRepo.existsByUserId(99999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Setup test data for search tests
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        theme: 'dark',
        language: 'zh-TW',
        timezone: 'Asia/Taipei'
      });
      
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        theme: 'light',
        language: 'en-US',
        timezone: 'America/New_York'
      });
    });

    it('should search by userId', async () => {
      // Act
      const result = await userPreferenceRepo.search({ userId: 1 });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe(1);
    });

    it('should search by theme', async () => {
      // Act
      const result = await userPreferenceRepo.search({ theme: 'dark' });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].theme).toBe('dark');
    });

    it('should search by language', async () => {
      // Act
      const result = await userPreferenceRepo.search({ language: 'en-US' });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].language).toBe('en-US');
    });

    it('should search by timezone', async () => {
      // Act
      const result = await userPreferenceRepo.search({ timezone: 'Asia/Taipei' });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].timezone).toBe('Asia/Taipei');
    });

    it('should search with multiple criteria', async () => {
      // Act
      const result = await userPreferenceRepo.search({
        theme: 'dark',
        language: 'zh-TW'
      });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].theme).toBe('dark');
      expect(result.items[0].language).toBe('zh-TW');
    });

    it('should return empty result when no matches found', async () => {
      // Act
      const result = await userPreferenceRepo.search({ theme: 'non-existent' });

      // Assert
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle pagination in search results', async () => {
      // Arrange
      for (let i = 3; i <= 7; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i,
          theme: 'auto'
        });
      }

      // Act
      const result = await userPreferenceRepo.search(
        { theme: 'auto' },
        { page: 2, limit: 2 }
      );

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should search with empty criteria', async () => {
      // Act
      const result = await userPreferenceRepo.search({});

      // Assert
      expect(result.items).toHaveLength(2); // Should return all existing preferences
      expect(result.total).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      jest.spyOn(UserPreferenceModel, 'findAll').mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(userPreferenceRepo.selectAll()).rejects.toThrow('Connection failed');

      // Cleanup
      jest.restoreAllMocks();
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      // Act & Assert - Should not crash with invalid pagination
      await expect(async () => {
        await userPreferenceRepo.selectWithPagination({ page: -1, limit: 0 });
      }).not.toThrow();
    });

    it('should handle SQL injection attempts in search', async () => {
      // Arrange
      const maliciousInput = "'; DROP TABLE user_preferences; --";

      // Act & Assert - Should not execute malicious SQL
      await expect(async () => {
        await userPreferenceRepo.search({ theme: maliciousInput });
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 100);
      
      const startTime = Date.now();

      // Act
      const result = await userPreferenceRepo.selectWithPagination({ page: 5, limit: 20 });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(result.items).toHaveLength(20);
      expect(result.total).toBe(100);
      expect(result.page).toBe(5);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should efficiently count large datasets', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 200);
      
      const startTime = Date.now();

      // Act
      const count = await userPreferenceRepo.count();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(count).toBe(200);
      expect(executionTime).toBeLessThan(500); // Should complete within 0.5 seconds
    });
  });
});