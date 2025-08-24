/**
 * @fileoverview Integration tests for User Preference API
 */

import request from 'supertest';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { setupTestDb, cleanupTestDb, testHelpers } from '../../setup';

describe('User Preference API - Integration Tests', () => {
  let app: Application;
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    app = testHelpers.createTestApp();
    
    // Setup user preference routes - mock implementation
    app.get('/api/user-preferences', async (req, res) => {
      try {
        const { page = 1, limit = 10, theme, language, timezone, userId } = req.query;
        
        let whereClause: any = {};
        if (theme) whereClause.theme = theme;
        if (language) whereClause.language = language;
        if (timezone) whereClause.timezone = timezone;
        if (userId) whereClause.userId = Number(userId);

        const offset = (Number(page) - 1) * Number(limit);
        
        const { count: total, rows: items } = await sequelize.models.UserPreference.findAndCountAll({
          where: whereClause,
          limit: Number(limit),
          offset: offset,
          order: [['updatedAt', 'DESC']]
        });

        const totalPages = Math.ceil(total / Number(limit));

        res.json({
          success: true,
          data: {
            items,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/user-preferences/:id', async (req, res) => {
      try {
        const preference = await sequelize.models.UserPreference.findByPk(req.params.id);
        
        if (!preference) {
          return res.status(404).json({
            success: false,
            message: 'User preference not found'
          });
        }

        res.json({
          success: true,
          data: preference
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/user-preferences/user/:userId', async (req, res) => {
      try {
        const preference = await sequelize.models.UserPreference.findOne({
          where: { userId: req.params.userId }
        });
        
        if (!preference) {
          // Return default preferences
          const defaultPreference = {
            id: 0,
            userId: Number(req.params.userId),
            theme: 'auto',
            language: 'zh-TW',
            timezone: 'Asia/Taipei',
            autoSave: true,
            notifications: true
          };

          return res.json({
            success: true,
            data: defaultPreference,
            isDefault: true
          });
        }

        res.json({
          success: true,
          data: preference,
          isDefault: false
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/user-preferences/search', async (req, res) => {
      try {
        const { 
          page = 1, 
          limit = 10,
          theme,
          language,
          timezone,
          autoSave,
          notifications
        } = req.query;

        let whereClause: any = {};
        if (theme) whereClause.theme = theme;
        if (language) whereClause.language = language;
        if (timezone) whereClause.timezone = timezone;
        if (autoSave !== undefined) whereClause.autoSave = autoSave === 'true';
        if (notifications !== undefined) whereClause.notifications = notifications === 'true';

        const offset = (Number(page) - 1) * Number(limit);
        
        const { count: total, rows: items } = await sequelize.models.UserPreference.findAndCountAll({
          where: whereClause,
          limit: Number(limit),
          offset: offset,
          order: [['updatedAt', 'DESC']]
        });

        const totalPages = Math.ceil(total / Number(limit));

        res.json({
          success: true,
          data: {
            items,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/user-preferences/statistics', async (req, res) => {
      try {
        const allPreferences = await sequelize.models.UserPreference.findAll();
        
        const totalUsers = allPreferences.length;
        const themeStats: { [key: string]: number } = {};
        const languageStats: { [key: string]: number } = {};
        const timezoneStats: { [key: string]: number } = {};
        
        let autoSaveEnabled = 0;
        let notificationsEnabled = 0;

        for (const pref of allPreferences) {
          // Statistics for themes
          themeStats[pref.theme] = (themeStats[pref.theme] || 0) + 1;
          
          // Statistics for languages
          languageStats[pref.language] = (languageStats[pref.language] || 0) + 1;
          
          // Statistics for timezones
          timezoneStats[pref.timezone] = (timezoneStats[pref.timezone] || 0) + 1;
          
          // Feature usage statistics
          if (pref.autoSave) autoSaveEnabled++;
          if (pref.notifications) notificationsEnabled++;
        }

        const statistics = {
          totalUsers,
          themeStats,
          languageStats,
          timezoneStats,
          featureUsage: {
            autoSaveEnabled,
            notificationsEnabled
          }
        };

        res.json({
          success: true,
          data: statistics
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/user-preferences/count', async (req, res) => {
      try {
        const count = await sequelize.models.UserPreference.count();
        
        res.json({
          success: true,
          data: { count }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/user-preferences/exists/:userId', async (req, res) => {
      try {
        const count = await sequelize.models.UserPreference.count({
          where: { userId: req.params.userId }
        });
        
        res.json({
          success: true,
          data: { exists: count > 0 }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('GET /api/user-preferences', () => {
    it('should return paginated user preferences', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 5);

      // Act
      const response = await request(app)
        .get('/api/user-preferences?page=1&limit=3')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(3);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should filter by theme', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        theme: 'dark'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        theme: 'light'
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 3,
        theme: 'dark'
      });

      // Act
      const response = await request(app)
        .get('/api/user-preferences?theme=dark')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.theme).toBe('dark');
      });
    });

    it('should filter by language', async () => {
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

      // Act
      const response = await request(app)
        .get('/api/user-preferences?language=zh-TW')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].language).toBe('zh-TW');
    });

    it('should filter by timezone', async () => {
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
      const response = await request(app)
        .get('/api/user-preferences?timezone=Asia/Taipei')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].timezone).toBe('Asia/Taipei');
    });

    it('should filter by userId', async () => {
      // Arrange
      const targetUserId = 123;
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: targetUserId
      });
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 456
      });

      // Act
      const response = await request(app)
        .get(`/api/user-preferences?userId=${targetUserId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].userId).toBe(targetUserId);
    });

    it('should return empty results when no preferences match', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        theme: 'dark'
      });

      // Act
      const response = await request(app)
        .get('/api/user-preferences?theme=non-existent')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should handle invalid pagination gracefully', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize);

      // Act
      const response = await request(app)
        .get('/api/user-preferences?page=0&limit=-1')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      // Should still return data despite invalid pagination
    });
  });

  describe('GET /api/user-preferences/:id', () => {
    it('should return user preference by ID', async () => {
      // Arrange
      const preference = await testHelpers.createTestUserPreference(sequelize);

      // Act
      const response = await request(app)
        .get(`/api/user-preferences/${preference.id}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(preference.id);
      expect(response.body.data.userId).toBe(preference.userId);
      expect(response.body.data.theme).toBe(preference.theme);
    });

    it('should return 404 for non-existent ID', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/99999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User preference not found');
    });

    it('should handle invalid ID format', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/invalid-id')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user-preferences/user/:userId', () => {
    it('should return user preference by user ID', async () => {
      // Arrange
      const userId = 789;
      const preference = await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: userId,
        theme: 'light'
      });

      // Act
      const response = await request(app)
        .get(`/api/user-preferences/user/${userId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.theme).toBe('light');
      expect(response.body.isDefault).toBe(false);
    });

    it('should return default preferences for non-existent user', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/user/99999')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(99999);
      expect(response.body.data.id).toBe(0); // Temporary ID for default
      expect(response.body.data.theme).toBe('auto');
      expect(response.body.data.language).toBe('zh-TW');
      expect(response.body.data.timezone).toBe('Asia/Taipei');
      expect(response.body.data.autoSave).toBe(true);
      expect(response.body.data.notifications).toBe(true);
      expect(response.body.isDefault).toBe(true);
    });

    it('should handle different user IDs for defaults', async () => {
      // Arrange
      const userIds = [111, 222, 333];

      // Act & Assert
      for (const userId of userIds) {
        const response = await request(app)
          .get(`/api/user-preferences/user/${userId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.userId).toBe(userId);
        expect(response.body.isDefault).toBe(true);
      }
    });
  });

  describe('GET /api/user-preferences/search', () => {
    beforeEach(async () => {
      // Setup test data for search tests
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        theme: 'dark',
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        autoSave: true,
        notifications: true
      });

      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        theme: 'light',
        language: 'en-US',
        timezone: 'America/New_York',
        autoSave: false,
        notifications: true
      });

      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 3,
        theme: 'dark',
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        autoSave: true,
        notifications: false
      });
    });

    it('should search by single criteria', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/search?theme=dark')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.theme).toBe('dark');
      });
    });

    it('should search by multiple criteria', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/search?theme=dark&language=zh-TW&autoSave=true')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.theme).toBe('dark');
        expect(item.language).toBe('zh-TW');
        expect(item.autoSave).toBe(true);
      });
    });

    it('should search by boolean values', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/search?autoSave=false')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].userId).toBe(2);
      expect(response.body.data.items[0].autoSave).toBe(false);
    });

    it('should handle pagination in search results', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/search?theme=dark&page=1&limit=1')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should return empty results for no matches', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/search?theme=non-existent')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('GET /api/user-preferences/statistics', () => {
    it('should return comprehensive statistics', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 1,
        theme: 'dark',
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        autoSave: true,
        notifications: true
      });

      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 2,
        theme: 'light',
        language: 'en-US',
        timezone: 'America/New_York',
        autoSave: false,
        notifications: true
      });

      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: 3,
        theme: 'dark',
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        autoSave: true,
        notifications: false
      });

      // Act
      const response = await request(app)
        .get('/api/user-preferences/statistics')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(3);
      
      expect(response.body.data.themeStats).toEqual({
        'dark': 2,
        'light': 1
      });
      
      expect(response.body.data.languageStats).toEqual({
        'zh-TW': 2,
        'en-US': 1
      });
      
      expect(response.body.data.timezoneStats).toEqual({
        'Asia/Taipei': 2,
        'America/New_York': 1
      });
      
      expect(response.body.data.featureUsage.autoSaveEnabled).toBe(2);
      expect(response.body.data.featureUsage.notificationsEnabled).toBe(2);
    });

    it('should return empty statistics for no preferences', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/statistics')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(0);
      expect(response.body.data.themeStats).toEqual({});
      expect(response.body.data.languageStats).toEqual({});
      expect(response.body.data.timezoneStats).toEqual({});
      expect(response.body.data.featureUsage.autoSaveEnabled).toBe(0);
      expect(response.body.data.featureUsage.notificationsEnabled).toBe(0);
    });

    it('should handle single preference statistics', async () => {
      // Arrange
      await testHelpers.createTestUserPreference(sequelize);

      // Act
      const response = await request(app)
        .get('/api/user-preferences/statistics')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(1);
      expect(response.body.data.themeStats[testHelpers.testUserPreferenceData.theme]).toBe(1);
      expect(response.body.data.languageStats[testHelpers.testUserPreferenceData.language]).toBe(1);
      expect(response.body.data.timezoneStats[testHelpers.testUserPreferenceData.timezone]).toBe(1);
    });
  });

  describe('GET /api/user-preferences/count', () => {
    it('should return correct count', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 7);

      // Act
      const response = await request(app)
        .get('/api/user-preferences/count')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(7);
    });

    it('should return zero for empty database', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/count')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('GET /api/user-preferences/exists/:userId', () => {
    it('should return true when user preference exists', async () => {
      // Arrange
      const userId = 456;
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: userId
      });

      // Act
      const response = await request(app)
        .get(`/api/user-preferences/exists/${userId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return false when user preference does not exist', async () => {
      // Act
      const response = await request(app)
        .get('/api/user-preferences/exists/99999')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
    });

    it('should handle multiple user existence checks', async () => {
      // Arrange
      const existingUserId = 111;
      const nonExistingUserId = 222;
      
      await testHelpers.createTestUserPreference(sequelize, {
        ...testHelpers.testUserPreferenceData,
        userId: existingUserId
      });

      // Act & Assert
      const existingResponse = await request(app)
        .get(`/api/user-preferences/exists/${existingUserId}`)
        .expect(200);
      expect(existingResponse.body.data.exists).toBe(true);

      const nonExistingResponse = await request(app)
        .get(`/api/user-preferences/exists/${nonExistingUserId}`)
        .expect(200);
      expect(nonExistingResponse.body.data.exists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Close database connection to simulate error
      await sequelize.close();

      const response = await request(app)
        .get('/api/user-preferences')
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reopen for cleanup
      await setupTestDb();
    });

    it('should handle malformed requests', async () => {
      // Act - Test with extremely large page numbers
      const response = await request(app)
        .get('/api/user-preferences?page=999999999&limit=999999999')
        .expect(200);

      // Assert - Should handle gracefully
      expect(response.body.success).toBe(true);
    });

    it('should handle SQL injection attempts', async () => {
      // Arrange
      const maliciousTheme = "'; DROP TABLE user_preferences; --";
      await testHelpers.createTestUserPreference(sequelize);

      // Act
      const response = await request(app)
        .get(`/api/user-preferences?theme=${encodeURIComponent(maliciousTheme)}`)
        .expect(200);

      // Assert - Should not execute malicious SQL
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      
      // Verify table still exists
      const countResponse = await request(app)
        .get('/api/user-preferences/count')
        .expect(200);
      expect(countResponse.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 100);
      
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get('/api/user-preferences?page=5&limit=20')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(20);
      expect(response.body.data.total).toBe(100);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should efficiently calculate statistics for large datasets', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 50);
      
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get('/api/user-preferences/statistics')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(50);
      expect(responseTime).toBeLessThan(1500); // Should respond within 1.5 seconds
    });

    it('should respond within acceptable time limits', async () => {
      // Arrange
      await testHelpers.createMultipleUserPreferences(sequelize, 30);
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get('/api/user-preferences/search?theme=dark&language=zh-TW')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Data Validation', () => {
    it('should handle various theme values', async () => {
      // Arrange
      const themes = ['light', 'dark', 'auto', 'system', 'custom'];
      
      for (let i = 0; i < themes.length; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i + 1,
          theme: themes[i]
        });
      }

      // Act & Assert
      for (const theme of themes) {
        const response = await request(app)
          .get(`/api/user-preferences?theme=${theme}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0].theme).toBe(theme);
      }
    });

    it('should handle various language codes', async () => {
      // Arrange
      const languages = ['zh-TW', 'zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
      
      for (let i = 0; i < languages.length; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i + 1,
          language: languages[i]
        });
      }

      // Act & Assert
      for (const language of languages) {
        const response = await request(app)
          .get(`/api/user-preferences?language=${language}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0].language).toBe(language);
      }
    });

    it('should handle various timezone formats', async () => {
      // Arrange
      const timezones = ['UTC', 'Asia/Taipei', 'America/New_York', 'Europe/London', 'Australia/Sydney'];
      
      for (let i = 0; i < timezones.length; i++) {
        await testHelpers.createTestUserPreference(sequelize, {
          ...testHelpers.testUserPreferenceData,
          userId: i + 1,
          timezone: timezones[i]
        });
      }

      // Act & Assert
      for (const timezone of timezones) {
        const response = await request(app)
          .get(`/api/user-preferences?timezone=${encodeURIComponent(timezone)}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0].timezone).toBe(timezone);
      }
    });
  });
});