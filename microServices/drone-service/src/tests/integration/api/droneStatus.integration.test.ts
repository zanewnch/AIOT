/**
 * @fileoverview Integration tests for Drone Status API
 */

import request from 'supertest';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { setupTestDb, cleanupTestDb, testHelpers } from '../../setup';
import { DroneStatus } from '../../../models/DroneStatusModel';

describe('Drone Status API - Integration Tests', () => {
  let app: Application;
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    app = testHelpers.createTestApp();
    
    // Setup drone status routes - mock implementation
    app.get('/api/drone-status', async (req, res) => {
      try {
        const { page = 1, pageSize = 20, status, droneId } = req.query;
        
        let whereClause: any = {};
        if (status) whereClause.status = status;
        if (droneId) whereClause.droneId = droneId;

        const offset = (Number(page) - 1) * Number(pageSize);
        
        const { count: totalCount, rows: data } = await sequelize.models.DroneStatus.findAndCountAll({
          where: whereClause,
          limit: Number(pageSize),
          offset: offset,
          order: [['lastHeartbeat', 'DESC']]
        });

        res.json({
          success: true,
          data: data,
          pagination: {
            currentPage: Number(page),
            pageSize: Number(pageSize),
            totalCount,
            totalPages: Math.ceil(totalCount / Number(pageSize))
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-status/:id', async (req, res) => {
      try {
        const droneStatus = await sequelize.models.DroneStatus.findByPk(req.params.id);
        
        if (!droneStatus) {
          return res.status(404).json({
            success: false,
            message: 'Drone status not found'
          });
        }

        res.json({
          success: true,
          data: droneStatus
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-status/serial/:serial', async (req, res) => {
      try {
        const droneStatus = await sequelize.models.DroneStatus.findOne({
          where: { serial: req.params.serial }
        });
        
        if (!droneStatus) {
          return res.status(404).json({
            success: false,
            message: 'Drone status not found'
          });
        }

        res.json({
          success: true,
          data: droneStatus
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-status/drone/:droneId', async (req, res) => {
      try {
        const { page = 1, pageSize = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        
        const { count: totalCount, rows: data } = await sequelize.models.DroneStatus.findAndCountAll({
          where: { droneId: req.params.droneId },
          limit: Number(pageSize),
          offset: offset,
          order: [['lastHeartbeat', 'DESC']]
        });

        res.json({
          success: true,
          data: data,
          pagination: {
            currentPage: Number(page),
            pageSize: Number(pageSize),
            totalCount,
            totalPages: Math.ceil(totalCount / Number(pageSize))
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-status/by-status/:status', async (req, res) => {
      try {
        const droneStatuses = await sequelize.models.DroneStatus.findAll({
          where: { status: req.params.status },
          order: [['lastHeartbeat', 'DESC']]
        });

        res.json({
          success: true,
          data: droneStatuses
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

  describe('GET /api/drone-status', () => {
    it('should return paginated drone statuses', async () => {
      // Arrange
      await testHelpers.createMultipleDroneStatuses(sequelize, 5);

      // Act
      const response = await request(app)
        .get('/api/drone-status?page=1&pageSize=3')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.totalCount).toBe(5);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.pageSize).toBe(3);
    });

    it('should filter by status', async () => {
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

      // Act
      const response = await request(app)
        .get(`/api/drone-status?status=${DroneStatus.ACTIVE}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(DroneStatus.ACTIVE);
    });

    it('should filter by drone ID', async () => {
      // Arrange
      const droneId = 'test-drone-filter';
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: droneId
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'other-drone'
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-status?droneId=${droneId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].droneId).toBe(droneId);
    });

    it('should return empty results when no data matches', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-status')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalCount).toBe(0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      // Arrange
      await testHelpers.createTestDroneStatus(sequelize);

      // Act
      const response = await request(app)
        .get('/api/drone-status?page=0&pageSize=-1')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      // Should still return data despite invalid params
    });
  });

  describe('GET /api/drone-status/:id', () => {
    it('should return drone status by ID', async () => {
      // Arrange
      const droneStatus = await testHelpers.createTestDroneStatus(sequelize);

      // Act
      const response = await request(app)
        .get(`/api/drone-status/${droneStatus.id}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(droneStatus.id);
      expect(response.body.data.droneId).toBe(droneStatus.droneId);
    });

    it('should return 404 for non-existent drone status', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-status/99999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Drone status not found');
    });

    it('should handle invalid ID format', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-status/invalid-id')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/drone-status/serial/:serial', () => {
    it('should return drone status by serial number', async () => {
      // Arrange
      const serial = 'TEST-SERIAL-123';
      const droneStatus = await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        serial: serial
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-status/serial/${serial}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.serial).toBe(serial);
      expect(response.body.data.droneId).toBe(droneStatus.droneId);
    });

    it('should return 404 for non-existent serial', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-status/serial/NON-EXISTENT-SERIAL')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Drone status not found');
    });
  });

  describe('GET /api/drone-status/drone/:droneId', () => {
    it('should return status history for specific drone', async () => {
      // Arrange
      const droneId = 'history-test-drone';
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: droneId,
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: droneId,
        status: DroneStatus.IDLE,
        lastHeartbeat: new Date(Date.now() - 60000) // 1 minute ago
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-status/drone/${droneId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(status => {
        expect(status.droneId).toBe(droneId);
      });
    });

    it('should return paginated results for drone history', async () => {
      // Arrange
      const droneId = 'paginated-history-drone';
      for (let i = 0; i < 5; i++) {
        await testHelpers.createTestDroneStatus(sequelize, {
          ...testHelpers.testDroneStatusData,
          droneId: droneId,
          lastHeartbeat: new Date(Date.now() - i * 60000)
        });
      }

      // Act
      const response = await request(app)
        .get(`/api/drone-status/drone/${droneId}?page=1&pageSize=3`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.totalCount).toBe(5);
    });

    it('should return empty results for non-existent drone', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-status/drone/NON-EXISTENT-DRONE')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalCount).toBe(0);
    });
  });

  describe('GET /api/drone-status/by-status/:status', () => {
    it('should return all drones with specific status', async () => {
      // Arrange
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'active-drone-1',
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'active-drone-2',
        status: DroneStatus.ACTIVE
      });
      await testHelpers.createTestDroneStatus(sequelize, {
        ...testHelpers.testDroneStatusData,
        droneId: 'maintenance-drone',
        status: DroneStatus.MAINTENANCE
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-status/by-status/${DroneStatus.ACTIVE}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(status => {
        expect(status.status).toBe(DroneStatus.ACTIVE);
      });
    });

    it('should return empty array for status with no drones', async () => {
      // Act
      const response = await request(app)
        .get(`/api/drone-status/by-status/${DroneStatus.EMERGENCY}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle all valid drone status types', async () => {
      // Arrange
      const statusTypes = [
        DroneStatus.ACTIVE,
        DroneStatus.IDLE,
        DroneStatus.MAINTENANCE,
        DroneStatus.EMERGENCY
      ];

      for (let i = 0; i < statusTypes.length; i++) {
        await testHelpers.createTestDroneStatus(sequelize, {
          ...testHelpers.testDroneStatusData,
          droneId: `drone-${i}`,
          status: statusTypes[i]
        });
      }

      // Act & Assert
      for (const status of statusTypes) {
        const response = await request(app)
          .get(`/api/drone-status/by-status/${status}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].status).toBe(status);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would typically involve mocking the database to fail
      // For now, we test with invalid database state simulation
      await sequelize.close(); // Close database connection

      const response = await request(app)
        .get('/api/drone-status')
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reopen connection for cleanup
      await setupTestDb();
    });

    it('should handle malformed requests', async () => {
      // Act - Test with extremely large page numbers
      const response = await request(app)
        .get('/api/drone-status?page=999999999&pageSize=999999999')
        .expect(200);

      // Assert - Should handle gracefully
      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange
      await testHelpers.createMultipleDroneStatuses(sequelize, 100);
      
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get('/api/drone-status?page=5&pageSize=20')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(20);
      expect(response.body.pagination.totalCount).toBe(100);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should respond within acceptable time limits for queries', async () => {
      // Arrange
      await testHelpers.createMultipleDroneStatuses(sequelize, 50);
      const startTime = Date.now();

      // Act
      await request(app)
        .get(`/api/drone-status/by-status/${DroneStatus.ACTIVE}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});