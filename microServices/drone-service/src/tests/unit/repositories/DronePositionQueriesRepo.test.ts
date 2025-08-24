/**
 * @fileoverview Unit tests for DronePositionQueriesRepo
 */

import { DronePositionQueriesRepo, PaginatedResult } from '../../../repo/queries/DronePositionQueriesRepo';
import { DronePositionModel } from '../../../models/DronePositionModel';
import { testHelpers, setupTestDb, cleanupTestDb } from '../../setup';
import { Sequelize } from 'sequelize';
import { PaginationRequestDto } from '../../../dto';

describe('DronePositionQueriesRepo - Unit Tests', () => {
  let sequelize: Sequelize;
  let dronePositionRepo: DronePositionQueriesRepo;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    dronePositionRepo = new DronePositionQueriesRepo();
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('findPaginated', () => {
    it('should return paginated drone position data', async () => {
      // Arrange
      const droneId = 'test-drone-001';
      await testHelpers.createMultiplePositions(sequelize, droneId, 7);
      
      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 5,
        sortBy: 'recordedAt',
        sortOrder: 'DESC'
      };

      // Act
      const result: PaginatedResult<DronePositionModel> = await dronePositionRepo.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(5);
      expect(result.totalCount).toBe(7);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(5);
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10
      };

      // Act
      const result = await dronePositionRepo.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should apply search filters correctly', async () => {
      // Arrange
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'searchable-drone',
        altitude: 150.5
      });
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'other-drone',
        altitude: 100.0
      });

      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10,
        search: '150'
      };

      // Act
      const result = await dronePositionRepo.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].altitude).toBe(150.5);
    });

    it('should apply additional filters', async () => {
      // Arrange
      const droneId1 = 'drone-001';
      const droneId2 = 'drone-002';
      
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: droneId1
      });
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: droneId2
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
      const filters = { droneId: droneId1 };

      // Act
      const result = await dronePositionRepo.findPaginated(pagination, filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].droneId).toBe(droneId1);
    });

    it('should sort results correctly', async () => {
      // Arrange
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000); // 1 minute ago
      const latest = new Date(now.getTime() + 60000);  // 1 minute later

      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'drone-middle',
        recordedAt: now
      });
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'drone-earliest',
        recordedAt: earlier
      });
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'drone-latest',
        recordedAt: latest
      });

      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10,
        sortBy: 'recordedAt',
        sortOrder: 'ASC'
      };

      // Act
      const result = await dronePositionRepo.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data[0].droneId).toBe('drone-earliest');
      expect(result.data[1].droneId).toBe('drone-middle');
      expect(result.data[2].droneId).toBe('drone-latest');
    });
  });

  describe('findByDroneIdPaginated', () => {
    it('should return positions for specific drone ID', async () => {
      // Arrange
      const droneId1 = 'drone-001';
      const droneId2 = 'drone-002';
      
      await testHelpers.createMultiplePositions(sequelize, droneId1, 3);
      await testHelpers.createMultiplePositions(sequelize, droneId2, 2);

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findByDroneIdPaginated(droneId1, pagination);

      // Assert
      expect(result.data).toHaveLength(3);
      result.data.forEach(position => {
        expect(position.droneId).toBe(droneId1);
      });
    });

    it('should return empty result for non-existent drone', async () => {
      // Arrange
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findByDroneIdPaginated('non-existent-drone', pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('findByIdPaginated', () => {
    it('should return position for specific ID', async () => {
      // Arrange
      const position = await testHelpers.createTestPosition(sequelize);
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'other-drone'
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findByIdPaginated(position.id, pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(position.id);
    });
  });

  describe('findByTimeRangePaginated', () => {
    it('should return positions within time range', async () => {
      // Arrange
      const now = new Date();
      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const endTime = new Date(now.getTime() + 1 * 60 * 60 * 1000);   // 1 hour later
      const outsideTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago

      // Position within range
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'drone-in-range',
        recordedAt: now
      });

      // Position outside range
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'drone-outside-range',
        recordedAt: outsideTime
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findByTimeRangePaginated(startTime, endTime, pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].droneId).toBe('drone-in-range');
    });

    it('should handle empty time range results', async () => {
      // Arrange
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const futureEnd = new Date(Date.now() + 25 * 60 * 60 * 1000);   // 25 hours from now
      
      await testHelpers.createTestPosition(sequelize); // Current time

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findByTimeRangePaginated(futureStart, futureEnd, pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle overlapping time ranges correctly', async () => {
      // Arrange
      const baseTime = new Date();
      const times = [
        new Date(baseTime.getTime() - 60000), // 1 min ago
        new Date(baseTime.getTime()),          // now
        new Date(baseTime.getTime() + 60000),  // 1 min later
        new Date(baseTime.getTime() + 120000), // 2 min later
        new Date(baseTime.getTime() + 180000)  // 3 min later
      ];

      for (let i = 0; i < times.length; i++) {
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId: `drone-${i}`,
          recordedAt: times[i]
        });
      }

      // Query for middle 3 positions
      const startTime = new Date(baseTime.getTime() - 30000);  // 30 sec ago
      const endTime = new Date(baseTime.getTime() + 150000);   // 2.5 min later

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findByTimeRangePaginated(startTime, endTime, pagination);

      // Assert
      expect(result.data).toHaveLength(3);
    });
  });

  describe('Geographical Data Handling', () => {
    it('should handle precise coordinate data', async () => {
      // Arrange
      const preciseCoordinates = {
        latitude: 25.033964821,
        longitude: 121.565437892,
        altitude: 123.456
      };

      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        ...preciseCoordinates
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].latitude).toBeCloseTo(preciseCoordinates.latitude, 9);
      expect(result.data[0].longitude).toBeCloseTo(preciseCoordinates.longitude, 9);
      expect(result.data[0].altitude).toBeCloseTo(preciseCoordinates.altitude, 3);
    });

    it('should handle edge case coordinates', async () => {
      // Arrange - Test extreme coordinates
      const extremeCoordinates = [
        { latitude: 90, longitude: 180, altitude: 8848 },    // Mount Everest height
        { latitude: -90, longitude: -180, altitude: -11034 }, // Mariana Trench depth
        { latitude: 0, longitude: 0, altitude: 0 }           // Origin point
      ];

      for (let i = 0; i < extremeCoordinates.length; i++) {
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId: `extreme-drone-${i}`,
          ...extremeCoordinates[i]
        });
      }

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await dronePositionRepo.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.totalCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid pagination parameters gracefully', async () => {
      // Arrange
      const invalidPagination: PaginationRequestDto = {
        page: -1,
        pageSize: 0
      };

      // Act & Assert - Should not throw error
      await expect(async () => {
        await dronePositionRepo.findPaginated(invalidPagination);
      }).not.toThrow();
    });

    it('should handle invalid time range gracefully', async () => {
      // Arrange
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() + 60000); // Start after end
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act & Assert - Should not throw error
      await expect(async () => {
        await dronePositionRepo.findByTimeRangePaginated(startTime, endTime, pagination);
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should efficiently handle large position datasets', async () => {
      // Arrange
      const droneId = 'performance-test-drone';
      await testHelpers.createMultiplePositions(sequelize, droneId, 200);
      
      const pagination: PaginationRequestDto = {
        page: 10,
        pageSize: 20,
        sortBy: 'recordedAt',
        sortOrder: 'DESC'
      };

      const startTime = Date.now();

      // Act
      const result = await dronePositionRepo.findByDroneIdPaginated(droneId, pagination);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(result.data).toHaveLength(20);
      expect(result.totalCount).toBe(200);
      expect(result.currentPage).toBe(10);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});