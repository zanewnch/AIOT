-- =====================================================
-- AIOT RBAC 使用者資料表虛擬資料插入腳本
-- =====================================================
-- 此腳本檢查使用者資料表筆數，如果少於 100 筆記錄
-- 則插入虛擬資料

-- users table
-- =====================================================
-- 資料表欄位說明 (Table Columns):
-- - id: 主鍵識別碼 (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
-- - username: 使用者名稱 (VARCHAR(100), UNIQUE, NOT NULL) - 登入用的唯一識別名稱
-- - passwordHash: 密碼雜湊值 (VARCHAR(255), NOT NULL) - 加密後的使用者密碼
-- - email: 電子郵件 (VARCHAR(255), UNIQUE, NOT NULL) - 使用者電子郵件地址
-- - isActive: 帳號啟用狀態 (BOOLEAN, DEFAULT TRUE) - 是否為啟用狀態
-- - lastLoginAt: 最後登入時間 (TIMESTAMP, NULL) - 最後一次登入的時間戳記
-- - createdAt: 建立時間 (TIMESTAMP, AUTO) - 帳號建立時間戳記，自動管理
-- - updatedAt: 更新時間 (TIMESTAMP, AUTO) - 帳號更新時間戳記，自動維護
-- =====================================================

USE rbac_db;

-- 建立預存程序來處理條件式插入
DELIMITER $$

DROP PROCEDURE IF EXISTS InsertDummyUsers$$

CREATE PROCEDURE InsertDummyUsers()
BEGIN
    DECLARE current_count INT DEFAULT 0;
    DECLARE records_to_insert INT DEFAULT 0;
    DECLARE counter INT DEFAULT 1;
    DECLARE random_username VARCHAR(100);
    DECLARE random_email VARCHAR(255);
    DECLARE password_hash VARCHAR(255);

    -- 查詢目前使用者資料表筆數
    SELECT COUNT(*) INTO current_count FROM users;

    -- 如果目前筆數少於 100，計算需要插入的記錄數
    IF current_count < 100 THEN
        SET records_to_insert = 100 - current_count;

        -- 開始插入虛擬資料
        SET counter = current_count + 1;

        WHILE counter <= 100 DO
            -- 產生隨機使用者名稱（避免重複）
            SET random_username = CONCAT('user_', LPAD(counter, 3, '0'));

            -- 產生隨機電子郵件
            SET random_email = CONCAT(random_username, '@example.com');

            -- 使用固定密碼雜湊（簡單雜湊，生產環境應使用 bcrypt）
            -- 密碼 'password123' 的簡單雜湊
            SET password_hash = '$2b$10$rOyFbMR5lJTmJGv6PD8VUeN0VjH8pJBa3hVrKjY2LqX4.Ck9D5vFO';

            -- 插入使用者資料
            INSERT INTO users (username, passwordHash, email, createdAt, updatedAt)
            VALUES (
                random_username,
                password_hash,
                random_email,
                NOW(),
                NOW()
            );

            SET counter = counter + 1;
        END WHILE;

        -- 輸出插入結果
        SELECT CONCAT('Inserted ', records_to_insert, ' dummy user records. Current total: ', (SELECT COUNT(*) FROM users)) AS result;
    ELSE
        -- 如果資料充足，輸出訊息
        SELECT CONCAT('User data is sufficient. Current count: ', current_count, ' records. No additional insertion needed.') AS result;
    END IF;

END$$

DELIMITER ;

-- 執行預存程序
CALL InsertDummyUsers();

-- 驗證插入結果
SELECT
    COUNT(*) as total_users,
    MIN(createdAt) as earliest_user,
    MAX(createdAt) as latest_user
FROM users;

-- 顯示虛擬使用者資料範例
SELECT
    id,
    username,
    email,
    createdAt
FROM users
WHERE username LIKE 'user_%'
ORDER BY id
LIMIT 10;

-- 清理預存程序（可選）
-- DROP PROCEDURE IF EXISTS InsertDummyUsers;