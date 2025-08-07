-- RBAC 初始化 SQL Script
-- 這個腳本會確保 admin 用戶有所有權限，並新增 user 用戶有所有 read 權限

-- 開始交易
START TRANSACTION;

-- =====================================
-- 1. 確保 admin 用戶存在並有所有權限
-- =====================================

-- 檢查並新增 admin 用戶（如果不存在）
INSERT IGNORE INTO users (username, passwordHash, email, createdAt, updatedAt)
VALUES ('admin', '$2b$10$twgEXAAixwN5/.sjyKhAZ.hlUUXjhFuevIRoHZdzbbB7jLEPhMixa', 'admin@aiot.com', NOW(), NOW());

-- 檢查並新增 admin 角色（如果不存在）
INSERT IGNORE INTO roles (name, displayName, createdAt, updatedAt)
VALUES ('admin', 'Administrator', NOW(), NOW());

-- 檢查並新增 admin_all 權限（如果不存在）
INSERT IGNORE INTO permissions (name, description, createdAt, updatedAt)
VALUES ('admin_all', 'Full administrative privileges - all permissions', NOW(), NOW());

-- 為 admin 用戶分配 admin 角色（如果還未分配）
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'admin';

-- 為 admin 角色分配所有權限（如果還未分配）
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r, permissions p
WHERE r.name = 'admin';

-- =====================================
-- 2. 確保 user 用戶存在並有所有 read 權限
-- =====================================

-- 檢查並新增 user 用戶（如果不存在）
INSERT IGNORE INTO users (username, passwordHash, email, createdAt, updatedAt)
VALUES ('user', '$2b$10$defaultUserHashForReadOnlyUser123456789', 'user@aiot.com', NOW(), NOW());

-- 檢查並新增 user 角色（如果不存在）
INSERT IGNORE INTO roles (name, displayName, createdAt, updatedAt)
VALUES ('user', '一般使用者角色', NOW(), NOW());

-- 為 user 用戶分配 user 角色（如果還未分配）
INSERT IGNORE INTO user_roles (userId, roleId, createdAt, updatedAt)
SELECT u.id, r.id, NOW(), NOW()
FROM users u, roles r
WHERE u.username = 'user' AND r.name = 'user';

-- 為 user 角色分配所有 read 權限（如果還未分配）
-- 包括：user.read, role.read, permission.read, data.view, rtk.read
INSERT IGNORE INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r, permissions p
WHERE r.name = 'user'
  AND p.name IN ('user.read', 'role.read', 'permission.read', 'data.view', 'rtk.read');

-- 提交交易
COMMIT;

-- 顯示執行結果
SELECT 'RBAC initialization completed successfully' AS status;

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
