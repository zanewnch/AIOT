# AIOT 項目配置 - Claude Code

## 開發環境配置

### 後端開發
- 後端使用 **hot-reload** 功能，代碼更改會自動重新加載
- **不需要重新啟動** `AIOT-be` 容器來應用代碼更改
- 只需要保存文件，後端會自動檢測並重新加載

### 前端開發  
- 前端也支持 hot-reload (Vite)
- 代碼更改會自動反映在瀏覽器中

### Docker 容器管理
- 只有在以下情況才需要重新啟動容器：
  - 環境變數更改
  - Dockerfile 更改
  - package.json 依賴更改
  - 數據庫模式更改

## API 開發規範

### 控制器回應格式
- 所有 API 端點必須使用 `ControllerResult` 類別
- 統一回應格式：`{ status: number, message: string, data?: any }`
- 避免直接使用 `res.json()` 或 `res.status().json()`

### 認證系統
- 使用 JWT + httpOnly cookie 認證機制
- `/api/auth/me` 端點用於檢查認證狀態
- 預設管理員帳號：`admin` / `admin`
- **重要**：前端初始化時的 401 錯誤是正常的（表示尚未登入）
- axios 攔截器已優化，不會在認證檢查時自動重定向

## 常用命令

### 測試 API 端點
```bash
# 登入
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' -c /tmp/cookies.txt

# 測試認證端點
curl -s http://localhost:8000/api/auth/me -b /tmp/cookies.txt

# 測試其他 API（需要認證）
curl -s http://localhost:8000/api/rbac/roles -b /tmp/cookies.txt
```

### 服務狀態檢查
```bash
# 檢查所有容器狀態
docker ps

# 檢查後端日誌
docker logs AIOT-be --tail=20

# 檢查前端日誌  
docker logs AIOT-fe --tail=20
```