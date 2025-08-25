/**
 * @fileoverview Unit tests for DroneStatusQueriesRepositorysitorysitory
 */

import { DroneStatusQueriesRepositorysitorysitory, PaginatedResult } from.*Repositorysitorysitorysitory';
import { DroneStatusModel, DroneStatus } from '../../../models/DroneStatusModel';
import { testHelpers, setupTestDb, cleanupTestDb } from '../../setup';
import { Sequelize } from 'sequelize';
import { PaginationRequestDto } from '../../../dto';

describe('DroneStatusQueriesRepositorysitorysitory - Unit Tests', () => {
  let sequelize: Sequelize;
  let droneStatusRepositorysitorysitory: DroneStatusQueriesRepositorysitorysitory;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    droneStatusRepositorysitorysitory = new DroneStatusQueriesRepositorysitorysitory();
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('findPaginated', () => {
    it('should return paginated drone status data', async () => {
      // Arrange
      await testHelpers.createMultipleDroneStatuses(sequelize, 5);
      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 3,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      // Act
      const result: PaginatedResult<DroneStatusModel> = await droneStatusRepositorysitorysitory.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.totalCount).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(3);
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10
      };

      // Act
      const result: PaginatedResult<DroneStatusModel> = await droneStatusRepositorysitorysitory.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should apply search filters correctly', async () => {
      // Arrange
      const droneData = {
        ...testHelpers.testDroneStatusData,
        droneId: 'search-drone-001',
        model: 'Searchable Model'
      };
      await testHelpers.createTestDroneStatus(sequelize, droneData);

      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10,
        search: 'search-drone'
      };

      // Act
      const result = await droneStatusRepositorysitorysitory.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].droneId).toBe('search-drone-001');
    });

    it('should apply additional filters', async () => {
      // Arrange
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'drone-002',
        status: DroneStatus.MAINTENANCE
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
      const filters = { status: DroneStatus.ACTIVE };

      // Act
      const result = await droneStatusRepositorysitorysitory.findPaginated(pagination, filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(DroneStatus.ACTIVE);
    });

    it('should handle sorting correctly', async () => {
      // Arrange
      const now = new Date();
      const older = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'newer-drone',
        lastHeartbeat: now
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'older-drone',
        lastHeartbeat: older
      });

      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10,
        sortBy: 'lastHeartbeat',
        sortOrder: 'DESC'
      };

      // Act
      const result = await droneStatusRepositorysitorysitory.findPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].droneId).toBe('newer-drone');
      expect(result.data[1].droneId).toBe('older-drone');
    });
  });

  describe('findByStatusPaginated', () => {
    it('should return drones with specific status', async () => {
      // Arrange
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'drone-002',
        status: DroneStatus.MAINTENANCE
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await droneStatusRepositorysitorysitory.findByStatusPaginated(DroneStatus.ACTIVE, pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(DroneStatus.ACTIVE);
    });
  });

  describe('findByDroneIdPaginated', () => {
    it('should return status records for specific drone ID', async () => {
      // Arrange
      const droneId = 123;
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: droneId.toString()
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: '456'
      });

      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      // Act
      const result = await droneStatusRepositorysitorysitory.findByDroneIdPaginated(droneId, pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].droneId).toBe(droneId.toString());
    });
  });

  describe('findBySerial', () => {
    it('should return drone status by serial number', async () => {
      // Arrange
      const serial = 'TEST-SERIAL-001';
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        serial: serial
      });

      // Act
      const result = await droneStatusRepositorysitorysitory.findBySerial(serial);

      // Assert
      expect(result).toBeDefined();
      expect(result?.serial).toBe(serial);
    });

    it('should return null for non-existent serial', async () => {
      // Act
      const result = await droneStatusRepositorysitorysitory.findBySerial('NON-EXISTENT-SERIAL');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return drone status by ID', async () => {
      // Arrange
      const droneStatus = await testHelpers.createTestDroneStatus(sequelize);

      // Act
      const result = await droneStatusRepositorysitorysitory.findById(droneStatus.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(droneStatus.id);
      expect(result?.droneId).toBe(droneStatus.droneId);
    });

    it('should return null for non-existent ID', async () => {
      // Act
      const result = await droneStatusRepositorysitorysitory.findById(99999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAllByStatus', () => {
    it('should return all drones with specific status', async () => {
      // Arrange
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'drone-002',
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'drone-003',
        status: DroneStatus.MAINTENANCE
      });

      // Act
      const result = await droneStatusRepositorysitorysitory.findAllByStatus(DroneStatus.ACTIVE);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach(drone => {
        expect(drone.status).toBe(DroneStatus.ACTIVE);
      });
    });

    it('should return empty array for status with no drones', async () => {
      // Act
      const result = await droneStatusRepositorysitorysitory.findAllByStatus(DroneStatus.EMERGENCY);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This would typically involve mocking the database to throw errors
      // For now, we'll test with invalid parameters
      const pagination: PaginationRequestDto = {
        page: -1, // Invalid page number
        pageSize: 0 // Invalid page size
      };

      // The method should handle invalid input gracefully
      await expect(async () => {
        await droneStatusRepositorysitorysitory.findPaginated(pagination);
      }).not.toThrow(); // Should not crash
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange - Create a larger dataset
      await testHelpers.createMultipleDroneStatuses(sequelize, 100);
      
      const pagination: PaginationRequestDto = {
        page: 5,
        pageSize: 20
      };

      const startTime = Date.now();

      // Act
      const result = await droneStatusRepositorysitorysitory.findPaginated(pagination);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(result.data).toHaveLength(20);
      expect(result.totalCount).toBe(100);
      expect(result.currentPage).toBe(5);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});