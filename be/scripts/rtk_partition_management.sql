-- ========================================
-- RTK Data Table Partitioning Management
-- ========================================
-- 此腳本用於管理 RTK 資料表的分區
-- 包含新增分區、清理舊分區和維護功能

-- 1. 手動添加新分區的範例
-- 語法：ALTER TABLE rtk_data REORGANIZE PARTITION p_future INTO (...)
-- 範例：添加 2025年3月的分區
/*
ALTER TABLE rtk_data REORGANIZE PARTITION p_future INTO (
    PARTITION p202503 VALUES LESS THAN (202504),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
*/

-- 2. 查看當前分區狀態
SELECT 
    PARTITION_NAME as '分區名稱',
    PARTITION_DESCRIPTION as '分區範圍',
    TABLE_ROWS as '資料筆數',
    CASE 
        WHEN PARTITION_NAME = 'p_future' THEN '未來資料分區'
        ELSE CONCAT(
            SUBSTRING(PARTITION_NAME, 2, 4), '年',
            SUBSTRING(PARTITION_NAME, 6, 2), '月分區'
        )
    END as '分區說明'
FROM information_schema.PARTITIONS 
WHERE TABLE_SCHEMA = 'main_db' 
AND TABLE_NAME = 'rtk_data'
ORDER BY PARTITION_ORDINAL_POSITION;

-- 3. 檢查資料分佈情況
SELECT 
    YEAR(createdAt) as 年份,
    MONTH(createdAt) as 月份,
    COUNT(*) as 資料筆數,
    MIN(createdAt) as 最早資料,
    MAX(createdAt) as 最新資料
FROM rtk_data 
GROUP BY YEAR(createdAt), MONTH(createdAt)
ORDER BY 年份, 月份;

-- 4. 手動清理舊分區（謹慎使用！）
-- 語法：ALTER TABLE rtk_data DROP PARTITION partition_name;
-- 範例：刪除 2024年1月的分區（請確保資料已不需要）
/*
ALTER TABLE rtk_data DROP PARTITION p202401;
*/

-- 5. 驗證分區剪除（Partition Pruning）
-- 以下查詢會自動使用相應的分區，提升查詢效能
/*
EXPLAIN PARTITIONS 
SELECT * FROM rtk_data 
WHERE createdAt >= '2025-07-01' AND createdAt < '2025-08-01';
*/

-- 6. 建議的維護排程
-- 建議設置定期任務：
-- - 每月自動添加新分區
-- - 每季清理12個月前的舊分區
-- - 定期檢查分區狀態和資料分佈

-- 7. 效能優化建議
-- 確保查詢條件包含 createdAt 欄位以利用分區剪除
-- 範例：
/*
-- 好的查詢（會使用分區剪除）
SELECT * FROM rtk_data 
WHERE createdAt >= '2025-07-01' 
AND latitude BETWEEN 24.0 AND 26.0;

-- 不佳的查詢（無法使用分區剪除）
SELECT * FROM rtk_data 
WHERE latitude BETWEEN 24.0 AND 26.0;
*/