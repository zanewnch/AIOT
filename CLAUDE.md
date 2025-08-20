# AIOT 項目配置 - Claude Code

## 目錄

1. [語言偏好設定](#語言偏好設定)
2. [系統架構配置](#系統架構配置)
3. [LLM AI 引擎架構](#llm-ai-引擎架構)
4. [開發環境配置](#開發環境配置)
5. [代碼開發規範](#代碼開發規範)
6. [測試與診斷策略](#測試與診斷策略)
7. [API 開發規範](#api-開發規範)
8. [常用命令參考](#常用命令參考)

---

## 語言偏好設定

- **如果用戶使用繁體中文輸入，請用繁體中文回答**
- **If user inputs in English, respond in English**
- 根據用戶的輸入語言自動調整回應語言

---

## 系統架構配置

### 部署環境架構

- **開發環境**：使用 **Docker Compose** 進行本地開發和測試
- **生產環境**：使用 **Kubernetes (K8s)** 進行正式部署
- **效能限制**：由於電腦效能限制，Docker Compose 和 K8s 只能同時開啟其中一個
- **API Gateway**：所有 microservice 預設使用 Express.js API Gateway
- **服務間通訊**：API Gateway 與各個 microservice 之間使用 gRPC 連線
- **HTTP 到 gRPC 轉換**：API Gateway 配置了 grpc-gateway 插件，可將 HTTP 請求轉換為 gRPC
- **健康檢查**：如有 health detection 需求，可透過 API Gateway 的 grpc-gateway 進行檢查

### 環境切換指南

```bash
# 開發環境：啟動 Docker Compose
docker-compose up -d

# 生產環境：部署到 Kubernetes
kubectl apply -f infrastructure/kubernetes/

# 環境檢查
docker ps                    # 檢查 Docker Compose 容器
kubectl get pods            # 檢查 K8s Pod 狀態
```

### 微服務架構

```
API Gateway (Port: 8000)
├── RBAC Service (gRPC)
├── Drone Service (gRPC)  
├── General Service (gRPC)
├── Docs Service (gRPC)
├── LLM Service (HTTP API)
└── LLM AI Engine (Internal)
```

---

## LLM AI 引擎架構

### 分離式架構設計

```
┌─────────────────────────┐    HTTP API    ┌─────────────────────────┐
│   Django LLM Service    │ ◄─────────────► │   FastAPI AI Engine     │
│   (Port: 8020)          │                 │   (Port: 8021)          │
├─────────────────────────┤                 ├─────────────────────────┤
│ - REST API 端點         │                 │ - SmolLM2 模型推理      │
│ - 請求驗證/認證         │                 │ - 對話記憶管理          │
│ - 回應格式化            │                 │ - 串流生成支援          │
│ - 業務邏輯處理          │                 │ - 健康檢查監控          │
│ - 文檔上傳處理          │                 │ - GPU/CPU 資源管理      │
└─────────────────────────┘                 └─────────────────────────┘
```

### AI 模型配置

- **模型**：HuggingFaceTB/SmolLM2-135M-Instruct
- **參數量**：135M（輕量級，適合 CPU 推理）
- **功能**：指令跟隨、對話生成、文本理解
- **推理環境**：CPU 優化，約 10-20 秒回應時間
- **語言支援**：英文為主，基礎中文理解

### 服務端點

```bash
# AI Engine 直接端點
GET  /health                    # 健康檢查
POST /generate                  # 單輪文字生成
POST /conversational           # 對話記憶生成
POST /stream                   # 串流回應
POST /documents               # RAG 文檔上傳（未啟用）

# Django API 層端點
POST /api/transformers/generate/      # 統一生成介面
POST /api/transformers/conversation/  # 對話介面
GET  /api/transformers/health/       # 健康狀態
POST /api/transformers/stream/       # 串流介面
```

---

## 開發環境配置

### 後端開發

- 後端使用 **hot-reload** 功能，代碼更改會自動重新加載
- **不需要重新啟動** `AIOT-be` 容器來應用代碼更改
- 只需要保存文件，後端會自動檢測並重新加載

### LLM 服務開發

- **Django LLM Service**：使用 SQLite 本地開發，虛擬環境隔離
- **FastAPI AI Engine**：獨立虛擬環境，CPU 推理優化
- **模型載入**：首次啟動需下載模型，約 1-2 分鐘
- **記憶體需求**：SmolLM2-135M 約需 1GB RAM

### 前端開發

- 前端也支持 hot-reload (Vite)
- 代碼更改會自動反映在瀏覽器中

### Docker 容器管理

- 只有在以下情況才需要重新啟動容器：
    - 環境變數更改
    - Dockerfile 更改
    - package.json 依賴更改
    - 數據庫模式更改

### Docker 容器調試策略

**重要原則：避免頻繁重啟容器，優先容器內調試**

#### 第一步：檢查容器日誌

```bash
# 檢查容器日誌（最近 50 行）
docker logs CONTAINER_NAME --tail=50 -f

# 常用容器日誌檢查
docker logs AIOT-be --tail=50 -f           # 後端服務
docker logs AIOT-feSetting --tail=50 -f    # 前端服務  
docker logs AIOT-drone --tail=50 -f        # Drone 服務
docker logs AIOT-rbac --tail=50 -f         # RBAC 服務
```

#### 第二步：進入容器內部調試

**如果發現編譯錯誤（TypeScript/Python），直接進容器修復：**

```bash
# 進入後端容器
docker exec -it AIOT-be /bin/bash

# 進入容器後直接編譯測試
npm run build                    # TypeScript 編譯
npx tsc --noEmit                # 只檢查類型錯誤
npm run lint                    # 代碼檢查

# Python 服務編譯檢查
python -m py_compile *.py       # Python 語法檢查
python manage.py check          # Django 專案檢查
```

#### 調試工作流程

1. **容器日誌分析** → 2. **容器內編譯修復** → 3. **確認無誤後重啟容器**

```bash
# 調試流程範例
# 1. 檢查日誌發現 TypeScript 編譯錯誤
docker logs AIOT-be --tail=20

# 2. 進入容器調試
docker exec -it AIOT-be /bin/bash
cd /app && npm run build        # 直到編譯成功

# 3. 退出容器並重啟（只在確認修復後）
exit
docker restart AIOT-be
```

#### 常見調試場景

```bash
# TypeScript 編譯錯誤
docker exec -it CONTAINER_NAME bash -c "cd /app && npx tsc"

# Python 語法錯誤  
docker exec -it CONTAINER_NAME bash -c "python -m py_compile src/*.py"

# Django 模型檢查
docker exec -it CONTAINER_NAME bash -c "python manage.py check"

# 依賴問題檢查
docker exec -it CONTAINER_NAME bash -c "npm install" # 或 pip install
```

#### 效率提升技巧

- **避免**：發現錯誤 → 立即重啟容器 → 檢查 → 再次重啟
- **推薦**：檢查日誌 → 容器內修復 → 批量測試 → 最後重啟
- **批量操作**：一次性修復多個編譯錯誤，減少重啟次數
- **持續監控**：使用 `-f` 參數即時查看日誌變化

---

## 代碼開發規範

### 結構一致性原則

- **在新建或修改文件時，先查找相同前綴或後綴的現有文件**
- **分析現有文件的結構模式**：
    - 是否使用 class 還是 function
    - 常數定義方式（extract constants）
    - 靜態方法的使用
    - 導入/導出模式
    - 註釋和文檔風格
- **保持相同類型文件的結構一致性**
- **遵循現有的命名慣例和組織模式**

### 模組導出規範

**對於有多個文件的資料夾，必須使用統一導出文件**

- **Python**：使用 `__init__.py`
  ```python
  # models/__init__.py
  from .user import User
  from .role import Role
  from .permission import Permission
  
  __all__ = ['User', 'Role', 'Permission']
  ```

- **TypeScript/JavaScript**：使用 `index.ts` 或 `index.js`
  ```typescript
  // services/index.ts
  export { UserService } from './userService';
  export { RoleService } from './roleService';
  export { AuthService } from './authService';
  
  // 或者使用 re-export
  export * from './userService';
  export * from './roleService';
  ```

- **Go**：使用主要的 package 文件或遵循 Go modules 慣例
  ```go
  // main.go 或 package 主文件
  package services
  
  // 統一導出所有服務
  ```

- **其他語言**：遵循該語言/框架的 convention
    - **React**：`index.ts/js` 導出組件
    - **Vue**：`index.ts/js` 導出組件和 composables
    - **Node.js**：`index.js` 作為模組入口點
    - **Django**：`__init__.py` 導出模型和視圖

### 導出文件的好處

- **簡化導入**：`from models import User` 而不是 `from models.user import User`
- **統一介面**：單一入口點管理所有導出
- **重構友善**：內部文件重組不影響外部導入
- **IDE 支援**：更好的自動完成和類型檢查

### 技術堅持與調試原則

**核心原則：堅持既定技術棧，優先修復而非替換**

- **技術棧堅持**：
    - 如果選用了適當的技術棧，就應該保持並深入調試
    - **microservice 必須使用 gRPC**：如果 gRPC 配置有問題，修復 gRPC 配置，不要改成 HTTP
    - **依賴注入堅持 InversifyJS**：如果 InversifyJS 配置有問題，修好它，不要刪除整個 InversifyJS
    - **資料庫 ORM 堅持**：如果 TypeORM 或 Django ORM 有問題，調試配置，不要改用原生 SQL
    - **前端框架堅持**：如果 React/Vue 組件有問題，修復組件邏輯，不要回退到 jQuery

- **調試優先級**：
    1. **配置修復** > 框架替換
    2. **深入調試** > 快速繞過
    3. **根本解決** > 臨時方案
    4. **學習提升** > 避免困難
    5. **多次失敗後的判斷流程**：
        - 如果嘗試多個 debug 方法都還是失敗
        - 先思考：**這個 stack 是必要的嗎？**
        - 如果判斷是**必要的** → 堅持下去，不考慮 alternative
        - 如果判斷**不是必要的** → 才考慮使用 alternative

- **禁止的逃避行為**：
    - ❌ gRPC 有問題 → 改用 HTTP API
    - ❌ InversifyJS 複雜 → 刪除依賴注入
    - ❌ TypeScript 編譯錯誤 → 改用 JavaScript
    - ❌ Docker 網路問題 → 改用本地部署
    - ❌ Kubernetes 配置複雜 → 只用 Docker Compose

- **正確的處理方式**：
    - ✅ gRPC 配置問題 → 檢查 proto 文件、端口配置、服務註冊
    - ✅ InversifyJS 錯誤 → 檢查容器綁定、循環依賴、接口實現
    - ✅ TypeScript 類型錯誤 → 補充類型定義、修正類型註解
    - ✅ Docker 網路問題 → 檢查網路配置、端口映射、服務發現
    - ✅ K8s 部署失敗 → 檢查 YAML 配置、資源限制、健康檢查

- **新技術導入原則**：
    - **禁止生成範例代碼**：如果用戶新加入套件或新套用某個 dependency/concept，不要主動產生 example code
    - **現有代碼優先**：先分析現有代碼結構和使用模式
    - **遵循既有模式**：按照專案中已有的模式來整合新技術
    - **詢問後實作**：確認用戶需求和整合方式後再進行實際實作

- **嚴格禁止的命名模式**：
    - **禁止創建 simple 版本文件**：絕對不要創建任何 `*-simple.js`、`*-simple.py`、`simple-*`、`app-simple` 等文件
    - **直接修改原文件**：如果需要修改功能，直接修改原始文件，不要創建簡化版本
    - **避免臨時文件**：不要創建 `temp-*`、`test-*`、`backup-*` 等臨時文件
    - **一步到位**：實作時就要考慮完整性，不要先做簡化版再升級

### 文檔註解規範

**強制要求：所有語言都必須有完整的文檔註解**

- **Python**：
    - 必須使用 **docstring** 格式
    - 所有函數、類別、模組都必須有文檔字串
    - 格式：Google Style 或 NumPy Style
  ```python
  def function_name(param1: str, param2: int) -> bool:
      """
      函數的簡短描述。
      
      Args:
          param1: 參數1的描述
          param2: 參數2的描述
          
      Returns:
          返回值的描述
          
      Raises:
          ValueError: 異常情況的描述
      """
  ```

- **TypeScript/JavaScript**：
    - 必須使用 **TSDoc** 格式（JSDoc 兼容）
    - 所有函數、類別、介面都必須有文檔註解
  ```typescript
  /**
   * 函數的簡短描述。
   * 
   * @param param1 - 參數1的描述
   * @param param2 - 參數2的描述
   * @returns 返回值的描述
   * @throws 異常情況的描述
   * 
   * @example
   * ```typescript
   * const result = functionName('test', 123);
   * ```
  */
  function functionName(param1: string, param2: number): boolean {
  // 實現
  }
  ```

- **Go**：
    - 必須使用 **Go doc comments** 格式
    - 所有公開的函數、類型、常數都必須有註解
  ```go
  // FunctionName 函數的簡短描述。
  // 詳細描述功能和使用方式。
  func FunctionName(param1 string, param2 int) bool {
      // 實現
  }
  ```

### Python 類型註解規範

- **強制要求**：所有 Python 文件必須包含完整的 type hints
- **函數註解**：所有函數和方法都必須有參數類型和返回類型註解
- **變數註解**：複雜的變數類型必須明確註解
- **導入要求**：必須從 `typing` 模組導入所需的類型（如 `Optional`, `List`, `Dict`, `Any` 等）

### LLM 服務開發規範

- **AI Engine**：使用 FastAPI + Pydantic 進行 API 設計
- **模型服務**：採用 Repository Pattern 分離業務邏輯
- **錯誤處理**：統一異常處理和日誌記錄
- **配置管理**：使用 dataclass 管理模型參數

### Obsidian 筆記規範

**重要規則：obsidian 資料夾內的 MD 文件必須使用 Obsidian syntax**

- **待辦事項格式**：
    - 使用 `- [ ]` 創建可點擊的 checkbox
    - 支援巢狀結構：`  - [ ]` （兩個空格縮排）
    - 完成狀態：`- [x]` 或 `- [X]`

- **標籤系統**：
    - 使用 `#標籤名稱` 格式（不需要空格）
    - 範例：`#AIOT #microservices #kubernetes #docker`
    - 支援巢狀標籤：`#項目/AIOT` 或 `#技術/kubernetes`

- **連結語法**：
    - 內部連結：`[[文件名稱]]` 或 `[[文件名稱|顯示文字]]`
    - 區塊連結：`[[文件名稱#標題]]`
    - 嵌入內容：`![[文件名稱]]`

- **特殊語法**：
    - 日期格式：使用 `YYYY-MM-DD` 格式
    - 時間戳記：`[[2025-08-16]]` 會自動連結到日期筆記
    - 高亮文字：`==重要文字==`
    - 刪除線：`~~刪除文字~~`

- **筆記結構建議**：
  ```markdown
  # 筆記標題
  
  ## 🎯 主要任務
  - [ ] 任務一
    - [ ] 子任務 1.1
    - [ ] 子任務 1.2
  
  ## 📋 詳細內容
  
  ## 🏷️ 標籤
  #標籤1 #標籤2 #標籤3
  
  ## 📅 時程規劃
  
  ---
  *最後更新: [[2025-08-16]]*
  ```

- **文件命名規範**：
    - 日期筆記：`YYYY-MM-DD.md`
    - 專案筆記：`project-name.md`
    - 會議紀錄：`meeting-YYYY-MM-DD.md`
    - 學習筆記：`learning-topic.md`

---

## 測試與診斷策略

### IDE 診斷功能

- **使用 IDE 診斷功能檢查錯誤**：
    - 直接運行 `mcp__ide__getDiagnostics` 檢查語法和類型錯誤
    - 無需啟動完整服務來檢測基本問題

### 建置命令測試

- **使用建置命令測試服務器問題**：
    - 後端：使用 `npm run build` 或 `npx tsc` 檢查 TypeScript 編譯錯誤
    - 前端：使用 `npm run build` 檢查 Vite 建置問題
    - **優先使用建置命令，避免每次都啟動完整服務器**

### 分層測試方法

1. **IDE 診斷** → 2. **建置測試** → 3. **只有在必要時才啟動服務器**

### LLM 服務測試策略

- **模型載入測試**：檢查健康端點確認模型正常載入
- **推理功能測試**：使用簡短 prompt 測試基本生成功能
- **性能測試**：監控回應時間和資源使用情況
- **端到端測試**：驗證 Django → FastAPI → 模型的完整鏈路

---

## API 開發規範

### 控制器回應格式

- 所有 API 端點必須使用 `ResResult` 類別
- 統一回應格式：`{ status: number, message: string, data?: any }`
- 避免直接使用 `res.json()` 或 `res.status().json()`

### 認證系統

- 使用 JWT + httpOnly cookie 認證機制
- `/api/auth/me` 端點用於檢查認證狀態
- 預設管理員帳號：`admin` / `admin`
- **重要**：前端初始化時的 401 錯誤是正常的（表示尚未登入）
- axios 攔截器已優化，不會在認證檢查時自動重定向

### LLM API 規範

- **請求格式**：統一使用 JSON，包含 `prompt`、`use_rag`、`image_url` 字段
- **回應格式**：包含 `success`、`response`、`sources`、`model` 字段
- **錯誤處理**：詳細錯誤訊息和狀態碼
- **超時設置**：長時間推理請求需要適當的超時配置

---

## 常用命令參考

### 基礎 API 測試

```bash
# 登入
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' -c /tmp/cookies.txt

# 測試認證端點
curl -s http://localhost:8000/api/auth/me -b /tmp/cookies.txt

# 測試其他 API（需要認證）
curl -s http://localhost:8000/api/rbac/roles -b /tmp/cookies.txt
```

### LLM 服務測試

```bash
# AI Engine 健康檢查
curl -X GET http://localhost:8021/health

# 直接測試 AI Engine 生成
curl -X POST http://localhost:8021/generate -H "Content-Type: application/json" -d '{"prompt":"Hello","use_rag":false}'

# 測試對話功能
curl -X POST http://localhost:8021/conversational -H "Content-Type: application/json" -d '{"prompt":"What is your name?","use_rag":false}'

# 測試 Django API 層
curl -X POST http://localhost:8022/api/transformers/generate/ -H "Content-Type: application/json" -d '{"prompt":"What is AI?","use_rag":false}'
```

### 服務狀態檢查

```bash
# 檢查所有容器狀態
docker ps

# 檢查後端日誌
docker logs AIOT-be --tail=20

# 檢查前端日誌  
docker logs AIOT-feSetting --tail=20

# 檢查 LLM 服務狀態
curl http://localhost:8021/health
curl http://localhost:8022/api/transformers/health/
```

### Docker 容器調試命令

```bash
# 容器日誌監控（即時顯示）
docker logs AIOT-be -f --tail=50
docker logs AIOT-drone -f --tail=50
docker logs AIOT-rbac -f --tail=50

# 進入容器調試（避免頻繁重啟）
docker exec -it AIOT-be /bin/bash           # 進入後端容器
docker exec -it AIOT-drone /bin/bash        # 進入 Drone 容器
docker exec -it AIOT-rbac /bin/bash         # 進入 RBAC 容器

# 容器內快速編譯檢查
docker exec -it AIOT-be bash -c "cd /app && npm run build"      # TypeScript 編譯
docker exec -it AIOT-be bash -c "cd /app && npx tsc --noEmit"   # 類型檢查
docker exec -it AIOT-be bash -c "cd /app && npm run lint"       # 代碼檢查

# Python 容器編譯檢查
docker exec -it CONTAINER_NAME bash -c "python -m py_compile src/*.py"
docker exec -it CONTAINER_NAME bash -c "python manage.py check"

# 批量重啟（修復完成後）
docker restart AIOT-be AIOT-drone AIOT-rbac
```

### LLM 服務管理

```bash
# 啟動 AI Engine（在 llm-ai-engine 目錄）
source venv/bin/activate && python main.py

# 使用 LangChain 版本（預設，支援記憶和 RAG）
USE_LANGCHAIN=true python main.py

# 使用 Simple 版本（輕量級，快速啟動）
USE_LANGCHAIN=false python main.py

# 啟動 Django LLM Service（在 llm-service 目錄）  
source venv/bin/activate && python manage.py runserver 0.0.0.0:8022

# 檢查虛擬環境和依賴
which python  # 確認使用正確的 Python 環境
pip list | grep torch  # 檢查模型依賴
pip list | grep langchain  # 檢查 LangChain 依賴

# LangChain 專用測試
curl -X POST http://localhost:8021/memory/reset  # 重置對話記憶
curl -X GET http://localhost:8021/memory/history  # 查看對話歷史
```

### 微服務健康檢查規範

**重要規則：健康檢查必須依照服務類型進行配置**

#### 健康檢查類型優先級

1. **gRPC 服務**：優先使用 `grpc_health_probe`
   ```bash
   # gRPC 健康檢查（首選）
   test: ["CMD", "grpc_health_probe", "-addr=localhost:PORT"]
   
   # 備用方案：TCP 端口檢查
   test: ["CMD", "nc", "-z", "localhost", "PORT"]
   ```

2. **WebSocket 服務**：使用 WebSocket 特定檢查
   ```bash
   # WebSocket 健康檢查
   test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
   # 或使用 WebSocket 專用工具檢查
   test: ["CMD", "wscat", "-c", "ws://localhost:PORT"]
   ```

3. **HTTP 服務**：標準 HTTP 健康檢查
   ```bash
   # HTTP 健康檢查
   test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
   ```

#### 服務類型對應

- **RBAC Service (gRPC)**: `grpc_health_probe -addr=localhost:50051`
- **Drone Service (gRPC)**: `grpc_health_probe -addr=localhost:50052`
- **General Service (gRPC)**: `grpc_health_probe -addr=localhost:50053`
- **Drone WebSocket Service**: `curl -f http://localhost:3004/health`
- **Docs Service (HTTP)**: `curl -f http://localhost:3002/health`
- **LLM Service (HTTP)**: `curl -f http://localhost:8022/health`

#### 健康檢查配置標準

```yaml
healthcheck:
  interval: 30s      # 檢查間隔
  timeout: 10s       # 超時時間
  retries: 3         # 重試次數
  start_period: 40s  # 服務啟動寬限期（適用於需要初始化的服務）
```

### 環境管理命令

```bash
# === 開發環境 (Docker Compose) ===
# 啟動開發環境
docker-compose up -d                    # 背景啟動所有服務
docker-compose up -d --build            # 重新建置並啟動

# 開發環境管理
docker-compose ps                       # 查看服務狀態
docker-compose logs -f SERVICE_NAME     # 查看特定服務日誌
docker-compose down                     # 停止並移除容器
docker-compose restart SERVICE_NAME     # 重啟特定服務

# === 生產環境 (Kubernetes) ===
# 部署到 K8s
kubectl apply -f infrastructure/kubernetes/              # 部署所有服務
kubectl apply -f infrastructure/kubernetes/microservices/ # 僅部署微服務

# K8s 服務管理
kubectl get pods                        # 查看 Pod 狀態
kubectl get services                    # 查看服務狀態
kubectl logs -f POD_NAME                # 查看 Pod 日誌
kubectl describe pod POD_NAME           # 查看 Pod 詳細資訊

# 環境切換檢查
docker ps | grep AIOT                   # 檢查 Docker Compose 是否運行
kubectl get pods --namespace=default    # 檢查 K8s 是否運行

# 清理命令
docker-compose down --volumes           # 完全清理開發環境
kubectl delete -f infrastructure/kubernetes/ # 清理 K8s 部署

# 健康檢查測試命令
curl http://localhost:8000/api/health           # API Gateway 健康檢查
grpc_health_probe -addr=localhost:50051        # RBAC Service 健康檢查
grpc_health_probe -addr=localhost:50052        # Drone Service 健康檢查
curl http://localhost:3004/health              # Drone WebSocket 健康檢查
```