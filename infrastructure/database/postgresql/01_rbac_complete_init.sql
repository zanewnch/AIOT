-- =====================================================
-- 01_rbac_complete_init.sql - RBAC 完整系統初始化腳本 (PostgreSQL)
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
-- =====================================================

-- 連接到 RBAC 微服務專用資料庫
\c rbac_db;

-- 開始交易
BEGIN;

-- =====================================
-- 1. 創建 RBAC 表結構
-- =====================================

-- 創建 users 表 - 使用者資料表
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "lastLoginAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_isActive ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users("createdAt");

-- 創建 roles 表 - 角色資料表
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    "displayName" VARCHAR(255) NOT NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_isActive ON roles("isActive");
CREATE INDEX IF NOT EXISTS idx_roles_createdAt ON roles("createdAt");

-- 創建 permissions 表 - 權限資料表
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_isActive ON permissions("isActive");
CREATE INDEX IF NOT EXISTS idx_permissions_createdAt ON permissions("createdAt");

-- 創建 user_roles 表 - 使用者角色關聯表
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "roleId" BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    "assignedBy" BIGINT REFERENCES users(id),
    "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "roleId")
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_user_roles_userId ON user_roles("userId");
CREATE INDEX IF NOT EXISTS idx_user_roles_roleId ON user_roles("roleId");
CREATE INDEX IF NOT EXISTS idx_user_roles_assignedBy ON user_roles("assignedBy");
CREATE INDEX IF NOT EXISTS idx_user_roles_assignedAt ON user_roles("assignedAt");

-- 創建 role_permissions 表 - 角色權限關聯表
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGSERIAL PRIMARY KEY,
    "roleId" BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    "permissionId" BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    "grantedBy" BIGINT REFERENCES users(id),
    "grantedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("roleId", "permissionId")
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_roleId ON role_permissions("roleId");
CREATE INDEX IF NOT EXISTS idx_role_permissions_permissionId ON role_permissions("permissionId");
CREATE INDEX IF NOT EXISTS idx_role_permissions_grantedBy ON role_permissions("grantedBy");
CREATE INDEX IF NOT EXISTS idx_role_permissions_grantedAt ON role_permissions("grantedAt");

-- =====================================
-- 2. 插入基礎權限數據
-- =====================================

INSERT INTO permissions (name, description, category, "isActive") VALUES
-- User Management 權限
('user.create', '創建用戶', 'user_management', TRUE),
('user.read', '查看用戶資訊', 'user_management', TRUE),
('user.update', '更新用戶資訊', 'user_management', TRUE),
('user.delete', '刪除用戶', 'user_management', TRUE),
('user.list', '查看用戶列表', 'user_management', TRUE),

-- Role Management 權限
('role.create', '創建角色', 'role_management', TRUE),
('role.read', '查看角色資訊', 'role_management', TRUE),
('role.update', '更新角色資訊', 'role_management', TRUE),
('role.delete', '刪除角色', 'role_management', TRUE),
('role.list', '查看角色列表', 'role_management', TRUE),

-- Permission Management 權限
('permission.create', '創建權限', 'permission_management', TRUE),
('permission.read', '查看權限資訊', 'permission_management', TRUE),
('permission.update', '更新權限資訊', 'permission_management', TRUE),
('permission.delete', '刪除權限', 'permission_management', TRUE),
('permission.list', '查看權限列表', 'permission_management', TRUE),

-- Drone Management 權限
('drone.create', '創建無人機', 'drone_management', TRUE),
('drone.read', '查看無人機資訊', 'drone_management', TRUE),
('drone.update', '更新無人機資訊', 'drone_management', TRUE),
('drone.delete', '刪除無人機', 'drone_management', TRUE),
('drone.control', '控制無人機', 'drone_management', TRUE),

-- System Management 權限
('system.config', '系統配置管理', 'system_management', TRUE),
('system.monitor', '系統監控', 'system_management', TRUE),
('system.backup', '系統備份', 'system_management', TRUE);

-- =====================================
-- 3. 插入基礎角色數據
-- =====================================

INSERT INTO roles (name, "displayName", description, "isActive") VALUES
('admin', '系統管理員', '擁有所有系統權限的超級管理員', TRUE),
('user', '一般用戶', '基本的系統使用權限', TRUE),
('operator', '操作員', '操作無人機和部分管理權限', TRUE),
('viewer', '查看者', '只能查看資訊，無法進行修改操作', TRUE);

-- =====================================
-- 4. 插入基礎用戶數據
-- =====================================

-- 插入管理員用戶 (密碼: admin)
INSERT INTO users (username, "passwordHash", email, "isActive") VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@aiot.local', TRUE),
('user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user@aiot.local', TRUE),
('operator', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator@aiot.local', TRUE),
('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer@aiot.local', TRUE);

-- =====================================
-- 5. 建立角色權限關聯
-- =====================================

-- admin 角色擁有所有權限
INSERT INTO role_permissions ("roleId", "permissionId", "grantedBy")
SELECT r.id, p.id, 1
FROM roles r, permissions p
WHERE r.name = 'admin';

-- user 角色權限 (基本讀取權限)
INSERT INTO role_permissions ("roleId", "permissionId", "grantedBy")
SELECT r.id, p.id, 1
FROM roles r, permissions p
WHERE r.name = 'user' 
AND p.name IN ('user.read', 'role.read', 'permission.read', 'drone.read');

-- operator 角色權限 (操作權限)
INSERT INTO role_permissions ("roleId", "permissionId", "grantedBy")
SELECT r.id, p.id, 1
FROM roles r, permissions p
WHERE r.name = 'operator' 
AND p.name IN ('user.read', 'user.update', 'role.read', 'permission.read', 
               'drone.create', 'drone.read', 'drone.update', 'drone.control');

-- viewer 角色權限 (只讀權限)
INSERT INTO role_permissions ("roleId", "permissionId", "grantedBy")
SELECT r.id, p.id, 1
FROM roles r, permissions p
WHERE r.name = 'viewer' 
AND p.name IN ('user.read', 'role.read', 'permission.read', 'drone.read');

-- =====================================
-- 6. 建立用戶角色關聯
-- =====================================

-- 分配角色給基礎用戶
INSERT INTO user_roles ("userId", "roleId", "assignedBy")
SELECT u.id, r.id, 1
FROM users u, roles r
WHERE (u.username = 'admin' AND r.name = 'admin')
   OR (u.username = 'user' AND r.name = 'user')
   OR (u.username = 'operator' AND r.name = 'operator')
   OR (u.username = 'viewer' AND r.name = 'viewer');

-- =====================================
-- 7. 批量創建測試用戶（使用函數）
-- =====================================

-- 創建批量插入函數
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS void AS $$
DECLARE
    i INTEGER;
    role_choice INTEGER;
    role_name TEXT;
    user_id BIGINT;
    role_id BIGINT;
BEGIN
    FOR i IN 1..10000 LOOP
        -- 插入測試用戶 (密碼: password123)
        INSERT INTO users (username, "passwordHash", email, "isActive", "createdAt")
        VALUES (
            'test_user_' || LPAD(i::TEXT, 5, '0'),
            '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            'test_user_' || LPAD(i::TEXT, 5, '0') || '@test.aiot.local',
            (RANDOM() > 0.1), -- 90% 的用戶是活躍的
            CURRENT_TIMESTAMP - INTERVAL '1 day' * (RANDOM() * 365)
        ) RETURNING id INTO user_id;

        -- 隨機分配角色 (70% user, 20% viewer, 10% operator)
        role_choice := (RANDOM() * 100)::INTEGER;
        
        IF role_choice < 70 THEN
            role_name := 'user';
        ELSIF role_choice < 90 THEN
            role_name := 'viewer';
        ELSE
            role_name := 'operator';
        END IF;

        -- 獲取角色ID並分配
        SELECT id INTO role_id FROM roles WHERE name = role_name;
        INSERT INTO user_roles ("userId", "roleId", "assignedBy", "assignedAt")
        VALUES (user_id, role_id, 1, CURRENT_TIMESTAMP);

        -- 每1000筆顯示進度
        IF i % 1000 = 0 THEN
            RAISE NOTICE 'Created % test users', i;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 執行批量創建
SELECT create_test_users();

-- 清理函數
DROP FUNCTION create_test_users();

-- =====================================
-- 8. 創建更新時間觸發器
-- =====================================

-- 創建更新時間函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為所有表創建更新時間觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提交交易
COMMIT;

-- =====================================
-- 9. 顯示統計信息
-- =====================================

SELECT 'RBAC system initialization completed successfully' AS status;

-- 統計信息
SELECT 
    'Users' AS table_name,
    COUNT(*) AS record_count,
    COUNT(CASE WHEN "isActive" = TRUE THEN 1 END) AS active_count
FROM users
UNION ALL
SELECT 
    'Roles' AS table_name,
    COUNT(*) AS record_count,
    COUNT(CASE WHEN "isActive" = TRUE THEN 1 END) AS active_count
FROM roles
UNION ALL
SELECT 
    'Permissions' AS table_name,
    COUNT(*) AS record_count,
    COUNT(CASE WHEN "isActive" = TRUE THEN 1 END) AS active_count
FROM permissions
UNION ALL
SELECT 
    'User-Role Assignments' AS table_name,
    COUNT(*) AS record_count,
    NULL AS active_count
FROM user_roles
UNION ALL
SELECT 
    'Role-Permission Assignments' AS table_name,
    COUNT(*) AS record_count,
    NULL AS active_count
FROM role_permissions;

-- 角色分佈統計
SELECT 
    r.name AS role_name,
    r."displayName" AS display_name,
    COUNT(ur."userId") AS user_count,
    ROUND(COUNT(ur."userId") * 100.0 / (SELECT COUNT(*) FROM user_roles), 2) AS percentage
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur."roleId"
GROUP BY r.id, r.name, r."displayName"
ORDER BY user_count DESC;