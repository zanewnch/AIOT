-- =====================================================
-- 00_databases_creation.sql - PostgreSQL 資料庫創建腳本
-- =====================================================
-- 功能描述：
-- 1. 創建 AIOT 微服務架構所需的所有資料庫
-- 2. 每個微服務擁有獨立的資料庫實例
-- 3. 設置資料庫編碼為 UTF8
-- 4. 為應用用戶 'admin' 授權所有資料庫的完整權限
-- 
-- 創建的資料庫：
-- - rbac_db: RBAC 權限管理微服務資料庫
-- - drone_db: Drone 無人機管理微服務資料庫  
-- - user_preference_db: General 微服務資料庫（用戶偏好設定）
-- - main_db: 共享資料庫（跨服務共享數據）
--
-- 注意：此腳本只創建資料庫結構，不包含表結構和數據
-- 表結構和數據由各自的完整初始化腳本負責
-- =====================================================

-- =====================================
-- 1. 創建 RBAC 微服務資料庫
-- =====================================
CREATE DATABASE rbac_db 
WITH ENCODING 'UTF8' 
LC_COLLATE='C' 
LC_CTYPE='C' 
TEMPLATE=template0;

-- =====================================
-- 2. 創建 Drone 微服務資料庫
-- =====================================
CREATE DATABASE drone_db 
WITH ENCODING 'UTF8' 
LC_COLLATE='C' 
LC_CTYPE='C' 
TEMPLATE=template0;

-- =====================================
-- 3. 創建 General 微服務資料庫（用戶偏好等）
-- =====================================
CREATE DATABASE user_preference_db 
WITH ENCODING 'UTF8' 
LC_COLLATE='C' 
LC_CTYPE='C' 
TEMPLATE=template0;

-- =====================================
-- 4. 創建主要共享資料庫（如果需要跨服務共享數據）
-- =====================================
CREATE DATABASE main_db 
WITH ENCODING 'UTF8' 
LC_COLLATE='C' 
LC_CTYPE='C' 
TEMPLATE=template0;

-- =====================================
-- 5. 為應用用戶授權所有資料庫的完整權限
-- =====================================
-- 連接到各個資料庫並授權

\c rbac_db;
GRANT ALL PRIVILEGES ON DATABASE rbac_db TO admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO admin;

\c drone_db;
GRANT ALL PRIVILEGES ON DATABASE drone_db TO admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO admin;

\c user_preference_db;
GRANT ALL PRIVILEGES ON DATABASE user_preference_db TO admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO admin;

\c main_db;
GRANT ALL PRIVILEGES ON DATABASE main_db TO admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO admin;

-- =====================================
-- 6. 顯示執行結果
-- =====================================
SELECT 'All microservice databases initialized successfully' AS status;

-- 顯示所有資料庫
\l