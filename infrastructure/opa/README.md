# AIOT 集中式權限管理系統 (OPA)

## 📋 概述

本系統基於 **Open Policy Agent (OPA)** 實現 AIOT 項目的集中式權限管理，為整個微服務架構提供統一的認證和授權策略。

## 🏗️ 架構設計

```
    用戶請求
        ↓
   Kong Gateway (JWT Plugin)
        ↓
   OPA 授權檢查 (Rego 策略)
        ↓
   決策結果 (Allow/Deny)
        ↓
   後端微服務
```

### 核心組件

| 組件 | 功能 | 端口 | 狀態 |
|------|------|------|------|
| **OPA Server** | 策略引擎和決策服務 | 8181 | ✅ 運行中 |
| **Bundle Server** | 策略包分發服務 | 8080 | ✅ 運行中 |
| **Policy Files** | Rego 語言編寫的授權規則 | - | ✅ 已配置 |
| **Data Files** | JSON 格式的用戶權限數據 | - | ✅ 已配置 |

## 🔐 實際功能說明

### 1. 網關級授權 (Gateway Policy)

**功能**：在 Kong Gateway 層面進行統一的認證和授權檢查

**處理的請求類型**：
- ✅ **認證端點**：`/api/auth/*` - 無需 JWT 驗證
- ✅ **健康檢查**：`/health` - 公開訪問
- ✅ **CORS 預檢**：`OPTIONS` 請求 - 自動允許
- ✅ **WebSocket 連接**：實時數據連接的權限控制

**策略文件**：`policies/gateway/gateway_policy.rego`

### 2. 微服務授權策略

#### 🏛️ RBAC Service 授權
```rego
# 管理員可以管理用戶、角色、權限
admin、superadmin、department_manager → 全權限
# 普通用戶只能訪問自己的資料
user → /api/rbac/me (GET only)
```

#### 🚁 Drone Service 授權
```rego
# 無人機操作權限分級
drone_operator → 指定無人機控制
flight_controller → 飛行控制權限
drone_admin → 完整無人機管理
monitor_operator → 實時監控訪問
```

#### ⚙️ Frontend Settings 授權
```rego
# 前端設定管理
user、admin、superadmin → 用戶偏好設定
```

#### 🤖 LLM Service 授權
```rego
# AI 服務訪問權限
user、admin、researcher → 文字生成和對話功能
```

### 3. 用戶角色系統

#### 👥 預設用戶清單

| 用戶名 | 角色 | 權限等級 | 部門 | 用途 |
|--------|------|----------|------|------|
| `superadmin` | superadmin | 10 | 系統部 | 系統最高權限 |
| `admin` | admin | 8 | 系統部 | 系統管理 |
| `drone_admin` | drone_admin | 8 | 無人機部 | 無人機系統管理 |
| `pilot_001` | drone_operator, flight_controller | 5 | 無人機部 | 飛行操作 |
| `mission_cmd` | mission_commander | 7 | 無人機部 | 任務指揮 |
| `maintenance_tech` | maintenance_technician | 4 | 維護部 | 設備維護 |
| `monitor_op` | monitor_operator | 2 | 系統部 | 監控操作 |
| `dept_manager` | department_manager | 6 | 無人機部 | 部門管理 |
| `regular_user` | user | 1 | 無人機部 | 一般用戶 |
| `emergency_user` | user, emergency_responder | 3 | 維護部 | 緊急應變 |

#### 🎯 角色權限矩陣

| 角色 | 權限範圍 | 主要功能 |
|------|----------|----------|
| **superadmin** | 全系統權限 | 系統配置、所有管理功能 |
| **admin** | 用戶、角色、權限管理 | 系統管理、審計日誌 |
| **drone_admin** | 無人機系統管理 | 無人機 CRUD、命令控制 |
| **department_manager** | 部門內用戶管理 | 部門報告、用戶管理 |
| **flight_controller** | 飛行控制 | 無人機命令、狀態監控 |
| **drone_operator** | 指定無人機操作 | 分配無人機控制 |
| **mission_commander** | 任務管理 | 任務 CRUD、歸檔管理 |
| **maintenance_technician** | 維護操作 | 設備維護、診斷 |
| **monitor_operator** | 系統監控 | 狀態監控、警報 |
| **emergency_responder** | 緊急權限 | 緊急覆蓋、警報創建 |
| **user** | 基本用戶權限 | 個人資料、偏好設定 |

## 🚀 當前部署狀態

### Docker 容器狀態
```bash
# OPA 策略引擎
aiot-opa → openpolicyagent/opa:latest-envoy (端口: 8181, 9191)
狀態: 運行中 (unhealthy - 需要策略加載)

# Bundle 分發服務器
aiot-opa-bundle-server → nginx:alpine (端口: 8080)
狀態: 運行中 ✅
```

### API 端點
```bash
# OPA 健康檢查
GET http://localhost:8181/health

# 策略決策查詢
POST http://localhost:8181/v1/data/aiot/gateway/allow

# Bundle 服務器
GET http://localhost:8080/bundles/aiot.tar.gz

# 策略列表
GET http://localhost:8181/v1/policies
```

## 🔧 實際配置詳情

### 1. Kong Gateway 整合

**JWT 插件配置**：
- JWT Token 解析用戶信息
- 提取用戶 ID 和角色到 Headers
- 設置 `x-consumer-custom-id` 和 `x-consumer-username`

**OPA 插件配置**：
```yaml
plugins:
  - name: opa
    config:
      opa_url: "http://aiot-opa:8181"
      policy_path: "/v1/data/aiot/gateway/allow"
```

### 2. 策略快取與性能

**快取配置**：
- 內置函數快取：100MB
- 查詢結果快取：啟用
- Bundle 輪詢：10-30 秒間隔

**監控指標**：
- Prometheus 指標導出
- 決策日誌記錄
- 性能統計

### 3. 安全機制

**預設拒絕原則**：
```rego
default allow = false
```

**審計要求**：
- 所有 POST/PUT/DELETE 操作記錄
- 管理員操作強制審計
- 詳細的拒絕原因輸出

## 📊 使用統計

### 當前保護的服務
- ✅ **RBAC Service** (端口: 50051) - 用戶角色管理
- ✅ **Drone Service** (端口: 50052) - 無人機控制
- ✅ **General Service** (端口: 50053) - 通用服務
- ✅ **Docs Service** (端口: 50054) - 文檔服務
- 🔄 **LLM Service** (端口: 8022) - AI 聊天服務 (可選)

## 🚀 測試和驗證

### 基本功能測試

```bash
# 1. 檢查 OPA 服務狀態
curl http://localhost:8181/health

# 2. 測試管理員權限
curl -X POST http://localhost:8181/v1/data/aiot/gateway/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "service": {"name": "rbac-service"},
      "request": {"path": "/api/rbac/users", "method": "GET", "headers": {"x-consumer-custom-id": "2"}},
      "jwt": {"user": {"id": 2, "roles": ["admin"]}}
    }
  }'

# 3. 測試一般用戶權限 (應該被拒絕)
curl -X POST http://localhost:8181/v1/data/aiot/gateway/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "service": {"name": "rbac-service"},
      "request": {"path": "/api/rbac/users", "method": "POST", "headers": {"x-consumer-custom-id": "9"}},
      "jwt": {"user": {"id": 9, "roles": ["user"]}}
    }
  }'
```

---

**最後更新**：2025-08-16  
**版本**：v2.0  
**維護者**：AIOT Development Team