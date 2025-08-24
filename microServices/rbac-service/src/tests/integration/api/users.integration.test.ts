/**
 * @fileoverview Integration tests for Users API
 */

import request from 'supertest';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { setupTestDb, cleanupTestDb, testHelpers } from '../../setup';

describe('Users API - Integration Tests', () => {
  let app: Application;
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    app = testHelpers.createTestApp();
    
    // Setup routes - in a real implementation, this would be imported
    app.post('/api/users', async (req, res) => {
      try {
        // Mock implementation of user creation
        const userData = req.body;
        const user = await testHelpers.createTestUser(sequelize, userData);
        res.status(201).json({
          success: true,
          data: user
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/users', async (req, res) => {
      try {
        const users = await sequelize.models.User.findAll({
          where: { isActive: true },
          attributes: { exclude: ['passwordHash'] }
        });
        res.json({
          success: true,
          data: users
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/users/:id', async (req, res) => {
      try {
        const user = await sequelize.models.User.findByPk(req.params.id, {
          attributes: { exclude: ['passwordHash'] }
        });
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        res.json({
          success: true,
          data: user
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.put('/api/users/:id', async (req, res) => {
      try {
        const user = await sequelize.models.User.findByPk(req.params.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        await user.update(req.body);
        const updatedUser = await sequelize.models.User.findByPk(req.params.id, {
          attributes: { exclude: ['passwordHash'] }
        });

        res.json({
          success: true,
          data: updatedUser
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.delete('/api/users/:id', async (req, res) => {
      try {
        const user = await sequelize.models.User.findByPk(req.params.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        await user.update({ isActive: false });
        
        res.json({
          success: true,
          message: 'User deleted successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/users/:id/permissions', async (req, res) => {
      try {
        // Mock implementation - would use actual service
        const permissions = await sequelize.query(`
          SELECT DISTINCT p.name, p.description, p.category
          FROM users u
          JOIN user_roles ur ON u.id = ur.userId
          JOIN role_permissions rp ON ur.roleId = rp.roleId
          JOIN permissions p ON rp.permissionId = p.id
          WHERE u.id = ? AND u.isActive = true AND p.isActive = true
        `, {
          replacements: [req.params.id],
          type: sequelize.QueryTypes.SELECT
        });

        res.json({
          success: true,
          data: permissions
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

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 400 for duplicate username', async () => {
      // Arrange
      const userData = {
        username: 'duplicate',
        email: 'test1@example.com',
        password: 'password123'
      };

      await testHelpers.createTestUser(sequelize, {
        username: 'duplicate',
        email: 'existing@example.com',
        passwordHash: 'hash',
        isActive: true
      });

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('duplicate');
    });

    it('should return 400 for invalid email', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const incompleteUserData = {
        username: 'testuser'
        // Missing email and password
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(incompleteUserData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
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
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].username).toBe('user1');
      expect(response.body.data[0].passwordHash).toBeUndefined();
    });

    it('should return empty array when no users exist', async () => {
      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.username).toBe(user.username);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/99999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 500 for invalid user id format', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/invalid')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const updateData = {
        email: 'updated@example.com'
      };

      // Act
      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.username).toBe(user.username);
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const updateData = {
        email: 'updated@example.com'
      };

      // Act
      const response = await request(app)
        .put('/api/users/99999')
        .send(updateData)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for invalid update data', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const invalidUpdateData = {
        email: 'invalid-email-format'
      };

      // Act
      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .send(invalidUpdateData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is soft deleted
      const updatedUser = await sequelize.models.User.findByPk(user.id);
      expect(updatedUser.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      // Act
      const response = await request(app)
        .delete('/api/users/99999')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/users/:id/permissions', () => {
    it('should return user permissions', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);
      const role = await testHelpers.createTestRole(sequelize);
      const permission = await testHelpers.createTestPermission(sequelize);
      
      await testHelpers.createUserRole(sequelize, user.id, role.id);
      await testHelpers.createRolePermission(sequelize, role.id, permission.id);

      // Act
      const response = await request(app)
        .get(`/api/users/${user.id}/permissions`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe(permission.name);
    });

    it('should return empty array for user without permissions', async () => {
      // Arrange
      const user = await testHelpers.createTestUser(sequelize);

      // Act
      const response = await request(app)
        .get(`/api/users/${user.id}/permissions`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return empty array for non-existent user', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/99999/permissions')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // In a real scenario, you would simulate database unavailability
    });

    it('should handle malformed JSON requests', async () => {
      // Act
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('invalid json}')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should handle SQL injection attempts', async () => {
      // Arrange
      const maliciousData = {
        username: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(maliciousData);

      // Assert
      // The system should handle this gracefully without executing the SQL
      expect(response.status).toBeLessThan(500);
      
      // Verify table still exists
      const users = await sequelize.models.User.findAll();
      expect(users).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent user creation requests', async () => {
      // Arrange
      const userPromises = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .post('/api/users')
          .send({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: 'password123'
          })
      );

      // Act
      const responses = await Promise.all(userPromises);

      // Assert
      const successfulCreations = responses.filter(res => res.status === 201);
      expect(successfulCreations.length).toBe(10);
    });

    it('should respond within acceptable time limits', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await request(app)
        .get('/api/users')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});