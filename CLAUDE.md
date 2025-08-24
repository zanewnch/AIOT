# AIOT 項目配置 - Claude Code

## 📋 目錄

### 📌 基本配置
1. [語言偏好設定](#語言偏好設定)
2. [系統架構概覽](#系統架構概覽)
3. [環境管理策略](#環境管理策略)

### 🏗️ 架構與服務
4. [微服務架構](#微服務架構)
5. [LLM AI 引擎](#llm-ai-引擎)
6. [服務通訊協議](#服務通訊協議)

### 💻 開發規範
7. [程式開發準則](#程式開發準則)
8. [TypeScript 規範](#typescript-規範)
9. [Python 開發規範](#python-開發規範)
10. [API 開發標準](#api-開發標準)

### 🔧 開發環境
11. [開發環境配置](#開發環境配置)
12. [容器調試策略](#容器調試策略)
13. [測試與診斷](#測試與診斷)

### 📚 操作指南
14. [常用命令參考](#常用命令參考)
15. [健康檢查指南](#健康檢查指南)

---

## 📌 基本配置

### 語言偏好設定

- **繁體中文優先**：如果用戶使用繁體中文輸入，請用繁體中文回答
- **英語支援**：If user inputs in English, respond in English
- **自動適應**：根據用戶的輸入語言自動調整回應語言

---

## 系統架構概覽

### 技術棧總覽

| 組件 | 技術選型 | 版本/規範 | 說明 |
|------|---------|-----------|------|
| **容器化** | Docker Compose (開發) / Kubernetes (生產) | Latest | 環境隔離與服務編排 |
| **API Gateway** | Express.js | Node.js | HTTP 請求路由與代理 |
| **微服務通訊** | gRPC | Proto3 | 高效能服務間通訊 |
| **前端框架** | Vue.js + TypeScript | Latest | 響應式用戶介面 |
| **後端語言** | TypeScript (Node.js) | ES2022+ | 型別安全的後端開發 |
| **AI 服務** | FastAPI + Django | Python 3.9+ | LLM 模型服務 |
| **資料庫** | PostgreSQL / SQLite | Latest | 關聯式資料儲存 |
| **快取** | Redis | Latest | 記憶體快取與會話管理 |

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        AIOT 系統架構                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Vue.js + TypeScript)                                │
│  └── Port: 3000                                                │
├─────────────────────────────────────────────────────────────────┤
│  API Gateway (Express.js)                                      │
│  └── Port: 8000 (HTTP) → gRPC Bridge                          │
├─────────────────────────────────────────────────────────────────┤
│  微服務層 (gRPC Services)                                       │
│  ├── RBAC Service        (Port: 50051)                         │
│  ├── Drone Service       (Port: 50052)                         │
│  ├── General Service     (Port: 50053)                         │
│  └── Drone WebSocket     (Port: 3004)                          │
├─────────────────────────────────────────────────────────────────┤
│  LLM AI 引擎                                                    │
│  ├── Django LLM Service  (Port: 8022) ─┐                       │
│  └── FastAPI AI Engine   (Port: 8021) ←┘                       │
├─────────────────────────────────────────────────────────────────┤
│  資料層                                                          │
│  ├── PostgreSQL (生產)                                          │
│  ├── SQLite (開發)                                              │
│  └── Redis (快取)                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 環境管理策略

### 部署環境對比

| 環境類型 | 技術棧 | 適用場景 | 限制說明 |
|---------|--------|----------|----------|
| **開發環境** | Docker Compose | 本地開發、單元測試、功能驗證 | 效能有限，不可與 K8s 同時運行 |
| **生產環境** | Kubernetes | 正式部署、高可用、擴展性 | 資源需求高，配置複雜 |

### 環境切換指令

```bash
# 🔧 開發環境管理
docker-compose up -d                    # 啟動開發環境
docker-compose down                     # 停止開發環境
docker-compose logs -f SERVICE_NAME     # 查看服務日誌

# ☸️ 生產環境管理  
kubectl apply -f infrastructure/kubernetes/              # 部署到 K8s
kubectl get pods                                        # 檢查 Pod 狀態
kubectl logs -f POD_NAME                                # 查看 Pod 日誌

# 📊 環境狀態檢查
docker ps | grep AIOT                   # 檢查 Docker Compose
kubectl get pods --namespace=default    # 檢查 Kubernetes
```

---

## 🏗️ 架構與服務

### 微服務架構

#### 服務清單與職責

| 服務名稱 | 端口 | 協議 | 主要職責 |
|---------|------|------|----------|
| **API Gateway** | 8000 | HTTP → gRPC | 請求路由、認證驗證、協議轉換 |
| **RBAC Service** | 50051 | gRPC | 角色權限管理、用戶授權 |
| **Drone Service** | 50052 | gRPC | 無人機數據管理、位置追蹤 |
| **General Service** | 50053 | gRPC | 通用服務、用戶偏好設定 |
| **Drone WebSocket** | 3004 | WebSocket | 即時無人機狀態推送 |
| **Docs Service** | 3002 | HTTP | 文檔管理與檢索 |

#### 服務間通訊流程

```
用戶請求 → API Gateway → 身份驗證 → gRPC 路由 → 微服務處理 → 回應用戶
    ↓              ↓              ↓              ↓
HTTP 請求    JWT 驗證      協議轉換      業務邏輯
```

---

## LLM AI 引擎

### 雙層架構設計

```
┌─────────────────────────┐    HTTP API    ┌─────────────────────────┐
│   Django LLM Service    │ ◄─────────────► │   FastAPI AI Engine     │
│   (Port: 8022)          │                 │   (Port: 8021)          │
├─────────────────────────┤                 ├─────────────────────────┤
│ • REST API 端點         │                 │ • SmolLM2 模型推理      │
│ • 請求驗證與認證        │                 │ • 對話記憶管理          │
│ • 回應格式標準化        │                 │ • 串流生成支援          │
│ • 業務邏輯處理          │                 │ • 健康檢查監控          │
│ • 文檔上傳與處理        │                 │ • GPU/CPU 資源管理      │
└─────────────────────────┘                 └─────────────────────────┘
```

### AI 模型規格

| 項目 | 規格 | 說明 |
|------|------|------|
| **模型** | HuggingFaceTB/SmolLM2-135M-Instruct | 輕量級指令跟隨模型 |
| **參數量** | 135M | 適合 CPU 推理，記憶體需求約 1GB |
| **功能** | 指令跟隨、對話生成、文本理解 | 支援基礎中英文處理 |
| **推理時間** | 10-20 秒 | CPU 優化配置 |
| **部署方式** | 獨立虛擬環境 | 與主系統隔離 |

### API 端點對照

| 功能 | AI Engine (直接) | Django API (封裝) | 說明 |
|------|-----------------|-------------------|------|
| **健康檢查** | `GET /health` | `GET /api/transformers/health/` | 服務狀態監控 |
| **文字生成** | `POST /generate` | `POST /api/transformers/generate/` | 單輪文字生成 |
| **對話模式** | `POST /conversational` | `POST /api/transformers/conversation/` | 記憶式對話 |
| **串流回應** | `POST /stream` | `POST /api/transformers/stream/` | 即時串流輸出 |

---

## 服務通訊協議

### gRPC 設計原則

- **強制使用 gRPC**：所有微服務間通訊必須使用 gRPC，不允許 HTTP API 替代
- **Proto3 標準**：使用最新的 Protocol Buffers v3 定義介面
- **健康檢查**：所有 gRPC 服務都必須實現健康檢查協議
- **錯誤處理**：統一的 gRPC 錯誤碼與錯誤訊息格式

### WebSocket 使用場景

- **即時數據推送**：無人機位置、狀態更新
- **雙向通訊**：用戶與系統的即時互動
- **低延遲需求**：需要毫秒級回應的場景

---

## 💻 開發規範

### 程式開發準則

#### 結構一致性原則

**核心原則：新建或修改文件時，必須先分析既有模式**

1. **模式分析步驟**：
   - 尋找相同前綴或後綴的現有文件
   - 分析結構模式（class vs function、常數定義、靜態方法）
   - 檢查導入/導出模式和註釋風格
   - 遵循既有命名慣例和組織模式

2. **技術棧堅持原則**：
   - **配置修復** > 框架替換
   - **深入調試** > 快速繞過  
   - **根本解決** > 臨時方案
   - **學習提升** > 避免困難

#### 模組管理規範

**強制要求：多文件資料夾必須使用統一導出**

```typescript
// ✅ TypeScript/JavaScript：使用 index.ts
export { UserService } from './userService';
export { RoleService } from './roleService';
export * from './authService';
```

```python
# ✅ Python：使用 __init__.py
from .user import User
from .role import Role
from .permission import Permission

__all__ = ['User', 'Role', 'Permission']
```

#### 嚴格禁止的行為

- ❌ **創建簡化版本**：禁止 `*-simple.js`、`simple-*` 等文件
- ❌ **臨時文件**：禁止 `temp-*`、`test-*`、`backup-*` 文件
- ❌ **技術棧逃避**：gRPC 有問題不可改用 HTTP，TypeScript 錯誤不可改用 JavaScript
- ❌ **範例代碼生成**：新技術導入時不主動產生 example code

---

## TypeScript 規範

### 🚫 InversifyJS 容器使用規範（強制規則）

**絕對禁止手動從容器獲取依賴項**

```typescript
// ❌ 絶對禁止：手動從容器獲取依賴項
const authRoutes = container.get<AuthRoutes>(TYPES.AuthRoutes);
const userService = container.get<UserService>(TYPES.UserService);

// ✅ 正確：使用 InversifyJS 的 @injectable 和 @inject decorators
@injectable()
class AuthController {
    constructor(
        @inject(TYPES.AuthRoutes) private authRoutes: AuthRoutes,
        @inject(TYPES.UserService) private userService: UserService
    ) {}
}

// ✅ 正確：在路由註冊時使用 DI
export function registerRoutes(app: Application): void {
    // 路由類別應該已經通過 @injectable 裝飾器註冊
    // 在需要使用時通過建構函數注入依賴項
    app.use('/api', router);
}
```

**核心原則：**
1. **依賴注入優於手動獲取**：所有類別都應該通過建構函數接收依賴項
2. **容器封裝性**：容器只應該在應用程式入口點和測試中直接存取
3. **類型安全**：使用 `@inject(TYPES.ServiceName)` 確保編譯時期類型檢查
4. **可測試性**：通過 DI 的程式碼更容易進行單元測試

**違規偵測關鍵字：**
- `container.get<`
- `Container.get<`
- `.get<`（在容器上下文中）

---

## TypeScript 規範

### 🚫 強制規則（無例外）

#### 1. 函數定義規範

**所有函數必須使用 arrow function，禁用 function 關鍵字**

```typescript
// ✅ 正確：arrow function
const createUser = async (userData: UserCreateRequest): Promise<User> => {
    return await userRepository.create(userData);
};

const processData = (input: string): string => {
    return input.toUpperCase();
};

// ✅ 類別內也用 arrow function
class UserService {
    private validate = (data: any): boolean => {
        return data !== null;
    };
    
    public getUser = async (id: string): Promise<User> => {
        return await this.userRepo.findById(id);
    };
}

// ❌ 絕對禁止：function 關鍵字
function createUser(userData: UserCreateRequest): Promise<User> {
    return userRepository.create(userData);
}

// ❌ 絕對禁止：傳統類別方法
class UserService {
    getUser(id: string): Promise<User> {
        return this.userRepo.findById(id);
    }
}
```

#### 2. Interface 管理規範

**所有 interface 和 type 必須統一放在 types directory**

```typescript
// ✅ 正確：types/user.types.ts
export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserCreateRequest {
    username: string;
    email: string;
    password: string;
}

export type UserRole = 'admin' | 'user' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// ✅ 業務邏輯文件中導入
import { User, UserCreateRequest, UserRole } from '../types/user.types';

// ❌ 絕對禁止：在業務邏輯文件中定義 interface
const userService = {
    create: (userData: { username: string; email: string }) => {
        // 禁止直接定義 interface
    }
};
```

### Types Directory 標準結構

```
types/
├── index.ts              # 統一導出入口
├── common.types.ts       # 通用類型定義
├── api/                  # API 相關類型
│   ├── request.types.ts  # 請求類型
│   ├── response.types.ts # 回應類型
│   └── index.ts          # API 類型導出
├── entities/             # 實體類型
│   ├── user.types.ts     # 用戶實體
│   ├── role.types.ts     # 角色實體
│   └── index.ts          # 實體類型導出
└── services/             # 服務類型
    ├── auth.types.ts     # 認證服務
    ├── rbac.types.ts     # 權限服務
    └── index.ts          # 服務類型導出
```

### 統一導出配置

```typescript
// types/index.ts - 主導出文件
export * from './common.types';
export * from './api';
export * from './entities';
export * from './services';

// 使用範例
import { 
    User, 
    UserCreateRequest, 
    ApiResponse, 
    AuthToken 
} from '../types';
```

---

## Python 開發規範

### 類型註解要求

**強制規則：所有 Python 文件必須包含完整的 type hints**

```python
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    """用戶實體類別。"""
    id: str
    username: str
    email: str
    created_at: datetime
    updated_at: Optional[datetime] = None

def create_user(user_data: Dict[str, Any]) -> User:
    """
    創建新用戶。
    
    Args:
        user_data: 包含用戶資訊的字典
        
    Returns:
        創建的用戶實體
        
    Raises:
        ValueError: 當用戶資料無效時
    """
    if not user_data.get('username'):
        raise ValueError("Username is required")
    
    return User(
        id=generate_id(),
        username=user_data['username'],
        email=user_data['email'],
        created_at=datetime.now()
    )

async def get_users(limit: int = 10) -> List[User]:
    """異步獲取用戶列表。"""
    users: List[User] = await user_repository.find_all(limit=limit)
    return users
```

### 文檔字串規範

**必須使用 Google Style 或 NumPy Style docstring**

```python
def complex_calculation(
    data: List[float], 
    threshold: float, 
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Union[float, List[float]]]:
    """
    執行複雜的數據計算。
    
    Args:
        data: 輸入數據列表
        threshold: 閾值參數
        options: 可選配置字典，包含：
            - 'method': 計算方法 ('avg' | 'sum' | 'max')
            - 'precision': 精度設定 (int)
    
    Returns:
        包含計算結果的字典：
        - 'result': 主要計算結果
        - 'filtered_data': 過濾後的數據
        - 'metadata': 計算元數據
    
    Raises:
        ValueError: 當數據為空或閾值無效時
        TypeError: 當數據類型不正確時
    
    Example:
        >>> data = [1.0, 2.5, 3.2, 4.1]
        >>> result = complex_calculation(data, 2.0)
        >>> print(result['result'])
        2.7
    """
    if not data:
        raise ValueError("Data cannot be empty")
    
    # 實現邏輯...
    return {
        'result': 0.0,
        'filtered_data': [],
        'metadata': {}
    }
```

---

## API 開發標準

### 回應格式規範

**強制使用 ResResult 統一回應格式**

```typescript
// ✅ 正確的回應格式
import { ResResult } from '../utils/response';

const getUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await userService.getById(req.params.id);
        ResResult.success(res, user, '用戶資訊獲取成功');
    } catch (error) {
        ResResult.error(res, 500, '獲取用戶失敗', error);
    }
};

// ❌ 禁止直接使用 res.json()
const wrongController = async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getById(req.params.id);
    res.json({ success: true, data: user }); // 禁止這樣做
};
```

### 標準回應格式

```typescript
interface ApiResponse<T = any> {
    status: number;          // HTTP 狀態碼
    success: boolean;        // 操作成功狀態
    message: string;         // 回應訊息
    data?: T;               // 回應數據（可選）
    error?: string;         // 錯誤訊息（失敗時）
    timestamp: string;      // 時間戳記
}
```

### 認證機制

| 組件 | 實現方式 | 說明 |
|------|----------|------|
| **Token 類型** | JWT | JSON Web Token 標準 |
| **儲存方式** | httpOnly Cookie | 防止 XSS 攻擊 |
| **驗證端點** | `/api/auth/me` | 檢查登入狀態 |
| **預設帳號** | admin / admin | 初始管理員帳號 |

---

## 🔧 開發環境

### 開發環境配置

#### Hot Reload 支援

| 服務類型 | 技術 | 重載範圍 | 注意事項 |
|---------|------|----------|----------|
| **後端服務** | TypeScript Watch Mode | 代碼更改自動重載 | 無需重啟容器 |
| **前端服務** | Vite HMR | 組件級熱更新 | 狀態保持 |
| **LLM 服務** | FastAPI Auto-reload | API 端點重載 | 模型不重載 |

#### LLM 開發環境

```bash
# FastAPI AI Engine 設置
cd llm-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 啟動方式選擇
USE_LANGCHAIN=true python main.py   # 完整功能（記憶+RAG）
USE_LANGCHAIN=false python main.py  # 輕量模式（快速啟動）

# Django LLM Service 設置  
cd llm-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8022
```

---

## 容器調試策略

### 🚫 嚴格禁止的低效行為

- ❌ 發現錯誤立即重啟容器
- ❌ 編譯失敗就重啟容器
- ❌ 不進容器調試直接重啟
- ❌ 每個錯誤都重啟一次

### ✅ 正確的高效調試流程

#### 1. 檢查容器日誌（必須首步）

```bash
# 查看最近日誌並持續監控
docker logs CONTAINER_NAME --tail=50 -f

# 常用容器日誌檢查
docker logs AIOT-be --tail=50 -f           # 後端服務
docker logs AIOT-feSetting --tail=50 -f    # 前端服務
docker logs AIOT-drone --tail=50 -f        # Drone 服務
docker logs AIOT-rbac --tail=50 -f         # RBAC 服務
```

#### 2. 強制進入容器內修復

```bash
# 進入容器（強制步驟）
docker exec -it CONTAINER_NAME /bin/bash

# 在容器內批量修復問題
cd /app
npm run build                   # TypeScript 編譯驗證
npx tsc --noEmit               # 類型錯誤檢查
npm run lint                   # 代碼規範檢查

# Python 服務修復
python -m py_compile src/*.py   # Python 語法檢查
python manage.py check          # Django 配置檢查
pip install -r requirements.txt # 依賴修復
```

#### 3. 批量測試確認

**⚠️ 嚴格禁止啟動服務器測試 - 只用 build 命令驗證**

```bash
# ✅ 正確的驗證方式
npm run build && npm run lint    # Node.js 服務（禁止 npm start）
python manage.py check           # Python 服務（禁止 runserver）

# ❌ 絕對禁止的測試方式
npm start                        # 禁止啟動服務器
python manage.py runserver       # 禁止啟動 Django
```

#### 4. 最後才重啟容器

```bash
# 只有在容器內完全修復後才重啟
exit                           # 退出容器
docker restart CONTAINER_NAME  # 最後才重啟
```

### 一鍵修復命令

```bash
# 一次性修復多個問題
docker exec -it AIOT-be bash -c "cd /app && npm run build && npm run lint"
docker exec -it AIOT-drone bash -c "cd /app && python manage.py check"

# 批量重啟（修復完成後）
docker restart AIOT-be AIOT-drone AIOT-rbac
```

---

## 測試與診斷

### 分層測試策略

**優先級：IDE 診斷 → 建置測試 → 服務器測試**

#### 1. IDE 診斷（首選）

```bash
# 使用 IDE 內建診斷檢查語法和類型錯誤
mcp__ide__getDiagnostics
```

#### 2. 建置命令測試

```bash
# 後端 TypeScript 檢查
npm run build                    # 編譯檢查
npx tsc --noEmit                # 類型檢查
npm run lint                    # 代碼規範

# 前端建置檢查
npm run build                    # Vite 建置
npm run type-check              # 類型檢查

# Python 服務檢查
python -m py_compile src/*.py    # 語法檢查
python manage.py check          # Django 配置
```

#### 3. LLM 服務測試

```bash
# 健康檢查
curl -X GET http://localhost:8021/health
curl -X GET http://localhost:8022/api/transformers/health/

# 功能測試
curl -X POST http://localhost:8021/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","use_rag":false}'

# 對話測試
curl -X POST http://localhost:8021/conversational \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is your name?","use_rag":false}'
```

---

## 📚 操作指南

### 常用命令參考

#### 基礎 API 測試

```bash
# 🔐 認證流程
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/cookies.txt

curl -s http://localhost:8000/api/auth/me -b /tmp/cookies.txt

# 🔍 API 測試
curl -s http://localhost:8000/api/rbac/roles -b /tmp/cookies.txt
```

#### 容器管理命令

```bash
# 🐳 容器狀態管理
docker ps                                # 查看運行容器
docker-compose ps                         # 查看 Compose 服務狀態
docker logs CONTAINER_NAME -f --tail=50  # 實時日誌監控

# 🔧 容器調試
docker exec -it CONTAINER_NAME /bin/bash # 進入容器
docker restart CONTAINER_NAME            # 重啟容器
docker-compose restart SERVICE_NAME      # 重啟 Compose 服務

# 📊 資源監控
docker stats                            # 容器資源使用情況
docker system df                        # Docker 磁碟使用情況
```

#### 環境管理

```bash
# 🚀 啟動命令
docker-compose up -d                    # 後台啟動開發環境
docker-compose up -d --build            # 重新建置並啟動
kubectl apply -f infrastructure/kubernetes/ # 部署到 K8s

# 🛑 停止命令
docker-compose down                     # 停止開發環境
docker-compose down --volumes           # 停止並清理 volumes
kubectl delete -f infrastructure/kubernetes/ # 清理 K8s 部署

# 🔍 狀態檢查
docker ps | grep AIOT                   # 檢查 Docker 服務
kubectl get pods --namespace=default    # 檢查 K8s Pod
```

---

## 健康檢查指南

### 檢查類型優先級

#### 1. gRPC 服務健康檢查

```bash
# 首選：gRPC 健康探針
grpc_health_probe -addr=localhost:50051  # RBAC Service
grpc_health_probe -addr=localhost:50052  # Drone Service  
grpc_health_probe -addr=localhost:50053  # General Service

# 備用：TCP 端口檢查
nc -z localhost 50051                    # 檢查端口可達性
```

#### 2. HTTP 服務健康檢查

```bash
# 標準 HTTP 健康檢查
curl -f http://localhost:8000/api/health        # API Gateway
curl -f http://localhost:3002/health            # Docs Service
curl -f http://localhost:8022/api/transformers/health/ # LLM Service
```

#### 3. WebSocket 服務健康檢查

```bash
# WebSocket 健康檢查
curl -f http://localhost:3004/health            # Drone WebSocket
wscat -c ws://localhost:3004                    # 直接 WebSocket 連接
```

### Docker Compose 健康檢查配置

```yaml
healthcheck:
  interval: 30s      # 檢查間隔
  timeout: 10s       # 超時時間  
  retries: 3         # 重試次數
  start_period: 40s  # 啟動寬限期

# gRPC 服務範例
test: ["CMD", "grpc_health_probe", "-addr=localhost:50051"]

# HTTP 服務範例  
test: ["CMD", "curl", "-f", "http://localhost:8000/health"]

# WebSocket 服務範例
test: ["CMD", "curl", "-f", "http://localhost:3004/health"]
```

### 服務對應表

| 服務名稱 | 類型 | 端口 | 健康檢查命令 |
|---------|------|------|-------------|
| **API Gateway** | HTTP | 8000 | `curl -f http://localhost:8000/api/health` |
| **RBAC Service** | gRPC | 50051 | `grpc_health_probe -addr=localhost:50051` |
| **Drone Service** | gRPC | 50052 | `grpc_health_probe -addr=localhost:50052` |
| **General Service** | gRPC | 50053 | `grpc_health_probe -addr=localhost:50053` |
| **Drone WebSocket** | WebSocket | 3004 | `curl -f http://localhost:3004/health` |
| **Docs Service** | HTTP | 3002 | `curl -f http://localhost:3002/health` |
| **LLM Service** | HTTP | 8022 | `curl -f http://localhost:8022/health` |
| **AI Engine** | HTTP | 8021 | `curl -f http://localhost:8021/health` |

---

## 💡 進階配置

### Obsidian 筆記規範

**obsidian 資料夾內的 MD 文件必須使用 Obsidian syntax**

#### 語法規範

```markdown
# 筆記標題

## 🎯 主要任務
- [ ] 任務一
  - [ ] 子任務 1.1  
  - [x] 已完成的子任務

## 📋 詳細內容
==重要內容高亮==
~~刪除的內容~~

## 🔗 相關連結
[[其他文件名稱]]
[[文件名稱|顯示文字]]  
[[文件名稱#特定章節]]

## 🏷️ 標籤
#AIOT #microservices #kubernetes #docker
#項目/AIOT #技術/typescript

---
*最後更新: [[2025-08-22]]*
```

#### 文件命名慣例

| 類型 | 命名格式 | 範例 |
|------|---------|------|
| **日期筆記** | `YYYY-MM-DD.md` | `2025-08-22.md` |
| **專案筆記** | `project-name.md` | `aiot-project.md` |
| **會議紀錄** | `meeting-YYYY-MM-DD.md` | `meeting-2025-08-22.md` |
| **學習筆記** | `learning-topic.md` | `learning-kubernetes.md` |

---

*最後更新：2025-08-22*  
*版本：v2.0*  
*維護者：Claude Code AI Assistant*