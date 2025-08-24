/**
 * @fileoverview Unit tests for UserPreferenceQueriesSvc
 */

import { UserPreferenceQueriesSvc, UserPreferenceSearchCriteria } from '../../../services/queries/UserPreferenceQueriesSvc';
import { UserPreferenceQueriesRepo } from '../../../repo/queries/UserPreferenceQueriesRepo';
import { UserPreferenceAttributes } from '../../../models/UserPreferenceModel';
import { PaginationParams, PaginatedData } from '../../../types/ApiResponseType';
import { createMockRepository } from '../../setup';

describe('UserPreferenceQueriesSvc - Unit Tests', () => {
  let userPreferenceService: UserPreferenceQueriesSvc;
  let mockUserPreferenceRepo: jest.Mocked<UserPreferenceQueriesRepo>;

  const mockUserPreference: UserPreferenceAttributes = {
    id: 1,
    userId: 123,
    theme: 'dark',
    language: 'zh-TW',
    timezone: 'Asia/Taipei',
    autoSave: true,
    notifications: true
  };

  beforeEach(() => {
    // Create mock repository
    mockUserPreferenceRepo = {
      selectAll: jest.fn(),
      selectById: jest.fn(),
      selectByUserId: jest.fn(),
      selectByTheme: jest.fn(),
      selectByLanguage: jest.fn(),
      selectByTimezone: jest.fn(),
      selectWithPagination: jest.fn(),
      count: jest.fn(),
      existsByUserId: jest.fn(),
      search: jest.fn()
    } as any;

    userPreferenceService = new UserPreferenceQueriesSvc(mockUserPreferenceRepo);
  });

  describe('getAllUserPreferences', () => {
    it('should return all user preferences with default limit', async () => {
      // Arrange
      const mockPreferences = [mockUserPreference];
      mockUserPreferenceRepo.selectAll.mockResolvedValue(mockPreferences);

      // Act
      const result = await userPreferenceService.getAllUserPreferences();

      // Assert
      expect(mockUserPreferenceRepo.selectAll).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockPreferences);
    });

    it('should return all user preferences with custom limit', async () => {
      // Arrange
      const customLimit = 50;
      const mockPreferences = [mockUserPreference];
      mockUserPreferenceRepo.selectAll.mockResolvedValue(mockPreferences);

      // Act
      const result = await userPreferenceService.getAllUserPreferences(customLimit);

      // Assert
      expect(mockUserPreferenceRepo.selectAll).toHaveBeenCalledWith(customLimit);
      expect(result).toEqual(mockPreferences);
    });

    it('should handle empty results', async () => {
      // Arrange
      mockUserPreferenceRepo.selectAll.mockResolvedValue([]);

      // Act
      const result = await userPreferenceService.getAllUserPreferences();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserPreferenceRepo.selectAll.mockRejectedValue(error);

      // Act & Assert
      await expect(userPreferenceService.getAllUserPreferences())
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('getUserPreferenceById', () => {
    it('should return user preference by ID', async () => {
      // Arrange
      const id = 1;
      mockUserPreferenceRepo.selectById.mockResolvedValue(mockUserPreference);

      // Act
      const result = await userPreferenceService.getUserPreferenceById(id);

      // Assert
      expect(mockUserPreferenceRepo.selectById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUserPreference);
    });

    it('should return null for non-existent ID', async () => {
      // Arrange
      const id = 99999;
      mockUserPreferenceRepo.selectById.mockResolvedValue(null);

      // Act
      const result = await userPreferenceService.getUserPreferenceById(id);

      // Assert
      expect(mockUserPreferenceRepo.selectById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });

    it('should throw error for invalid ID', async () => {
      // Arrange
      const id = -1;
      const error = new Error('Invalid ID');
      mockUserPreferenceRepo.selectById.mockRejectedValue(error);

      // Act & Assert
      await expect(userPreferenceService.getUserPreferenceById(id))
        .rejects.toThrow('Invalid ID');
    });
  });

  describe('getUserPreferenceByUserId', () => {
    it('should return user preference by user ID', async () => {
      // Arrange
      const userId = 123;
      mockUserPreferenceRepo.selectByUserId.mockResolvedValue(mockUserPreference);

      // Act
      const result = await userPreferenceService.getUserPreferenceByUserId(userId);

      // Assert
      expect(mockUserPreferenceRepo.selectByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserPreference);
    });

    it('should return null for non-existent user ID', async () => {
      // Arrange
      const userId = 99999;
      mockUserPreferenceRepo.selectByUserId.mockResolvedValue(null);

      // Act
      const result = await userPreferenceService.getUserPreferenceByUserId(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle multiple calls with different user IDs', async () => {
      // Arrange
      const userIds = [1, 2, 3];
      const mockPreferences = userIds.map(id => ({ ...mockUserPreference, userId: id }));

      userIds.forEach((userId, index) => {
        mockUserPreferenceRepo.selectByUserId
          .mockResolvedValueOnce(mockPreferences[index]);
      });

      // Act & Assert
      for (let i = 0; i < userIds.length; i++) {
        const result = await userPreferenceService.getUserPreferenceByUserId(userIds[i]);
        expect(result?.userId).toBe(userIds[i]);
      }
    });
  });

  describe('getUserPreferencesByTheme', () => {
    it('should return preferences by theme with pagination', async () => {
      // Arrange
      const theme = 'dark';
      const pagination: PaginationParams = { page: 1, limit: 10 };
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [mockUserPreference],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockUserPreferenceRepo.selectByTheme.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.getUserPreferencesByTheme(theme, pagination);

      // Assert
      expect(mockUserPreferenceRepo.selectByTheme).toHaveBeenCalledWith(theme, pagination);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      const theme = 'light';
      const defaultPagination = { page: 1, limit: 10 };
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      mockUserPreferenceRepo.selectByTheme.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.getUserPreferencesByTheme(theme);

      // Assert
      expect(mockUserPreferenceRepo.selectByTheme).toHaveBeenCalledWith(theme, defaultPagination);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle different theme values', async () => {
      // Arrange
      const themes = ['light', 'dark', 'auto'];
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [mockUserPreference],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockUserPreferenceRepo.selectByTheme.mockResolvedValue(mockPaginatedResult);

      // Act & Assert
      for (const theme of themes) {
        const result = await userPreferenceService.getUserPreferencesByTheme(theme);
        expect(mockUserPreferenceRepo.selectByTheme).toHaveBeenCalledWith(theme, { page: 1, limit: 10 });
        expect(result).toEqual(mockPaginatedResult);
      }
    });
  });

  describe('getUserPreferencesWithPagination', () => {
    it('should return paginated user preferences', async () => {
      // Arrange
      const pagination: PaginationParams = { page: 2, limit: 5 };
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [mockUserPreference],
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2
      };

      mockUserPreferenceRepo.selectWithPagination.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.getUserPreferencesWithPagination(pagination);

      // Assert
      expect(mockUserPreferenceRepo.selectWithPagination).toHaveBeenCalledWith(pagination);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should use default pagination parameters', async () => {
      // Arrange
      const defaultPagination = { page: 1, limit: 10 };
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      mockUserPreferenceRepo.selectWithPagination.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.getUserPreferencesWithPagination();

      // Assert
      expect(mockUserPreferenceRepo.selectWithPagination).toHaveBeenCalledWith(defaultPagination);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle edge case pagination values', async () => {
      // Arrange
      const edgeCasePaginations = [
        { page: 1, limit: 1 },      // Minimum page size
        { page: 100, limit: 100 },  // Large values
        { page: 0, limit: 0 }       // Invalid values (should be handled by repo)
      ];

      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [],
        total: 0,
        page: 1,
        limit: 1,
        totalPages: 0
      };

      mockUserPreferenceRepo.selectWithPagination.mockResolvedValue(mockPaginatedResult);

      // Act & Assert
      for (const pagination of edgeCasePaginations) {
        const result = await userPreferenceService.getUserPreferencesWithPagination(pagination);
        expect(mockUserPreferenceRepo.selectWithPagination).toHaveBeenCalledWith(pagination);
        expect(result).toEqual(mockPaginatedResult);
      }
    });
  });

  describe('searchUserPreferences', () => {
    it('should search preferences with single criteria', async () => {
      // Arrange
      const searchCriteria: UserPreferenceSearchCriteria = { theme: 'dark' };
      const pagination: PaginationParams = { page: 1, limit: 10 };
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [mockUserPreference],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockUserPreferenceRepo.search.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.searchUserPreferences(searchCriteria, pagination);

      // Assert
      expect(mockUserPreferenceRepo.search).toHaveBeenCalledWith(searchCriteria, pagination);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should search preferences with multiple criteria', async () => {
      // Arrange
      const searchCriteria: UserPreferenceSearchCriteria = {
        theme: 'dark',
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        autoSave: true
      };

      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [mockUserPreference],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockUserPreferenceRepo.search.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.searchUserPreferences(searchCriteria);

      // Assert
      expect(mockUserPreferenceRepo.search).toHaveBeenCalledWith(searchCriteria, { page: 1, limit: 10 });
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle empty search criteria', async () => {
      // Arrange
      const searchCriteria: UserPreferenceSearchCriteria = {};
      const mockPaginatedResult: PaginatedData<UserPreferenceAttributes> = {
        items: [mockUserPreference],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockUserPreferenceRepo.search.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await userPreferenceService.searchUserPreferences(searchCriteria);

      // Assert
      expect(mockUserPreferenceRepo.search).toHaveBeenCalledWith(searchCriteria, { page: 1, limit: 10 });
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle search with no results', async () => {
      // Arrange
      const searchCriteria: UserPreferenceSearchCriteria = { theme: 'non-existent' };
      const mockEmptyResult: PaginatedData<UserPreferenceAttributes> = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      mockUserPreferenceRepo.search.mockResolvedValue(mockEmptyResult);

      // Act
      const result = await userPreferenceService.searchUserPreferences(searchCriteria);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('checkUserPreferenceExists', () => {
    it('should return true when user preference exists', async () => {
      // Arrange
      const userId = 123;
      mockUserPreferenceRepo.existsByUserId.mockResolvedValue(true);

      // Act
      const result = await userPreferenceService.checkUserPreferenceExists(userId);

      // Assert
      expect(mockUserPreferenceRepo.existsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it('should return false when user preference does not exist', async () => {
      // Arrange
      const userId = 99999;
      mockUserPreferenceRepo.existsByUserId.mockResolvedValue(false);

      // Act
      const result = await userPreferenceService.checkUserPreferenceExists(userId);

      // Assert
      expect(mockUserPreferenceRepo.existsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });

    it('should handle multiple user ID checks', async () => {
      // Arrange
      const userIds = [1, 2, 3, 4];
      const existsResults = [true, false, true, false];

      userIds.forEach((userId, index) => {
        mockUserPreferenceRepo.existsByUserId
          .mockResolvedValueOnce(existsResults[index]);
      });

      // Act & Assert
      for (let i = 0; i < userIds.length; i++) {
        const result = await userPreferenceService.checkUserPreferenceExists(userIds[i]);
        expect(result).toBe(existsResults[i]);
      }
    });
  });

  describe('getUserPreferenceStatistics', () => {
    it('should calculate statistics from user preferences', async () => {
      // Arrange
      const mockPreferences: UserPreferenceAttributes[] = [
        { id: 1, userId: 1, theme: 'dark', language: 'zh-TW', timezone: 'Asia/Taipei', autoSave: true, notifications: true },
        { id: 2, userId: 2, theme: 'light', language: 'en-US', timezone: 'America/New_York', autoSave: false, notifications: true },
        { id: 3, userId: 3, theme: 'dark', language: 'zh-TW', timezone: 'Asia/Taipei', autoSave: true, notifications: false }
      ];

      mockUserPreferenceRepo.selectAll.mockResolvedValue(mockPreferences);

      // Act
      const result = await userPreferenceService.getUserPreferenceStatistics();

      // Assert
      expect(result.totalUsers).toBe(3);
      expect(result.themeStats).toEqual({ 'dark': 2, 'light': 1 });
      expect(result.languageStats).toEqual({ 'zh-TW': 2, 'en-US': 1 });
      expect(result.timezoneStats).toEqual({ 'Asia/Taipei': 2, 'America/New_York': 1 });
      expect(result.featureUsage.autoSaveEnabled).toBe(2);
      expect(result.featureUsage.notificationsEnabled).toBe(2);
    });

    it('should handle empty preferences list', async () => {
      // Arrange
      mockUserPreferenceRepo.selectAll.mockResolvedValue([]);

      // Act
      const result = await userPreferenceService.getUserPreferenceStatistics();

      // Assert
      expect(result.totalUsers).toBe(0);
      expect(result.themeStats).toEqual({});
      expect(result.languageStats).toEqual({});
      expect(result.timezoneStats).toEqual({});
      expect(result.featureUsage.autoSaveEnabled).toBe(0);
      expect(result.featureUsage.notificationsEnabled).toBe(0);
    });

    it('should handle single preference', async () => {
      // Arrange
      mockUserPreferenceRepo.selectAll.mockResolvedValue([mockUserPreference]);

      // Act
      const result = await userPreferenceService.getUserPreferenceStatistics();

      // Assert
      expect(result.totalUsers).toBe(1);
      expect(result.themeStats).toEqual({ 'dark': 1 });
      expect(result.languageStats).toEqual({ 'zh-TW': 1 });
      expect(result.timezoneStats).toEqual({ 'Asia/Taipei': 1 });
      expect(result.featureUsage.autoSaveEnabled).toBe(1);
      expect(result.featureUsage.notificationsEnabled).toBe(1);
    });
  });

  describe('getUserPreferenceCount', () => {
    it('should return correct count', async () => {
      // Arrange
      const expectedCount = 42;
      mockUserPreferenceRepo.count.mockResolvedValue(expectedCount);

      // Act
      const result = await userPreferenceService.getUserPreferenceCount();

      // Assert
      expect(mockUserPreferenceRepo.count).toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it('should return zero for empty database', async () => {
      // Arrange
      mockUserPreferenceRepo.count.mockResolvedValue(0);

      // Act
      const result = await userPreferenceService.getUserPreferenceCount();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getUserPreferenceOrDefault', () => {
    it('should return user preference when it exists', async () => {
      // Arrange
      const userId = 123;
      mockUserPreferenceRepo.selectByUserId.mockResolvedValue(mockUserPreference);

      // Act
      const result = await userPreferenceService.getUserPreferenceOrDefault(userId);

      // Assert
      expect(mockUserPreferenceRepo.selectByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserPreference);
    });

    it('should return default preference when user preference does not exist', async () => {
      // Arrange
      const userId = 456;
      mockUserPreferenceRepo.selectByUserId.mockResolvedValue(null);

      // Act
      const result = await userPreferenceService.getUserPreferenceOrDefault(userId);

      // Assert
      expect(mockUserPreferenceRepo.selectByUserId).toHaveBeenCalledWith(userId);
      expect(result.id).toBe(0); // Temporary ID for default
      expect(result.userId).toBe(userId);
      expect(result.theme).toBe('auto');
      expect(result.language).toBe('zh-TW');
      expect(result.timezone).toBe('Asia/Taipei');
      expect(result.autoSave).toBe(true);
      expect(result.notifications).toBe(true);
    });

    it('should return different default preferences for different users', async () => {
      // Arrange
      const userIds = [111, 222, 333];
      mockUserPreferenceRepo.selectByUserId.mockResolvedValue(null);

      // Act & Assert
      for (const userId of userIds) {
        const result = await userPreferenceService.getUserPreferenceOrDefault(userId);
        expect(result.userId).toBe(userId);
        expect(result.id).toBe(0); // Always temporary ID for defaults
      }
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = 789;
      const error = new Error('Database error');
      mockUserPreferenceRepo.selectByUserId.mockRejectedValue(error);

      // Act & Assert
      await expect(userPreferenceService.getUserPreferenceOrDefault(userId))
        .rejects.toThrow('Database error');
    });
  });

  describe('Error Handling', () => {
    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Repository connection failed');
      mockUserPreferenceRepo.selectAll.mockRejectedValue(error);

      // Act & Assert
      await expect(userPreferenceService.getAllUserPreferences())
        .rejects.toThrow('Repository connection failed');
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockUserPreferenceRepo.count.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(userPreferenceService.getUserPreferenceCount())
        .rejects.toThrow('Request timeout');
    });

    it('should handle validation errors from repository', async () => {
      // Arrange
      const validationError = new Error('Invalid data format');
      validationError.name = 'ValidationError';
      mockUserPreferenceRepo.selectById.mockRejectedValue(validationError);

      // Act & Assert
      await expect(userPreferenceService.getUserPreferenceById(1))
        .rejects.toThrow('Invalid data format');
    });
  });

  describe('Input Validation', () => {
    it('should handle edge case user IDs', async () => {
      // Arrange
      const edgeCaseIds = [0, -1, Number.MAX_SAFE_INTEGER];
      mockUserPreferenceRepo.selectByUserId.mockResolvedValue(null);

      // Act & Assert
      for (const userId of edgeCaseIds) {
        // Should not throw error, repository should handle validation
        await expect(async () => {
          await userPreferenceService.getUserPreferenceByUserId(userId);
        }).not.toThrow();
      }
    });

    it('should handle special characters in search criteria', async () => {
      // Arrange
      const searchCriteria: UserPreferenceSearchCriteria = {
        theme: 'special-theme_123',
        language: 'en-US@variant',
        timezone: 'UTC+08:00'
      };

      const mockResult: PaginatedData<UserPreferenceAttributes> = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };

      mockUserPreferenceRepo.search.mockResolvedValue(mockResult);

      // Act & Assert
      await expect(async () => {
        await userPreferenceService.searchUserPreferences(searchCriteria);
      }).not.toThrow();

      expect(mockUserPreferenceRepo.search).toHaveBeenCalledWith(searchCriteria, { page: 1, limit: 10 });
    });
  });
});