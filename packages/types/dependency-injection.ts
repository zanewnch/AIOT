/**
 * @fileoverview 依賴注入類型定義
 *
 * 定義 Inversify 依賴注入容器的類型標識符。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-08-08
 */

/**
 * 依賴注入類型標識符
 */
export const TYPES = {
    // === 服務層 ===
    // Auth 服務
    AuthQueriesSvc: Symbol.for('AuthQueriesSvc'),
    AuthCommandsSvc: Symbol.for('AuthCommandsSvc'),
    
    // 會話服務
    SessionQueriesSvc: Symbol.for('SessionQueriesSvc'),
    SessionCommandsSvc: Symbol.for('SessionCommandsSvc'),
    
    // 使用者服務
    UserQueriesSvc: Symbol.for('UserQueriesSvc'),
    UserCommandsSvc: Symbol.for('UserCommandsSvc'),
    
    // 角色服務
    RoleQueriesSvc: Symbol.for('RoleQueriesSvc'),
    RoleCommandsSvc: Symbol.for('RoleCommandsSvc'),
    
    // 權限服務
    PermissionQueriesSvc: Symbol.for('PermissionQueriesSvc'),
    PermissionCommandsSvc: Symbol.for('PermissionCommandsSvc'),
    
    // 使用者角色關聯服務
    UserToRoleQueriesSvc: Symbol.for('UserToRoleQueriesSvc'),
    UserToRoleCommandsSvc: Symbol.for('UserToRoleCommandsSvc'),
    
    // 角色權限關聯服務
    RoleToPermissionQueriesSvc: Symbol.for('RoleToPermissionQueriesSvc'),
    RoleToPermissionCommandsSvc: Symbol.for('RoleToPermissionCommandsSvc'),
    
    // === 資料存取層 ===
    // 使用者儲存庫
    UserQueriesRepository: Symbol.for('UserQueriesRepository'),
    UserCommandsRepository: Symbol.for('UserCommandsRepository'),
    
    // 角色儲存庫
    RoleQueriesRepository: Symbol.for('RoleQueriesRepository'),
    RoleCommandsRepository: Symbol.for('RoleCommandsRepository'),
    
    // 權限儲存庫
    PermissionQueriesRepository: Symbol.for('PermissionQueriesRepository'),
    PermissionCommandsRepository: Symbol.for('PermissionCommandsRepository'),
    
    // 使用者角色關聯儲存庫
    UserRoleQueriesRepository: Symbol.for('UserRoleQueriesRepository'),
    UserRoleCommandsRepository: Symbol.for('UserRoleCommandsRepository'),
    
    // 角色權限關聯儲存庫
    RolePermissionQueriesRepository: Symbol.for('RolePermissionQueriesRepository'),
    RolePermissionCommandsRepository: Symbol.for('RolePermissionCommandsRepository'),
    
    // === 基礎設施 ===
    // 資料庫連接
    SequelizeConnection: Symbol.for('SequelizeConnection'),
    MongoDBConnection: Symbol.for('MongoDBConnection'),
    RedisConnection: Symbol.for('RedisConnection'),
    
    // 外部服務
    RabbitMQConnection: Symbol.for('RabbitMQConnection'),
    
    // === 無人機相關（drone 使用）===
    // 無人機位置服務
    DronePositionQueriesSvc: Symbol.for('DronePositionQueriesSvc'),
    DronePositionCommandsSvc: Symbol.for('DronePositionCommandsSvc'),
    
    // 無人機狀態服務
    DroneStatusQueriesSvc: Symbol.for('DroneStatusQueriesSvc'),
    DroneStatusCommandsSvc: Symbol.for('DroneStatusCommandsSvc'),
    
    // 無人機命令服務
    DroneCommandQueriesSvc: Symbol.for('DroneCommandQueriesSvc'),
    DroneCommandCommandsSvc: Symbol.for('DroneCommandCommandsSvc'),
    
    // === 前端服務相關（fe 使用）===
    // 使用者偏好服務
    UserPreferenceQueriesSvc: Symbol.for('UserPreferenceQueriesSvc'),
    UserPreferenceCommandsSvc: Symbol.for('UserPreferenceCommandsSvc'),
} as const;