/**
 * @fileoverview Integration tests for Drone Position API
 */

import request from 'supertest';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { setupTestDb, cleanupTestDb, testHelpers, geoHelpers } from '../../setup';

describe('Drone Position API - Integration Tests', () => {
  let app: Application;
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    app = testHelpers.createTestApp();
    
    // Setup drone position routes - mock implementation
    app.get('/api/drone-position', async (req, res) => {
      try {
        const { page = 1, pageSize = 20, droneId, startTime, endTime } = req.query;
        
        let whereClause: any = {};
        if (droneId) whereClause.droneId = droneId;
        if (startTime && endTime) {
          whereClause.recordedAt = {
            [sequelize.Sequelize.Op.between]: [new Date(startTime as string), new Date(endTime as string)]
          };
        }

        const offset = (Number(page) - 1) * Number(pageSize);
        
        const { count: totalCount, rows: data } = await sequelize.models.DronePosition.findAndCountAll({
          where: whereClause,
          limit: Number(pageSize),
          offset: offset,
          order: [['recordedAt', 'DESC']]
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

    app.get('/api/drone-position/:id', async (req, res) => {
      try {
        const position = await sequelize.models.DronePosition.findByPk(req.params.id);
        
        if (!position) {
          return res.status(404).json({
            success: false,
            message: 'Position not found'
          });
        }

        res.json({
          success: true,
          data: position
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-position/drone/:droneId', async (req, res) => {
      try {
        const { page = 1, pageSize = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(pageSize);
        
        const { count: totalCount, rows: data } = await sequelize.models.DronePosition.findAndCountAll({
          where: { droneId: req.params.droneId },
          limit: Number(pageSize),
          offset: offset,
          order: [['recordedAt', 'DESC']]
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

    app.get('/api/drone-position/drone/:droneId/latest', async (req, res) => {
      try {
        const latestPosition = await sequelize.models.DronePosition.findOne({
          where: { droneId: req.params.droneId },
          order: [['recordedAt', 'DESC']]
        });

        if (!latestPosition) {
          return res.status(404).json({
            success: false,
            message: 'No position data found for this drone'
          });
        }

        res.json({
          success: true,
          data: latestPosition
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-position/nearby', async (req, res) => {
      try {
        const { latitude, longitude, radius = 1000, page = 1, pageSize = 20 } = req.query;
        
        if (!latitude || !longitude) {
          return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
          });
        }

        const offset = (Number(page) - 1) * Number(pageSize);
        
        // Get all positions (in a real implementation, you'd use spatial queries)
        const allPositions = await sequelize.models.DronePosition.findAll({
          order: [['recordedAt', 'DESC']]
        });

        // Filter by distance
        const nearbyPositions = allPositions.filter(position => {
          const distance = geoHelpers.calculateDistance(
            Number(latitude),
            Number(longitude),
            position.latitude,
            position.longitude
          );
          return distance <= Number(radius);
        });

        // Apply pagination
        const paginatedPositions = nearbyPositions.slice(offset, offset + Number(pageSize));
        
        res.json({
          success: true,
          data: paginatedPositions,
          pagination: {
            currentPage: Number(page),
            pageSize: Number(pageSize),
            totalCount: nearbyPositions.length,
            totalPages: Math.ceil(nearbyPositions.length / Number(pageSize))
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/drone-position/track/:droneId', async (req, res) => {
      try {
        const { startTime, endTime, interval = 300000 } = req.query; // Default 5 min interval
        
        let whereClause: any = { droneId: req.params.droneId };
        if (startTime && endTime) {
          whereClause.recordedAt = {
            [sequelize.Sequelize.Op.between]: [new Date(startTime as string), new Date(endTime as string)]
          };
        }

        const positions = await sequelize.models.DronePosition.findAll({
          where: whereClause,
          order: [['recordedAt', 'ASC']]
        });

        // Filter positions by time interval to reduce data points
        const filteredPositions = [];
        let lastTime = 0;

        for (const position of positions) {
          const currentTime = new Date(position.recordedAt).getTime();
          if (currentTime - lastTime >= Number(interval) || filteredPositions.length === 0) {
            filteredPositions.push(position);
            lastTime = currentTime;
          }
        }

        res.json({
          success: true,
          data: {
            droneId: req.params.droneId,
            track: filteredPositions,
            totalPoints: filteredPositions.length,
            timeRange: {
              start: filteredPositions[0]?.recordedAt || null,
              end: filteredPositions[filteredPositions.length - 1]?.recordedAt || null
            }
          }
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

  describe('GET /api/drone-position', () => {
    it('should return paginated drone positions', async () => {
      // Arrange
      const droneId = 'test-drone-001';
      await testHelpers.createMultiplePositions(sequelize, droneId, 7);

      // Act
      const response = await request(app)
        .get('/api/drone-position?page=1&pageSize=5')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.totalCount).toBe(7);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.pageSize).toBe(5);
    });

    it('should filter positions by drone ID', async () => {
      // Arrange
      const droneId1 = 'filter-drone-1';
      const droneId2 = 'filter-drone-2';
      await testHelpers.createMultiplePositions(sequelize, droneId1, 3);
      await testHelpers.createMultiplePositions(sequelize, droneId2, 2);

      // Act
      const response = await request(app)
        .get(`/api/drone-position?droneId=${droneId1}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      response.body.data.forEach(position => {
        expect(position.droneId).toBe(droneId1);
      });
    });

    it('should filter positions by time range', async () => {
      // Arrange
      const droneId = 'time-range-drone';
      const now = new Date();
      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const endTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);   // 1 hour ago

      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId,
        recordedAt: new Date(now.getTime() - 90 * 60 * 1000) // 1.5 hours ago (within range)
      });

      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId,
        recordedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago (outside range)
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-position?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return empty results when no data matches', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-position')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalCount).toBe(0);
    });
  });

  describe('GET /api/drone-position/:id', () => {
    it('should return position by ID', async () => {
      // Arrange
      const position = await testHelpers.createTestPosition(sequelize);

      // Act
      const response = await request(app)
        .get(`/api/drone-position/${position.id}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(position.id);
      expect(response.body.data.latitude).toBe(position.latitude);
      expect(response.body.data.longitude).toBe(position.longitude);
    });

    it('should return 404 for non-existent position', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-position/99999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Position not found');
    });
  });

  describe('GET /api/drone-position/drone/:droneId', () => {
    it('should return positions for specific drone', async () => {
      // Arrange
      const droneId = 'specific-drone-test';
      await testHelpers.createMultiplePositions(sequelize, droneId, 5);

      // Act
      const response = await request(app)
        .get(`/api/drone-position/drone/${droneId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      response.body.data.forEach(position => {
        expect(position.droneId).toBe(droneId);
      });
    });

    it('should return paginated drone positions', async () => {
      // Arrange
      const droneId = 'paginated-drone';
      await testHelpers.createMultiplePositions(sequelize, droneId, 10);

      // Act
      const response = await request(app)
        .get(`/api/drone-position/drone/${droneId}?page=2&pageSize=4`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);
      expect(response.body.pagination.totalCount).toBe(10);
      expect(response.body.pagination.currentPage).toBe(2);
    });
  });

  describe('GET /api/drone-position/drone/:droneId/latest', () => {
    it('should return latest position for drone', async () => {
      // Arrange
      const droneId = 'latest-position-drone';
      const now = new Date();
      
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId,
        recordedAt: new Date(now.getTime() - 60000) // 1 minute ago
      });

      const latestPosition = await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId,
        latitude: 25.9999, // Different coordinates for latest
        longitude: 121.9999,
        recordedAt: now // Most recent
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-position/drone/${droneId}/latest`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(latestPosition.id);
      expect(response.body.data.latitude).toBe(25.9999);
      expect(response.body.data.longitude).toBe(121.9999);
    });

    it('should return 404 for drone with no positions', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-position/drone/NO-POSITIONS-DRONE/latest')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No position data found for this drone');
    });
  });

  describe('GET /api/drone-position/nearby', () => {
    it('should return positions within radius', async () => {
      // Arrange
      const centerLat = 25.0330;
      const centerLon = 121.5654;
      const radius = 1000; // 1km

      // Position within radius (very close)
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'nearby-drone',
        latitude: 25.0331,  // ~111m away
        longitude: 121.5655
      });

      // Position outside radius (far away)
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId: 'far-drone',
        latitude: 25.1000,  // ~7km away
        longitude: 121.6000
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-position/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=${radius}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].droneId).toBe('nearby-drone');
    });

    it('should require latitude and longitude parameters', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-position/nearby')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Latitude and longitude are required');
    });

    it('should handle pagination for nearby positions', async () => {
      // Arrange
      const centerLat = 25.0330;
      const centerLon = 121.5654;
      
      // Create multiple nearby positions
      for (let i = 0; i < 5; i++) {
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId: `nearby-drone-${i}`,
          latitude: centerLat + i * 0.001, // Small increments to stay nearby
          longitude: centerLon + i * 0.001
        });
      }

      // Act
      const response = await request(app)
        .get(`/api/drone-position/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=5000&page=1&pageSize=3`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.totalCount).toBe(5);
    });
  });

  describe('GET /api/drone-position/track/:droneId', () => {
    it('should return flight track for drone', async () => {
      // Arrange
      const droneId = 'track-test-drone';
      const now = new Date();
      
      // Create a track with multiple positions
      for (let i = 0; i < 5; i++) {
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId,
          latitude: 25.0330 + i * 0.001,
          longitude: 121.5654 + i * 0.001,
          recordedAt: new Date(now.getTime() - (4 - i) * 60000) // 4 minutes to present
        });
      }

      // Act
      const response = await request(app)
        .get(`/api/drone-position/track/${droneId}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.droneId).toBe(droneId);
      expect(response.body.data.track).toBeDefined();
      expect(response.body.data.totalPoints).toBeGreaterThan(0);
      expect(response.body.data.timeRange.start).toBeDefined();
      expect(response.body.data.timeRange.end).toBeDefined();
    });

    it('should filter track by time range', async () => {
      // Arrange
      const droneId = 'time-filtered-track';
      const now = new Date();
      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const endTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);   // 1 hour ago

      // Position within range
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId,
        recordedAt: new Date(now.getTime() - 90 * 60 * 1000) // 1.5 hours ago
      });

      // Position outside range
      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        droneId,
        recordedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      });

      // Act
      const response = await request(app)
        .get(`/api/drone-position/track/${droneId}?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.track).toHaveLength(1);
    });

    it('should apply time interval filtering', async () => {
      // Arrange
      const droneId = 'interval-test-drone';
      const now = new Date();
      const interval = 60000; // 1 minute

      // Create positions every 30 seconds for 3 minutes
      for (let i = 0; i < 6; i++) {
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId,
          recordedAt: new Date(now.getTime() - (5 - i) * 30000) // Every 30 seconds
        });
      }

      // Act
      const response = await request(app)
        .get(`/api/drone-position/track/${droneId}?interval=${interval}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      // Should filter to roughly every minute, so about 3-4 points instead of 6
      expect(response.body.data.totalPoints).toBeLessThan(6);
      expect(response.body.data.totalPoints).toBeGreaterThan(2);
    });
  });

  describe('Geographical Calculations', () => {
    it('should handle precise coordinate calculations', async () => {
      // Arrange
      const preciseCoords = {
        latitude: 25.033964821456789,
        longitude: 121.565437892345678,
        altitude: 123.456789
      };

      await testHelpers.createTestPosition(sequelize, {
        ...testHelpers.testPositionData,
        ...preciseCoords
      });

      // Act
      const response = await request(app)
        .get('/api/drone-position')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].latitude).toBeCloseTo(preciseCoords.latitude, 10);
      expect(response.body.data[0].longitude).toBeCloseTo(preciseCoords.longitude, 10);
      expect(response.body.data[0].altitude).toBeCloseTo(preciseCoords.altitude, 6);
    });

    it('should handle edge coordinate cases', async () => {
      // Arrange - Test extreme coordinates
      const extremeCoords = [
        { latitude: 90, longitude: 180 },     // North Pole
        { latitude: -90, longitude: -180 },   // South Pole
        { latitude: 0, longitude: 0 }         // Origin
      ];

      for (let i = 0; i < extremeCoords.length; i++) {
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId: `extreme-${i}`,
          ...extremeCoords[i]
        });
      }

      // Act
      const response = await request(app)
        .get('/api/drone-position')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large position datasets efficiently', async () => {
      // Arrange
      const droneId = 'performance-drone';
      await testHelpers.createMultiplePositions(sequelize, droneId, 200);
      
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get(`/api/drone-position/drone/${droneId}?page=10&pageSize=20`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(20);
      expect(response.body.pagination.totalCount).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should efficiently calculate nearby positions', async () => {
      // Arrange
      const centerLat = 25.0330;
      const centerLon = 121.5654;
      
      // Create scattered positions around center
      for (let i = 0; i < 50; i++) {
        const coords = geoHelpers.generateRandomCoordinates(centerLat, centerLon, 5); // 5km radius
        await testHelpers.createTestPosition(sequelize, {
          ...testHelpers.testPositionData,
          droneId: `perf-drone-${i}`,
          latitude: coords.latitude,
          longitude: coords.longitude
        });
      }

      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get(`/api/drone-position/nearby?latitude=${centerLat}&longitude=${centerLon}&radius=2000`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1500); // Should respond within 1.5 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid coordinate formats', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-position/nearby?latitude=invalid&longitude=also-invalid')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid time formats gracefully', async () => {
      // Act
      const response = await request(app)
        .get('/api/drone-position?startTime=invalid-date&endTime=also-invalid')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors', async () => {
      // Close database connection to simulate error
      await sequelize.close();

      const response = await request(app)
        .get('/api/drone-position')
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reopen for cleanup
      await setupTestDb();
    });
  });
});