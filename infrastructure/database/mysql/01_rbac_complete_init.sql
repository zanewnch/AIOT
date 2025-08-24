-- =====================================================
-- 01_rbac_complete_init.sql - RBAC 完整系統初始化腳本
-- =====================================================
-- 功能描述：
-- 1. 創建完整的 RBAC (Role-Based Access Control) 表結構
-- 2. 插入基礎權限、角色和大量測試用戶數據
-- 3. 建立用戶-角色和角色-權限的關聯關係
-- 4. 使用存儲過程批量生成 1萬筆測試用戶數據
-- 
-- 創建的表結構（5個表）：
-- - users: 使用者資料表（主鍵、用戶名、密碼雜湊、郵箱等）
-- - roles: 角色資料表（角色名稱、顯示名稱、描述等）
-- - permissions: 權限資料表（權限名稱、描述、分類等）
-- - user_roles: 使用者角色關聯表（多對多關係）
-- - role_permissions: 角色權限關聯表（多對多關係）
--
-- 插入的數據規模：
-- - 23個基礎權限（user.*, role.*, permission.*, drone.*, system.*, audit.*）
-- - 4個角色（admin, user, operator, viewer）
-- - 10,004個用戶：
--   * 1個管理員用戶（admin - 擁有全部權限）
--   * 3個基礎測試用戶（user, operator, viewer）
--   * 10,000個大量測試用戶（test_user_00001 到 test_user_10000）
-- - 智能角色分配（user:70%, viewer:20%, operator:10%）
-- - 完整的權限分配（admin擁有所有權限，其他角色有限制權限）
--
-- 預設管理員帳號：admin / admin（擁有所有系統權限）
-- 測試用戶密碼：password123（適用於所有 test_user_xxxxx 帳號）
-- 
-- 性能特性：
-- - 使用存儲過程批量插入，優化大數據量處理
-- - 隨機生成用戶屬性（活躍狀態、建立時間、角色分配）
-- - 進度監控（每1000筆顯示進度）
-- - 統計報表（用戶總數、角色分佈、活躍用戶比例）
-- =====================================================

-- 使用 RBAC 微服務專用數據庫
USE rbac_db;

-- 開始交易
START TRANSACTION;

-- =====================================
-- 1. 創建 RBAC 表結構
-- =====================================

-- 創建 users 表 - 使用者資料表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    username VARCHAR(100) NOT NULL UNIQUE COMMENT '使用者名稱（唯一）',
    passwordHash VARCHAR(255) NOT NULL COMMENT '密碼雜湊值',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '電子郵件（唯一）',
    isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT '帳號啟用狀態',
    lastLoginAt TIMESTAMP NULL COMMENT '最後登入時間',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_isActive (isActive),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用者資料表';

-- 創建 roles 表 - 角色資料表
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '角色名稱（唯一）',
    displayName VARCHAR(255) NOT NULL COMMENT '角色顯示名稱',
    description TEXT COMMENT '角色描述',
    isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT '角色啟用狀態',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name),
    INDEX idx_isActive (isActive),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色資料表';

-- 創建 permissions 表 - 權限資料表
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '權限名稱（唯一）',
    description TEXT COMMENT '權限描述',
    category VARCHAR(50) DEFAULT 'general' COMMENT '權限分類',
    isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT '權限啟用狀態',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_permissions_name (name),
    INDEX idx_category (category),
    INDEX idx_isActive (isActive),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='權限資料表';

-- 創建 user_roles 表 - 使用者角色關聯表
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    userId BIGINT NOT NULL COMMENT '使用者 ID（外鍵）',
    roleId BIGINT NOT NULL COMMENT '角色 ID（外鍵）',
    isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT '關聯啟用狀態',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_roles (userId, roleId),
    INDEX idx_userId (userId),
    INDEX idx_roleId (roleId),
    INDEX idx_isActive (isActive),
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用者角色關聯表';

-- 創建 role_permissions 表 - 角色權限關聯表
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    roleId BIGINT NOT NULL COMMENT '角色 ID（外鍵）',
    permissionId BIGINT NOT NULL COMMENT '權限 ID（外鍵）',
    isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT '關聯啟用狀態',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_permissions (roleId, permissionId),
    INDEX idx_roleId (roleId),
    INDEX idx_permissionId (permissionId),
    INDEX idx_isActive (isActive),
    
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色權限關聯表';

-- =====================================
-- 2. 插入所有基礎權限
-- =====================================
INSERT IGNORE INTO permissions (name, description, category, createdAt, updatedAt)
VALUES 
  ('admin_all', 'Full administrative privileges - all permissions', 'admin', NOW(), NOW()),
  ('user.create', 'Create new users', 'user', NOW(), NOW()),
  ('user.read', 'View user information', 'user', NOW(), NOW()),
  ('user.update', 'Update user information', 'user', NOW(), NOW()),
  ('user.delete', 'Delete users', 'user', NOW(), NOW()),
  ('role.create', 'Create new roles', 'role', NOW(), NOW()),
  ('role.read', 'View role information', 'role', NOW(), NOW()),
  ('role.update', 'Update role information', 'role', NOW(), NOW()),
  ('role.delete', 'Delete roles', 'role', NOW(), NOW()),
  ('permission.create', 'Create new permissions', 'permission', NOW(), NOW()),
  ('permission.read', 'View permission information', 'permission', NOW(), NOW()),
  ('permission.update', 'Update permission information', 'permission', NOW(), NOW()),
  ('permission.delete', 'Delete permissions', 'permission', NOW(), NOW()),
  ('drone.read', 'View drone information', 'drone', NOW(), NOW()),
  ('drone.update', 'Update drone settings', 'drone', NOW(), NOW()),
  ('drone.create', 'Create new drones', 'drone', NOW(), NOW()),
  ('drone.delete', 'Delete drones', 'drone', NOW(), NOW()),
  ('system.configure', 'Configure system settings', 'system', NOW(), NOW()),
  ('audit.read', 'View audit logs', 'audit', NOW(), NOW()),
  ('data.view', 'View data', 'data', NOW(), NOW()),
  ('data.export', 'Export data', 'data', NOW(), NOW()),
  ('rtk.read', 'View RTK information', 'rtk', NOW(), NOW()),
  ('rtk.configure', 'Configure RTK settings', 'rtk', NOW(), NOW());

-- =====================================
-- 2. 插入基礎角色
-- =====================================
INSERT IGNORE INTO roles (name, displayName, description, createdAt, updatedAt)
VALUES 
  ('admin', 'Administrator', 'System administrator with full permissions', NOW(), NOW()),
  ('user', 'Regular User', 'Regular user with limited permissions', NOW(), NOW()),
  ('viewer', 'Viewer', 'Read-only user', NOW(), NOW()),
  ('operator', 'Operator', 'Drone operator with control permissions', NOW(), NOW());

-- =====================================
-- 3. 插入測試用戶
-- =====================================
-- 插入基本測試用戶
INSERT IGNORE INTO users (username, passwordHash, email, isActive, createdAt, updatedAt)
VALUES 
  ('admin', '$2b$10$twgEXAAixwN5/.sjyKhAZ.hlUUXjhFuevIRoHZdzbbB7jLEPhMixa', 'admin@aiot.com', TRUE, NOW(), NOW()),
  ('user', '$2b$10$defaultUserHashForReadOnlyUser123456789', 'user@aiot.com', TRUE, NOW(), NOW()),
  ('operator', '$2b$10$operatorHashForDroneOperator789012345', 'operator@aiot.com', TRUE, NOW(), NOW()),
  ('viewer', '$2b$10$viewerHashForReadOnlyViewer456789012', 'viewer@aiot.com', TRUE, NOW(), NOW());

-- =====================================
-- 6. 生成 1萬筆測試用戶數據
-- =====================================
-- 創建臨時程序來生成大量用戶數據
DELIMITER $$

CREATE PROCEDURE GenerateTestUsers()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE user_name VARCHAR(100);
    DECLARE user_email VARCHAR(255);
    DECLARE random_active BOOLEAN;
    DECLARE random_role_num INT;
    
    -- 禁用外鍵約束以提升插入性能
    SET FOREIGN_KEY_CHECKS = 0;
    
    WHILE i <= 10000 DO
        -- 生成用戶名和郵箱
        SET user_name = CONCAT('test_user_', LPAD(i, 5, '0'));
        SET user_email = CONCAT('test_user_', LPAD(i, 5, '0'), '@example.com');
        
        -- 隨機生成活躍狀態 (90% 活躍)
        SET random_active = (RAND() > 0.1);
        
        -- 插入用戶 (密碼都是 'password123' 的雜湊值)
        INSERT IGNORE INTO users (username, passwordHash, email, isActive, createdAt, updatedAt)
        VALUES (
            user_name, 
            '$2b$10$rOyFbMR5lJTmJGv6PD8VUeN0VjH8pJBa3hVrKjY2LqX4.Ck9D5vFO', 
            user_email, 
            random_active,
            NOW() - INTERVAL FLOOR(RAND() * 365) DAY,  -- 隨機建立時間(過去一年內)
            NOW()
        );
        
        -- 隨機分配角色 (user: 70%, viewer: 20%, operator: 10%)
        SET random_role_num = FLOOR(RAND() * 10) + 1;
        
        IF random_role_num <= 7 THEN
            -- 分配 user 角色 (70%)
            INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
            SELECT u.id, r.id, NOW(), NOW()
            FROM users u, roles r
            WHERE u.username = user_name AND r.name = 'user';
        ELSEIF random_role_num <= 9 THEN
            -- 分配 viewer 角色 (20%)
            INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
            SELECT u.id, r.id, NOW(), NOW()
            FROM users u, roles r
            WHERE u.username = user_name AND r.name = 'viewer';
        ELSE
            -- 分配 operator 角色 (10%)
            INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
            SELECT u.id, r.id, NOW(), NOW()
            FROM users u, roles r
            WHERE u.username = user_name AND r.name = 'operator';
        END IF;
        
        SET i = i + 1;
        
        -- 每1000筆顯示進度
        IF i % 1000 = 0 THEN
            SELECT CONCAT('已生成 ', i, ' 筆用戶數據') AS progress;
        END IF;
    END WHILE;
    
    -- 重新啟用外鍵約束
    SET FOREIGN_KEY_CHECKS = 1;
    
    SELECT '成功生成 10,000 筆測試用戶數據' AS result;
END$$

DELIMITER ;

-- 執行程序生成用戶數據
CALL GenerateTestUsers();

-- 刪除臨時程序
DROP PROCEDURE GenerateTestUsers;

-- =====================================
-- 4. 分配用戶角色關聯
-- =====================================
-- 為 admin 用戶分配 admin 角色
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'admin';

-- 為 user 用戶分配 user 角色
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'user' AND r.name = 'user';

-- 為 operator 用戶分配 operator 角色
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'operator' AND r.name = 'operator';

-- 為 viewer 用戶分配 viewer 角色
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'viewer' AND r.name = 'viewer';

-- 注意：大量測試用戶的角色分配已在 GenerateTestUsers() 程序中完成

-- =====================================
-- 5. 分配角色權限關聯
-- =====================================
-- 為 admin 角色分配所有權限
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r, permissions p
WHERE r.name = 'admin';

-- 為 user 角色分配基本 read 權限
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r, permissions p
WHERE r.name = 'user'
  AND p.name IN ('user.read', 'role.read', 'permission.read', 'data.view', 'rtk.read', 'drone.read', 'audit.read');

-- 為 operator 角色分配無人機操作權限
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r, permissions p
WHERE r.name = 'operator'
  AND p.name IN ('drone.read', 'drone.update', 'drone.create', 'rtk.read', 'rtk.configure', 'data.view', 'user.read');

-- 為 viewer 角色分配只讀權限
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r, permissions p
WHERE r.name = 'viewer'
  AND p.name IN ('user.read', 'role.read', 'permission.read', 'data.view', 'rtk.read', 'drone.read', 'audit.read');

-- 提交交易
COMMIT;

-- 顯示執行結果與統計
SELECT 'RBAC initialization completed successfully' AS status;

-- 統計用戶數據
SELECT 
    '用戶統計' AS category,
    COUNT(*) AS total_count,
    SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS active_users,
    SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) AS inactive_users
FROM users;

-- 統計用戶角色分佈
SELECT 
    r.displayName AS role_name,
    COUNT(ur.userId) AS user_count,
    ROUND(COUNT(ur.userId) * 100.0 / (SELECT COUNT(*) FROM user_roles), 2) AS percentage
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.roleId
WHERE ur.isActive = 1
GROUP BY r.id, r.displayName
ORDER BY user_count DESC;

-- 驗證結果：顯示 admin 用戶的權限
SELECT
    u.username,
    r.name as role_name,
    p.name as permission_name,
    p.description
FROM users u
         JOIN user_roles ur ON u.id = ur.userId
         JOIN roles r ON ur.roleId = r.id
         JOIN role_permissions rp ON r.id = rp.roleId
         JOIN permissions p ON rp.permissionId = p.id
WHERE u.username = 'admin'
ORDER BY p.name;

-- 驗證結果：顯示 user 用戶的權限
SELECT
    u.username,
    r.name as role_name,
    p.name as permission_name,
    p.description
FROM users u
         JOIN user_roles ur ON u.id = ur.userId
         JOIN roles r ON ur.roleId = r.id
         JOIN role_permissions rp ON r.id = rp.roleId
         JOIN permissions p ON rp.permissionId = p.id
WHERE u.username = 'user'
ORDER BY p.name;