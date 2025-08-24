-- =====================================================
-- 03_user_preferences_init.sql - 用戶偏好設定系統初始化腳本 (PostgreSQL)
-- =====================================================
-- 功能描述：
-- 1. 創建 General 微服務的用戶偏好設定表結構
-- 2. 創建系統設定表結構
-- 3. 插入預設的用戶偏好設定和系統設定數據
-- 
-- 創建的表結構（2個表）：
-- - user_preferences: 用戶偏好設定表（主題、語言、時區、通知等）
-- - system_settings: 系統設定表（全局設定、應用配置等）
--
-- 插入的測試數據：
-- - admin 用戶偏好設定（dark主題、繁體中文、台北時區）
-- - 一般用戶偏好設定（light主題、英文、UTC時區）
-- - 8個系統設定項目（應用名稱、版本、維護模式、預設設定等）
--
-- 用於 general-service 微服務，管理用戶界面偏好和系統配置
-- =====================================================

-- 連接到 user_preference_db 資料庫
\c user_preference_db;

-- 開始交易
BEGIN;

-- =====================================
-- 1. 創建 user_preferences 資料表
-- =====================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    theme VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "autoSave" BOOLEAN NOT NULL DEFAULT TRUE,
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 確保每個使用者只有一筆偏好設定記錄
    UNIQUE("userId")
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_userId ON user_preferences("userId");

-- =====================================
-- 2. 插入預設的使用者偏好設定
-- =====================================

-- 為 admin 使用者（假設 userId = 1）創建預設偏好設定
INSERT INTO user_preferences ("userId", theme, language, timezone, "autoSave", notifications, "createdAt", "updatedAt")
VALUES (1, 'dark', 'zh-TW', 'Asia/Taipei', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("userId") DO NOTHING;

-- 為 user 使用者（假設 userId = 2）創建預設偏好設定
INSERT INTO user_preferences ("userId", theme, language, timezone, "autoSave", notifications, "createdAt", "updatedAt")
VALUES (2, 'light', 'en', 'UTC', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("userId") DO NOTHING;

-- =====================================
-- 3. 創建其他 general-service 可能需要的資料表
-- =====================================

-- 系統設定資料表（用於存放全局設定）
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGSERIAL PRIMARY KEY,
    "settingKey" VARCHAR(100) NOT NULL UNIQUE,
    "settingValue" TEXT,
    description VARCHAR(255),
    category VARCHAR(50) DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_system_settings_settingKey ON system_settings("settingKey");
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_isActive ON system_settings("isActive");

-- 插入一些預設系統設定
INSERT INTO system_settings ("settingKey", "settingValue", description, category, "isActive", "createdAt", "updatedAt")
VALUES 
    ('app.name', 'AIOT Management System', '應用程式名稱', 'general', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('app.version', '1.0.0', '應用程式版本', 'general', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maintenance.enabled', 'false', '維護模式開關', 'system', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('default.theme', 'light', '預設主題', 'ui', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('default.language', 'en', '預設語言', 'ui', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('session.timeout', '3600', '會話逾時時間（秒）', 'security', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('notification.email.enabled', 'true', '電子郵件通知開關', 'notification', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('notification.sms.enabled', 'false', '簡訊通知開關', 'notification', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("settingKey") DO NOTHING;

-- =====================================
-- 4. 創建更新時間觸發器
-- =====================================

-- 創建更新時間函數（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為表創建更新時間觸發器
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提交交易
COMMIT;

-- 顯示執行結果
SELECT 'User Preferences and General Service tables initialization completed successfully' AS status;

-- 驗證結果：顯示創建的資料表
\dt *preference*;
\dt *setting*;

-- 驗證結果：顯示預設的使用者偏好設定
SELECT 
    id,
    "userId",
    theme,
    language,
    timezone,
    "autoSave",
    notifications,
    "createdAt",
    "updatedAt"
FROM user_preferences
ORDER BY "userId";

-- 驗證結果：顯示系統設定
SELECT 
    id,
    "settingKey",
    "settingValue",
    description,
    category,
    "isActive"
FROM system_settings
WHERE "isActive" = TRUE
ORDER BY category, "settingKey";