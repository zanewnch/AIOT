/**
 * @fileoverview Integration tests for RBAC gRPC service
 */

import * as grpc from '@grpc/grpc-js';
import { Sequelize } from 'sequelize';
import { setupTestDb, cleanupTestDb, testHelpers } from '../../setup';

// Mock gRPC service definition
const mockRbacService = {
  GetUser: jest.fn(),
  CreateUser: jest.fn(),
  UpdateUser: jest.fn(),
  DeleteUser: jest.fn(),
  ListUsers: jest.fn(),
  GetUserRoles: jest.fn(),
  AssignRole: jest.fn(),
  RevokeRole: jest.fn(),
  CheckPermission: jest.fn(),
  GetUserPermissions: jest.fn()
};

describe('RBAC gRPC Service - Integration Tests', () => {
  let sequelize: Sequelize;
  let grpcServer: grpc.Server;
  let client: any;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    
    // Setup gRPC server mock
    grpcServer = new grpc.Server();
    
    // Mock service implementation
    const serviceImplementation = {
      GetUser: async (call: any, callback: any) => {
        try {
          const { userId } = call.request;
          const user = await sequelize.models.User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] }
          });

          if (!user) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'User not found'
            });
          }

          callback(null, {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              isActive: user.isActive,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString()
            }
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      CreateUser: async (call: any, callback: any) => {
        try {
          const { username, email, passwordHash } = call.request;
          
          const user = await sequelize.models.User.create({
            username,
            email,
            passwordHash: passwordHash || 'defaulthash',
            isActive: true
          });

          callback(null, {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              isActive: user.isActive,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString()
            }
          });
        } catch (error) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: (error as Error).message
          });
        }
      },

      UpdateUser: async (call: any, callback: any) => {
        try {
          const { userId, email, isActive } = call.request;
          
          const user = await sequelize.models.User.findByPk(userId);
          if (!user) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'User not found'
            });
          }

          const updateData: any = {};
          if (email !== undefined) updateData.email = email;
          if (isActive !== undefined) updateData.isActive = isActive;

          await user.update(updateData);

          callback(null, {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              isActive: user.isActive,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString()
            }
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      DeleteUser: async (call: any, callback: any) => {
        try {
          const { userId } = call.request;
          
          const user = await sequelize.models.User.findByPk(userId);
          if (!user) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'User not found'
            });
          }

          await user.update({ isActive: false });

          callback(null, {
            success: true,
            message: 'User deleted successfully'
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      ListUsers: async (call: any, callback: any) => {
        try {
          const { page = 1, limit = 10, isActive } = call.request;
          const offset = (page - 1) * limit;

          const whereClause: any = {};
          if (isActive !== undefined) whereClause.isActive = isActive;

          const users = await sequelize.models.User.findAll({
            where: whereClause,
            attributes: { exclude: ['passwordHash'] },
            limit,
            offset
          });

          const userList = users.map((user: any) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
          }));

          callback(null, {
            users: userList,
            total: users.length,
            page,
            limit
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      GetUserRoles: async (call: any, callback: any) => {
        try {
          const { userId } = call.request;
          
          const roles = await sequelize.query(`
            SELECT r.id, r.name, r.displayName, r.description
            FROM roles r
            JOIN user_roles ur ON r.id = ur.roleId
            WHERE ur.userId = ? AND r.isActive = true
          `, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT
          });

          callback(null, {
            roles: roles.map((role: any) => ({
              id: role.id,
              name: role.name,
              displayName: role.displayName,
              description: role.description
            }))
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      AssignRole: async (call: any, callback: any) => {
        try {
          const { userId, roleId, assignedBy } = call.request;
          
          // Check if user exists
          const user = await sequelize.models.User.findByPk(userId);
          if (!user) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'User not found'
            });
          }

          // Check if role exists
          const role = await sequelize.models.Role.findByPk(roleId);
          if (!role) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Role not found'
            });
          }

          // Check if assignment already exists
          const existingAssignment = await sequelize.models.UserRole.findOne({
            where: { userId, roleId }
          });

          if (existingAssignment) {
            return callback({
              code: grpc.status.ALREADY_EXISTS,
              message: 'Role already assigned to user'
            });
          }

          // Create assignment
          await sequelize.models.UserRole.create({
            userId,
            roleId,
            assignedAt: new Date(),
            assignedBy: assignedBy || userId
          });

          callback(null, {
            success: true,
            message: 'Role assigned successfully'
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      RevokeRole: async (call: any, callback: any) => {
        try {
          const { userId, roleId } = call.request;
          
          const deleted = await sequelize.models.UserRole.destroy({
            where: { userId, roleId }
          });

          if (deleted === 0) {
            return callback({
              code: grpc.status.NOT_FOUND,
              message: 'Role assignment not found'
            });
          }

          callback(null, {
            success: true,
            message: 'Role revoked successfully'
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      CheckPermission: async (call: any, callback: any) => {
        try {
          const { userId, permissionName } = call.request;
          
          const permission = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM users u
            JOIN user_roles ur ON u.id = ur.userId
            JOIN role_permissions rp ON ur.roleId = rp.roleId
            JOIN permissions p ON rp.permissionId = p.id
            WHERE u.id = ? AND p.name = ? AND u.isActive = true AND p.isActive = true
          `, {
            replacements: [userId, permissionName],
            type: sequelize.QueryTypes.SELECT
          });

          const hasPermission = (permission[0] as any).count > 0;

          callback(null, {
            hasPermission,
            userId,
            permissionName
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      },

      GetUserPermissions: async (call: any, callback: any) => {
        try {
          const { userId } = call.request;
          
          const permissions = await sequelize.query(`
            SELECT DISTINCT p.id, p.name, p.description, p.category
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permissionId
            JOIN user_roles ur ON rp.roleId = ur.roleId
            WHERE ur.userId = ? AND p.isActive = true
          `, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT
          });

          callback(null, {
            permissions: permissions.map((perm: any) => ({
              id: perm.id,
              name: perm.name,
              description: perm.description,
              category: perm.category
            }))
          });
        } catch (error) {
          callback({
            code: grpc.status.INTERNAL,
            message: (error as Error).message
          });
        }
      }
    };

    // Mock gRPC service registration
    mockRbacService.GetUser.mockImplementation(serviceImplementation.GetUser);
    mockRbacService.CreateUser.mockImplementation(serviceImplementation.CreateUser);
    mockRbacService.UpdateUser.mockImplementation(serviceImplementation.UpdateUser);
    mockRbacService.DeleteUser.mockImplementation(serviceImplementation.DeleteUser);
    mockRbacService.ListUsers.mockImplementation(serviceImplementation.ListUsers);
    mockRbacService.GetUserRoles.mockImplementation(serviceImplementation.GetUserRoles);
    mockRbacService.AssignRole.mockImplementation(serviceImplementation.AssignRole);
    mockRbacService.RevokeRole.mockImplementation(serviceImplementation.RevokeRole);
    mockRbacService.CheckPermission.mockImplementation(serviceImplementation.CheckPermission);
    mockRbacService.GetUserPermissions.mockImplementation(serviceImplementation.GetUserPermissions);

    client = mockRbacService;
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
    if (grpcServer) {
      grpcServer.forceShutdown();
    }
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('User Management', () => {
    describe('GetUser', () => {
      it('should return user when id exists', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);

        // Act
        const mockCall = { request: { userId: user.id } };
        const mockCallback = jest.fn();
        
        await mockRbacService.GetUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          user: expect.objectContaining({
            id: user.id,
            username: user.username,
            email: user.email,
            isActive: user.isActive
          })
        });
      });

      it('should return NOT_FOUND for non-existent user', async () => {
        // Act
        const mockCall = { request: { userId: 99999 } };
        const mockCallback = jest.fn();
        
        await mockRbacService.GetUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      });
    });

    describe('CreateUser', () => {
      it('should create user successfully', async () => {
        // Arrange
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedpassword'
        };

        // Act
        const mockCall = { request: userData };
        const mockCallback = jest.fn();
        
        await mockRbacService.CreateUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          user: expect.objectContaining({
            username: userData.username,
            email: userData.email,
            isActive: true
          })
        });
      });

      it('should return INVALID_ARGUMENT for duplicate username', async () => {
        // Arrange
        await testHelpers.createTestUser(sequelize, {
          username: 'duplicate',
          email: 'existing@example.com',
          passwordHash: 'hash',
          isActive: true
        });

        const userData = {
          username: 'duplicate',
          email: 'new@example.com',
          passwordHash: 'hashedpassword'
        };

        // Act
        const mockCall = { request: userData };
        const mockCallback = jest.fn();
        
        await mockRbacService.CreateUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith({
          code: grpc.status.INVALID_ARGUMENT,
          message: expect.any(String)
        });
      });
    });

    describe('UpdateUser', () => {
      it('should update user successfully', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const updateData = {
          userId: user.id,
          email: 'updated@example.com',
          isActive: false
        };

        // Act
        const mockCall = { request: updateData };
        const mockCallback = jest.fn();
        
        await mockRbacService.UpdateUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          user: expect.objectContaining({
            email: updateData.email,
            isActive: updateData.isActive
          })
        });
      });

      it('should return NOT_FOUND for non-existent user', async () => {
        // Act
        const mockCall = { request: { userId: 99999, email: 'test@example.com' } };
        const mockCallback = jest.fn();
        
        await mockRbacService.UpdateUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      });
    });

    describe('DeleteUser', () => {
      it('should soft delete user successfully', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);

        // Act
        const mockCall = { request: { userId: user.id } };
        const mockCallback = jest.fn();
        
        await mockRbacService.DeleteUser(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          success: true,
          message: 'User deleted successfully'
        });

        // Verify user is soft deleted
        const updatedUser = await sequelize.models.User.findByPk(user.id);
        expect(updatedUser.isActive).toBe(false);
      });
    });

    describe('ListUsers', () => {
      it('should return paginated users list', async () => {
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
          isActive: true
        });

        // Act
        const mockCall = { request: { page: 1, limit: 10, isActive: true } };
        const mockCallback = jest.fn();
        
        await mockRbacService.ListUsers(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          users: expect.arrayContaining([
            expect.objectContaining({ username: 'user1' }),
            expect.objectContaining({ username: 'user2' })
          ]),
          total: 2,
          page: 1,
          limit: 10
        });
      });

      it('should filter by isActive status', async () => {
        // Arrange
        await testHelpers.createTestUser(sequelize, {
          username: 'active',
          email: 'active@example.com',
          passwordHash: 'hash1',
          isActive: true
        });
        
        await testHelpers.createTestUser(sequelize, {
          username: 'inactive',
          email: 'inactive@example.com',
          passwordHash: 'hash2',
          isActive: false
        });

        // Act
        const mockCall = { request: { isActive: true } };
        const mockCallback = jest.fn();
        
        await mockRbacService.ListUsers(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          users: expect.arrayContaining([
            expect.objectContaining({ username: 'active', isActive: true })
          ]),
          total: 1,
          page: 1,
          limit: 10
        });
      });
    });
  });

  describe('Role Management', () => {
    describe('GetUserRoles', () => {
      it('should return user roles', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);
        await testHelpers.createUserRole(sequelize, user.id, role.id);

        // Act
        const mockCall = { request: { userId: user.id } };
        const mockCallback = jest.fn();
        
        await mockRbacService.GetUserRoles(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          roles: expect.arrayContaining([
            expect.objectContaining({
              id: role.id,
              name: role.name,
              displayName: role.displayName
            })
          ])
        });
      });

      it('should return empty array for user without roles', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);

        // Act
        const mockCall = { request: { userId: user.id } };
        const mockCallback = jest.fn();
        
        await mockRbacService.GetUserRoles(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          roles: []
        });
      });
    });

    describe('AssignRole', () => {
      it('should assign role to user successfully', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);

        // Act
        const mockCall = { 
          request: { 
            userId: user.id, 
            roleId: role.id,
            assignedBy: user.id
          } 
        };
        const mockCallback = jest.fn();
        
        await mockRbacService.AssignRole(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          success: true,
          message: 'Role assigned successfully'
        });

        // Verify assignment exists
        const assignment = await sequelize.models.UserRole.findOne({
          where: { userId: user.id, roleId: role.id }
        });
        expect(assignment).toBeDefined();
      });

      it('should return ALREADY_EXISTS for duplicate assignment', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);
        await testHelpers.createUserRole(sequelize, user.id, role.id);

        // Act
        const mockCall = { 
          request: { 
            userId: user.id, 
            roleId: role.id 
          } 
        };
        const mockCallback = jest.fn();
        
        await mockRbacService.AssignRole(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith({
          code: grpc.status.ALREADY_EXISTS,
          message: 'Role already assigned to user'
        });
      });
    });

    describe('RevokeRole', () => {
      it('should revoke role from user successfully', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);
        await testHelpers.createUserRole(sequelize, user.id, role.id);

        // Act
        const mockCall = { 
          request: { 
            userId: user.id, 
            roleId: role.id 
          } 
        };
        const mockCallback = jest.fn();
        
        await mockRbacService.RevokeRole(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          success: true,
          message: 'Role revoked successfully'
        });

        // Verify assignment is deleted
        const assignment = await sequelize.models.UserRole.findOne({
          where: { userId: user.id, roleId: role.id }
        });
        expect(assignment).toBeNull();
      });

      it('should return NOT_FOUND for non-existent assignment', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);

        // Act
        const mockCall = { 
          request: { 
            userId: user.id, 
            roleId: role.id 
          } 
        };
        const mockCallback = jest.fn();
        
        await mockRbacService.RevokeRole(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith({
          code: grpc.status.NOT_FOUND,
          message: 'Role assignment not found'
        });
      });
    });
  });

  describe('Permission Management', () => {
    describe('CheckPermission', () => {
      it('should return true when user has permission', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);
        const permission = await testHelpers.createTestPermission(sequelize);
        
        await testHelpers.createUserRole(sequelize, user.id, role.id);
        await testHelpers.createRolePermission(sequelize, role.id, permission.id);

        // Act
        const mockCall = { 
          request: { 
            userId: user.id, 
            permissionName: permission.name 
          } 
        };
        const mockCallback = jest.fn();
        
        await mockRbacService.CheckPermission(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          hasPermission: true,
          userId: user.id,
          permissionName: permission.name
        });
      });

      it('should return false when user lacks permission', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const permission = await testHelpers.createTestPermission(sequelize);

        // Act
        const mockCall = { 
          request: { 
            userId: user.id, 
            permissionName: permission.name 
          } 
        };
        const mockCallback = jest.fn();
        
        await mockRbacService.CheckPermission(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          hasPermission: false,
          userId: user.id,
          permissionName: permission.name
        });
      });
    });

    describe('GetUserPermissions', () => {
      it('should return all user permissions', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);
        const role = await testHelpers.createTestRole(sequelize);
        const permission1 = await testHelpers.createTestPermission(sequelize, {
          name: 'read_data',
          description: 'Read data permission',
          category: 'data',
          isActive: true
        });
        const permission2 = await testHelpers.createTestPermission(sequelize, {
          name: 'write_data',
          description: 'Write data permission', 
          category: 'data',
          isActive: true
        });
        
        await testHelpers.createUserRole(sequelize, user.id, role.id);
        await testHelpers.createRolePermission(sequelize, role.id, permission1.id);
        await testHelpers.createRolePermission(sequelize, role.id, permission2.id);

        // Act
        const mockCall = { request: { userId: user.id } };
        const mockCallback = jest.fn();
        
        await mockRbacService.GetUserPermissions(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          permissions: expect.arrayContaining([
            expect.objectContaining({
              name: 'read_data',
              category: 'data'
            }),
            expect.objectContaining({
              name: 'write_data',
              category: 'data'
            })
          ])
        });
      });

      it('should return empty array for user without permissions', async () => {
        // Arrange
        const user = await testHelpers.createTestUser(sequelize);

        // Act
        const mockCall = { request: { userId: user.id } };
        const mockCallback = jest.fn();
        
        await mockRbacService.GetUserPermissions(mockCall, mockCallback);

        // Assert
        expect(mockCallback).toHaveBeenCalledWith(null, {
          permissions: []
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange - simulate database error by closing connection
      await sequelize.close();

      // Act
      const mockCall = { request: { userId: 1 } };
      const mockCallback = jest.fn();
      
      await mockRbacService.GetUser(mockCall, mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        code: grpc.status.INTERNAL,
        message: expect.any(String)
      });

      // Restore connection for cleanup
      sequelize = await setupTestDb();
    });

    it('should handle malformed requests', async () => {
      // Act
      const mockCall = { request: { userId: 'invalid' } };
      const mockCallback = jest.fn();
      
      await mockRbacService.GetUser(mockCall, mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        code: grpc.status.INTERNAL,
        message: expect.any(String)
      });
    });
  });
});