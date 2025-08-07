# RTK Data Table Partitioning 指南

## 概述

RTK 資料表已設置為按月分區（Monthly Partitioning），以提升大量資料的查詢效能和維護效率。

## 📊 分區設計

### 分區策略
- **分區類型**: RANGE Partitioning by Month
- **分區鍵**: `YEAR(createdAt) * 100 + MONTH(createdAt)`
- **分區粒度**: 按月分區（每月一個分區）

### 表結構
```sql
CREATE TABLE rtk_data (
    id BIGINT NOT NULL AUTO_INCREMENT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id, createdAt),
    KEY idx_created_at (createdAt),
    KEY idx_coordinates (latitude, longitude)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(createdAt) * 100 + MONTH(createdAt))
```

## 🎯 效能優化

### 分區剪除 (Partition Pruning)
查詢時務必包含時間條件以利用分區剪除：

```sql
-- ✅ 好的查詢（使用分區剪除）
SELECT * FROM rtk_data 
WHERE createdAt >= '2025-07-01' 
AND createdAt < '2025-08-01'
AND latitude BETWEEN 24.0 AND 26.0;

-- ❌ 不佳的查詢（掃描所有分區）
SELECT * FROM rtk_data 
WHERE latitude BETWEEN 24.0 AND 26.0;
```

### 查詢效能驗證
```sql
-- 檢查是否使用分區剪除
EXPLAIN PARTITIONS 
SELECT * FROM rtk_data 
WHERE createdAt >= '2025-07-01' AND createdAt < '2025-08-01';
```

## 🔧 分區管理

### 查看分區狀態
```sql
SELECT 
    PARTITION_NAME,
    PARTITION_DESCRIPTION,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.PARTITIONS 
WHERE TABLE_SCHEMA = 'main_db' 
AND TABLE_NAME = 'rtk_data'
ORDER BY PARTITION_ORDINAL_POSITION;
```

### 手動添加新分區
```sql
-- 添加 2025年8月分區
ALTER TABLE rtk_data REORGANIZE PARTITION p_future INTO (
    PARTITION p202508 VALUES LESS THAN (202509),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 清理舊分區
```sql
-- ⚠️ 謹慎操作：刪除舊分區會永久刪除資料
ALTER TABLE rtk_data DROP PARTITION p202401;
```

## 📅 維護建議

### 定期維護任務
1. **每月執行**: 添加下個月的分區
2. **每季執行**: 清理12個月前的舊分區
3. **每週檢查**: 監控分區資料分佈

### 使用管理腳本
```bash
# 執行分區管理腳本
docker exec AIOT-mysqldb mysql -u admin -padmin -D main_db < scripts/rtk_partition_management.sql
```

## 🎨 TypeScript 模型更新

RTKDataModel 已更新，包含明確的時間欄位：

```typescript
export type RTKDataAttributes = {
    id: number;
    latitude: number;
    longitude: number;
    createdAt: Date;  // 📅 用於分區
    updatedAt: Date;
};

@Table({ tableName: 'rtk_data', timestamps: true })
export class RTKDataModel extends Model<RTKDataAttributes, RTKDataCreationAttributes> {
    @CreatedAt
    @Column(DataType.DATE)
    declare createdAt: Date;

    @UpdatedAt
    @Column(DataType.DATE)
    declare updatedAt: Date;
}
```

## 📈 資料插入範例

```typescript
// 建立 RTK 資料（時間會自動設置）
const rtkData = await RTKDataModel.create({
    latitude: 25.033964,
    longitude: 121.564468
});

// 會自動放入對應月份的分區
```

## 🔍 監控與診斷

### 檢查資料分佈
```sql
SELECT 
    YEAR(createdAt) as 年份,
    MONTH(createdAt) as 月份,
    COUNT(*) as 資料筆數
FROM rtk_data 
GROUP BY YEAR(createdAt), MONTH(createdAt)
ORDER BY 年份, 月份;
```

### 分區大小監控
```sql
SELECT 
    PARTITION_NAME,
    ROUND(DATA_LENGTH/1024/1024, 2) as 'Size(MB)',
    TABLE_ROWS
FROM information_schema.PARTITIONS 
WHERE TABLE_SCHEMA = 'main_db' 
AND TABLE_NAME = 'rtk_data'
AND PARTITION_NAME IS NOT NULL;
```

## ⚡ 效能預期

### 查詢效能提升
- **時間範圍查詢**: 50-90% 效能提升
- **單月資料查詢**: 接近線性效能
- **歷史資料分析**: 大幅度效能提升

### 維護效率
- **索引重建**: 只需重建單一分區
- **資料清理**: 直接刪除整個分區
- **備份恢復**: 可按分區進行

## 🚨 注意事項

1. **主鍵限制**: 分區鍵 `createdAt` 必須包含在主鍵中
2. **查詢最佳化**: 盡量在 WHERE 條件中包含時間範圍
3. **分區維護**: 定期添加新分區，避免資料落入 p_future
4. **資料備份**: 清理分區前務必確認資料已備份

## 📝 相關檔案

- 模型定義: `src/models/RTKDataModel.ts`
- 管理腳本: `scripts/rtk_partition_management.sql`
- 類型定義: `src/types/repositories/IRTKInitRepository.ts`