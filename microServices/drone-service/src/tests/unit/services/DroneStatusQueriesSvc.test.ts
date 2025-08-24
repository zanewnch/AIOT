/**
 * @fileoverview Unit tests for DroneStatusQueriesSvc
 */

import { DroneStatusQueriesSvc } from '../../../services/queries/DroneStatusQueriesSvc';
import { DroneStatusQueriesRepo } from '../../../repo/queries/DroneStatusQueriesRepo';
import { DroneStatusModel, DroneStatus } from '../../../models/DroneStatusModel';
import { PaginationRequestDto } from '../../../dto';
import { createMockRepository } from '../../setup';

// Mock the DtoMapper
jest.mock('../../../utils/dtoMapper', () => ({
  DtoMapper: {
    toPaginatedDroneStatusResponse: jest.fn((result) => ({
      data: result.data.map(item => ({ id: item.id, status: item.status })),
      pagination: {
        currentPage: result.currentPage,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / result.pageSize)
      }
    })),
    toDroneStatusResponseDto: jest.fn((item) => ({
      id: item.id,
      droneId: item.droneId,
      status: item.status,
      batteryLevel: item.batteryLevel
    }))
  }
}));

describe('DroneStatusQueriesSvc - Unit Tests', () => {
  let droneStatusService: DroneStatusQueriesSvc;
  let mockDroneStatusRepo: jest.Mocked<DroneStatusQueriesRepo>;

  beforeEach(() => {
    // Create mock repository
    mockDroneStatusRepo = {
      findPaginated: jest.fn(),
      findByStatusPaginated: jest.fn(),
      findByDroneIdPaginated: jest.fn(),
      findBySerial: jest.fn(),
      findById: jest.fn(),
      findAllByStatus: jest.fn()
    } as any;

    droneStatusService = new DroneStatusQueriesSvc(mockDroneStatusRepo);
  });

  describe('getAllStatusesPaginated', () => {
    it('should return paginated drone statuses', async () => {
      // Arrange
      const pagination: PaginationRequestDto = {
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      const mockData = [
        { id: 1, droneId: 'drone-001', status: DroneStatus.ACTIVE },
        { id: 2, droneId: 'drone-002', status: DroneStatus.MAINTENANCE }
      ];

      const mockResult = {
        data: mockData,
        totalCount: 2,
        currentPage: 1,
        pageSize: 10
      };

      mockDroneStatusRepo.findPaginated.mockResolvedValue(mockResult as any);

      // Act
      const result = await droneStatusService.getAllStatusesPaginated(pagination);

      // Assert
      expect(mockDroneStatusRepo.findPaginated).toHaveBeenCalledWith(pagination);
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalCount).toBe(2);
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
      const emptyResult = {
        data: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 10
      };

      mockDroneStatusRepo.findPaginated.mockResolvedValue(emptyResult as any);

      // Act
      const result = await droneStatusService.getAllStatusesPaginated(pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
      const error = new Error('Database connection failed');

      mockDroneStatusRepo.findPaginated.mockRejectedValue(error);

      // Act & Assert
      await expect(droneStatusService.getAllStatusesPaginated(pagination))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('getStatusesByStatusPaginated', () => {
    it('should return drones with specific status', async () => {
      // Arrange
      const status = DroneStatus.ACTIVE;
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      const mockData = [
        { id: 1, droneId: 'drone-001', status: DroneStatus.ACTIVE },
        { id: 2, droneId: 'drone-002', status: DroneStatus.ACTIVE }
      ];

      const mockResult = {
        data: mockData,
        totalCount: 2,
        currentPage: 1,
        pageSize: 10
      };

      mockDroneStatusRepo.findByStatusPaginated.mockResolvedValue(mockResult as any);

      // Act
      const result = await droneStatusService.getStatusesByStatusPaginated(status, pagination);

      // Assert
      expect(mockDroneStatusRepo.findByStatusPaginated).toHaveBeenCalledWith(status, pagination);
      expect(result.data).toHaveLength(2);
      result.data.forEach(item => {
        expect(item.status).toBe(DroneStatus.ACTIVE);
      });
    });

    it('should handle different drone statuses', async () => {
      // Arrange
      const testCases = [
        DroneStatus.ACTIVE,
        DroneStatus.MAINTENANCE,
        DroneStatus.EMERGENCY,
        DroneStatus.IDLE
      ];

      for (const status of testCases) {
        const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
        const mockResult = {
          data: [{ id: 1, droneId: 'test-drone', status }],
          totalCount: 1,
          currentPage: 1,
          pageSize: 10
        };

        mockDroneStatusRepo.findByStatusPaginated.mockResolvedValue(mockResult as any);

        // Act
        const result = await droneStatusService.getStatusesByStatusPaginated(status, pagination);

        // Assert
        expect(mockDroneStatusRepo.findByStatusPaginated).toHaveBeenCalledWith(status, pagination);
        expect(result.data[0].status).toBe(status);

        // Reset mock for next iteration
        mockDroneStatusRepo.findByStatusPaginated.mockClear();
      }
    });
  });

  describe('getStatusesByDroneIdPaginated', () => {
    it('should return status history for specific drone ID', async () => {
      // Arrange
      const droneId = 123;
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      const mockData = [
        { id: 1, droneId: droneId.toString(), status: DroneStatus.ACTIVE, timestamp: new Date() },
        { id: 2, droneId: droneId.toString(), status: DroneStatus.IDLE, timestamp: new Date() }
      ];

      const mockResult = {
        data: mockData,
        totalCount: 2,
        currentPage: 1,
        pageSize: 10
      };

      mockDroneStatusRepo.findByDroneIdPaginated.mockResolvedValue(mockResult as any);

      // Act
      const result = await droneStatusService.getStatusesByDroneIdPaginated(droneId, pagination);

      // Assert
      expect(mockDroneStatusRepo.findByDroneIdPaginated).toHaveBeenCalledWith(droneId, pagination);
      expect(result.data).toHaveLength(2);
    });

    it('should handle non-existent drone ID', async () => {
      // Arrange
      const nonExistentDroneId = 99999;
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };

      const emptyResult = {
        data: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 10
      };

      mockDroneStatusRepo.findByDroneIdPaginated.mockResolvedValue(emptyResult as any);

      // Act
      const result = await droneStatusService.getStatusesByDroneIdPaginated(nonExistentDroneId, pagination);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });
  });

  describe('isDroneSerialExists', () => {
    it('should return true for existing serial', async () => {
      // Arrange
      const serial = 'TEST-SERIAL-001';
      const mockDroneStatus = { id: 1, serial, droneId: 'drone-001' };

      mockDroneStatusRepo.findBySerial.mockResolvedValue(mockDroneStatus as any);

      // Act
      const result = await droneStatusService.isDroneSerialExists(serial);

      // Assert
      expect(mockDroneStatusRepo.findBySerial).toHaveBeenCalledWith(serial);
      expect(result).toBe(true);
    });

    it('should return false for non-existent serial', async () => {
      // Arrange
      const serial = 'NON-EXISTENT-SERIAL';

      mockDroneStatusRepo.findBySerial.mockResolvedValue(null);

      // Act
      const result = await droneStatusService.isDroneSerialExists(serial);

      // Assert
      expect(mockDroneStatusRepo.findBySerial).toHaveBeenCalledWith(serial);
      expect(result).toBe(false);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const serial = 'TEST-SERIAL';
      const error = new Error('Database error');

      mockDroneStatusRepo.findBySerial.mockRejectedValue(error);

      // Act & Assert
      await expect(droneStatusService.isDroneSerialExists(serial))
        .rejects.toThrow('Database error');
    });
  });

  describe('getDroneStatusById', () => {
    it('should return drone status by ID', async () => {
      // Arrange
      const id = 1;
      const mockDroneStatus = {
        id,
        droneId: 'drone-001',
        status: DroneStatus.ACTIVE,
        batteryLevel: 85
      };

      mockDroneStatusRepo.findById.mockResolvedValue(mockDroneStatus as any);

      // Act
      const result = await droneStatusService.getDroneStatusById(id);

      // Assert
      expect(mockDroneStatusRepo.findById).toHaveBeenCalledWith(id);
      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.droneId).toBe('drone-001');
    });

    it('should return null for non-existent ID', async () => {
      // Arrange
      const id = 99999;

      mockDroneStatusRepo.findById.mockResolvedValue(null);

      // Act
      const result = await droneStatusService.getDroneStatusById(id);

      // Assert
      expect(mockDroneStatusRepo.findById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });

  describe('getDronesByStatus', () => {
    it('should return all drones with specific status', async () => {
      // Arrange
      const status = DroneStatus.ACTIVE;
      const mockDrones = [
        { id: 1, droneId: 'drone-001', status: DroneStatus.ACTIVE },
        { id: 2, droneId: 'drone-002', status: DroneStatus.ACTIVE },
        { id: 3, droneId: 'drone-003', status: DroneStatus.ACTIVE }
      ];

      mockDroneStatusRepo.findAllByStatus.mockResolvedValue(mockDrones as any);

      // Act
      const result = await droneStatusService.getDronesByStatus(status);

      // Assert
      expect(mockDroneStatusRepo.findAllByStatus).toHaveBeenCalledWith(status);
      expect(result).toHaveLength(3);
      result.forEach(drone => {
        expect(drone.status).toBe(DroneStatus.ACTIVE);
      });
    });

    it('should return empty array for status with no drones', async () => {
      // Arrange
      const status = DroneStatus.EMERGENCY;

      mockDroneStatusRepo.findAllByStatus.mockResolvedValue([]);

      // Act
      const result = await droneStatusService.getDronesByStatus(status);

      // Assert
      expect(mockDroneStatusRepo.findAllByStatus).toHaveBeenCalledWith(status);
      expect(result).toEqual([]);
    });

    it('should handle all drone status types', async () => {
      // Arrange
      const statusTypes = [
        DroneStatus.ACTIVE,
        DroneStatus.IDLE,
        DroneStatus.MAINTENANCE,
        DroneStatus.EMERGENCY
      ];

      for (const status of statusTypes) {
        const mockDrones = [
          { id: 1, droneId: 'test-drone', status }
        ];

        mockDroneStatusRepo.findAllByStatus.mockResolvedValue(mockDrones as any);

        // Act
        const result = await droneStatusService.getDronesByStatus(status);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe(status);

        // Reset mock for next iteration
        mockDroneStatusRepo.findAllByStatus.mockClear();
      }
    });
  });

  describe('Error Handling', () => {
    it('should propagate repository errors', async () => {
      // Arrange
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
      const error = new Error('Repository error');

      mockDroneStatusRepo.findPaginated.mockRejectedValue(error);

      // Act & Assert
      await expect(droneStatusService.getAllStatusesPaginated(pagination))
        .rejects.toThrow('Repository error');
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const pagination: PaginationRequestDto = { page: 1, pageSize: 10 };
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockDroneStatusRepo.findPaginated.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(droneStatusService.getAllStatusesPaginated(pagination))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('Input Validation', () => {
    it('should handle edge case pagination values', async () => {
      // Arrange
      const edgeCasePaginations = [
        { page: 0, pageSize: 1 },      // Minimum values
        { page: 1000, pageSize: 100 }, // Large values
        { page: 1, pageSize: 1 }       // Single item page
      ];

      for (const pagination of edgeCasePaginations) {
        const mockResult = {
          data: [],
          totalCount: 0,
          currentPage: pagination.page,
          pageSize: pagination.pageSize
        };

        mockDroneStatusRepo.findPaginated.mockResolvedValue(mockResult as any);

        // Act
        const result = await droneStatusService.getAllStatusesPaginated(pagination);

        // Assert
        expect(result.pagination.currentPage).toBe(pagination.page);
        expect(result.pagination.pageSize).toBe(pagination.pageSize);

        // Reset mock
        mockDroneStatusRepo.findPaginated.mockClear();
      }
    });
  });
});