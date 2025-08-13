# AIOT 項目配置 - Claude Code

## 語言偏好設定
- **如果用戶使用繁體中文輸入，請用繁體中文回答**
- **If user inputs in English, respond in English**
- 根據用戶的輸入語言自動調整回應語言

## 代碼結構一致性原則
- **在新建或修改文件時，先查找相同前綴或後綴的現有文件**
- **分析現有文件的結構模式**：
  - 是否使用 class 還是 function
  - 常數定義方式（extract constants）
  - 靜態方法的使用
  - 導入/導出模式
  - 註釋和文檔風格
- **保持相同類型文件的結構一致性**
- **遵循現有的命名慣例和組織模式**

### 代碼風格規範
- **優先使用 class with arrow function 模式**：
  ```typescript
  @injectable()
  export class ExampleService {
    constructor(private dependency: SomeDependency) {}
    
    // 使用 arrow function 避免 this 綁定問題
    public processData = async (data: any): Promise<void> => {
      // 實作邏輯
    }
    
    private helperMethod = (param: string): string => {
      return param.toUpperCase();
    }
  }
  ```
- **路由類別使用 arrow function**：
  ```typescript
  @injectable()
  export class ExampleRoutes {
    private setupRoutes = (): void => {
      this.router.get('/endpoint', this.handleRequest);
    }
    
    private handleRequest = (req: Request, res: Response): void => {
      // 處理邏輯
    }
  }
  ```
- **控制器方法使用 arrow function**：
  ```typescript
  @injectable()
  export class ExampleController {
    public getData = async (req: Request, res: Response): Promise<void> => {
      // 控制器邏輯
    }
  }
  ```

### 路由結構規範
- **routes/index.ts 只負責註冊和組合路由，不包含具體實作**
- **各功能路由放在獨立的路由文件中**：
  ```
  /routes/
    ├── index.ts           # 路由註冊中心
    ├── healthRoutes.ts    # 健康檢查路由
    ├── userPreferenceRoutes.ts  # 用戶偏好設定路由
    └── docsRoutes.ts      # 動態文檔路由
  ```
- **路由文件命名規範**：`{功能名稱}Routes.ts`
- **每個路由文件都使用 class with arrow function 模式**

## IDE 診斷和測試策略
- **使用 IDE 診斷功能檢查錯誤**：
  - 直接運行 `mcp__ide__getDiagnostics` 檢查語法和類型錯誤
  - 無需啟動完整服務來檢測基本問題
- **使用建置命令測試服務器問題**：
  - 後端：使用 `npm run build` 或 `npx tsc` 檢查 TypeScript 編譯錯誤
  - 前端：使用 `npm run build` 檢查 Vite 建置問題
  - **優先使用建置命令，避免每次都啟動完整服務器**
- **分層測試方法**：
  1. IDE 診斷 → 2. 建置測試 → 3. 只有在必要時才啟動服務器

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
docker logs AIOT-feSetting --tail=20
```