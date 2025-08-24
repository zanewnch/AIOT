# AIOT Database Migration 系統

## 📋 概覽

本系統使用 Sequelize CLI 實現資料庫版本控制和遷移管理，為 AIOT 微服務架構提供一致的資料庫schema管理。

## 🏗️ 架構設計

### 服務分離策略

每個微服務維護自己的遷移文件，確保獨立部署和版本管理：

```
migrations/
├── rbac-service/          # RBAC 權限管理
├── drone-service/         # 無人機數據管理
├── general-service/       # 用戶偏好設定
├── auth-service/          # 認證服務
├── drone-websocket/       # WebSocket 即時服務
└── shared/               # 共享工具和配置
```

### 資料庫對應關係

| 微服務 | 資料庫 | 端口 | 主要功能 |
|--------|--------|------|----------|
| **RBAC Service** | main_db | 5432 | 用戶、角色、權限管理 |
| **Auth Service** | main_db | 5432 | 認證、會話管理 |
| **Drone Service** | drone_db | 5433 | 無人機狀態、位置、指令 |
| **Drone WebSocket** | drone_db | 5434 | 即時數據推送 |
| **General Service** | user_preference_db | 5435 | 用戶偏好、系統設定 |

## 🚀 使用方式

### 1. 創建新遷移

```bash
# RBAC Service 遷移
cd infrastructure/database/migrations/rbac-service
npx sequelize-cli migration:generate --name add-user-avatar-field

# Drone Service 遷移
cd infrastructure/database/migrations/drone-service
npx sequelize-cli migration:generate --name create-drone-battery-table
```

### 2. 執行遷移

```bash
# 執行單一服務遷移
./migrate.sh rbac-service up

# 執行所有服務遷移
./migrate-all.sh up

# 回滾遷移
./migrate.sh drone-service down
```

### 3. 檢查遷移狀態

```bash
# 檢查遷移狀態
./status.sh rbac-service

# 檢查所有服務狀態
./status-all.sh
```

## 📁 文件結構

### 遷移文件命名規範

```
YYYYMMDDHHMMSS-descriptive-name.js
例如：20250824120000-create-users-table.js
```

### 配置文件結構

```javascript
module.exports = {
  development: {
    database: 'main_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  production: {
    // 生產環境配置
  }
}
```

## 🔧 最佳實踐

### 1. 遷移文件編寫原則

- **向前相容**：確保新遷移不會破壞既有功能
- **原子性操作**：每個遷移應該是完整的單元
- **可回滾**：提供完整的 `down` 方法
- **測試驗證**：在開發環境充分測試

### 2. Schema 變更指導

- **添加欄位**：使用 `DEFAULT` 值或 `NULL` 允許
- **刪除欄位**：分階段進行（deprecated → 移除）
- **重命名欄位**：使用遷移而非直接重命名
- **索引管理**：與相關欄位同步創建

### 3. 數據遷移策略

- **大量數據**：分批處理避免鎖表
- **關鍵數據**：提供備份和驗證機制
- **時間窗口**：選擇低峰時段執行

## ⚠️ 注意事項

### 1. 生產環境部署

- **備份優先**：執行前完整備份資料庫
- **測試驗證**：在相同數據的測試環境驗證
- **監控計畫**：準備回滾計畫和監控指標
- **分階段部署**：逐步部署避免全面影響

### 2. 開發環境管理

- **保持同步**：定期同步最新遷移
- **清理測試**：定期重置開發資料庫
- **版本控制**：遷移文件納入版本控制

## 🔍 故障排除

### 常見問題

1. **遷移失敗**
   ```bash
   # 檢查資料庫連接
   ./check-connection.sh rbac-service
   
   # 查看詳細錯誤
   ./migrate.sh rbac-service up --verbose
   ```

2. **版本衝突**
   ```bash
   # 檢查當前版本
   ./status.sh rbac-service
   
   # 手動修復版本表
   ./repair-version.sh rbac-service
   ```

3. **回滾問題**
   ```bash
   # 強制重置到特定版本
   ./reset-to-version.sh rbac-service 20250824120000
   ```

## 📊 監控和日誌

### 遷移日誌

所有遷移操作都會記錄到：
- `logs/migrations/[service]-[timestamp].log`
- 資料庫 `SequelizeMeta` 表
- Docker 容器日誌

### 性能監控

- 遷移執行時間追蹤
- 資料庫連接池狀態
- 磁碟空間使用監控

---

*最後更新：2025-08-24*  
*版本：v1.0*  
*維護者：AIOT Development Team*