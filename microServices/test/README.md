# AIOT 微服務測試套件

完整的單元測試和整合測試框架，用於驗證 AIOT 微服務架構的功能正確性和系統穩定性。

## 📋 測試概覽

### 測試統計
- **總測試檔案**: 15 個
- **單元測試**: 10 個檔案 (250+ 個測試案例)
- **整合測試**: 5 個檔案 (136+ 個測試案例)  
- **總測試案例**: 386+ 個

### 服務覆蓋
- ✅ **Drone Service** - 無人機服務測試
- ✅ **RBAC Service** - 權限控制服務測試  
- ✅ **General Service** - 通用服務測試
- ✅ **Docs Service** - 文檔服務測試
- ✅ **Drone WebSocket Service** - 無人機 WebSocket 服務測試

## 🏗️ 測試架構

```
test/
├── unit/                     # 單元測試
│   ├── drone-service/
│   │   ├── controllers/      # 控制器測試
│   │   └── services/         # 服務層測試
│   ├── rbac-service/
│   │   ├── controllers/      # 用戶管理測試
│   │   └── services/         # RBAC 邏輯測試
│   ├── general-service/
│   │   ├── controllers/      # 通用控制器測試
│   │   └── services/         # 通用服務測試
│   ├── docs-service/
│   │   ├── controllers/      # 文檔控制器測試
│   │   └── services/         # 文檔生成服務測試
│   └── drone-websocket-service/
│       └── services/         # WebSocket 服務測試
├── integration/              # 整合測試
│   ├── api/                  # API 整合測試
│   │   ├── auth.integration.test.ts
│   │   ├── drone.integration.test.ts
│   │   ├── rbac.integration.test.ts
│   │   ├── docs.integration.test.ts
│   │   └── drone-websocket.integration.test.ts
│   └── setup/                # 測試環境設定
│       └── testSetup.ts      # 整合測試框架
├── setup/                    # 測試配置
│   └── jest.setup.ts         # Jest 全域設定
├── jest.config.js            # Jest 配置
├── package.json              # 測試依賴
├── run-tests.sh              # 測試執行腳本
└── validate-tests.js         # 測試驗證工具
```

## 🚀 快速開始

### 1. 安裝依賴
```bash
cd microServices/test
npm install
```

### 2. 執行所有測試
```bash
npm test
```

### 3. 執行特定測試類型
```bash
# 僅執行單元測試
npm run test:unit

# 僅執行整合測試  
npm run test:integration

# 執行測試並生成覆蓋率報告
npm run test:coverage
```

### 4. 使用測試執行腳本
```bash
# 執行所有測試
./run-tests.sh

# 僅執行單元測試
./run-tests.sh unit

# 僅執行整合測試
./run-tests.sh integration
```

## 🧪 單元測試

### Drone Service 測試
- **DroneCommandCommandsCtrl.test.ts** - 無人機指令控制器測試
  - 指令創建和驗證
  - 批量操作測試
  - 飛行指令發送測試
  - 權限控制測試
  
- **DroneCommandCommandsSvc.test.ts** - 無人機指令服務測試
  - 業務邏輯測試
  - 指令狀態管理
  - 錯誤處理測試

### RBAC Service 測試  
- **UserCommandsCtrl.test.ts** - 用戶管理控制器測試
  - 用戶 CRUD 操作
  - 密碼管理
  - 權限驗證
  
- **UserCommandsSvc.test.ts** - 用戶管理服務測試
  - 用戶創建和驗證
  - 密碼加密測試
  - Redis 快取管理

### General Service 測試
- **UserPreferenceCommandsCtrl.test.ts** - 用戶偏好控制器測試
  - 偏好設定 CRUD
  - 批量操作
  - 輸入驗證
  
- **UserPreferenceCommandsSvc.test.ts** - 用戶偏好服務測試
  - 偏好設定邏輯
  - 預設值處理
  - 數據遷移

### Docs Service 測試
- **DocsController.test.ts** - 文檔控制器測試
  - 文檔首頁渲染
  - 手動文檔生成
  - 生成狀態查詢
  - 重定向功能
  
- **DocsGenerationService.test.ts** - 文檔生成服務測試
  - 文檔更新檢查邏輯
  - 文檔生成流程
  - 文件系統操作
  - 命令執行和錯誤處理

### Drone WebSocket Service 測試
- **DroneRealTimeStatusCommandsSvc.test.ts** - 即時狀態命令服務測試
  - 狀態更新功能
  - 輸入驗證
  - 錯誤處理
  - 業務邏輯驗證
  
- **DroneRealTimeStatusQueriesSvc.test.ts** - 即時狀態查詢服務測試
  - 狀態查詢功能
  - 在線狀態監控
  - 健康狀態評估
  - 輸入驗證和錯誤處理

## 🌐 整合測試

### 認證整合測試 (auth.integration.test.ts)
- 用戶註冊流程
- 登入驗證機制
- JWT Token 管理
- 權限驗證
- 跨服務認證
- 安全性測試

### 無人機 API 整合測試 (drone.integration.test.ts)
- 無人機基本資訊管理
- 指令發送和執行
- 狀態追蹤
- 位置記錄
- 批量操作
- 統計資料

### RBAC API 整合測試 (rbac.integration.test.ts)  
- 用戶管理 API
- 角色權限管理
- 用戶角色分配
- 權限驗證
- 密碼管理
- 系統統計

### 文檔 API 整合測試 (docs.integration.test.ts)
- 文檔首頁渲染測試
- 手動文檔生成 API 測試
- 生成狀態查詢 API 測試
- 健康檢查測試
- 錯誤處理測試

### 無人機 WebSocket API 整合測試 (drone-websocket.integration.test.ts)
- WebSocket 連接測試
- 即時狀態查詢 API 測試
- 健康檢查測試
- WebSocket 實時通信測試
- 錯誤處理測試

## ⚙️ 測試配置

### Jest 配置特點
- **TypeScript 支援** - 完整的 TS 測試環境
- **ES Module 相容** - 支援現代 JavaScript 模組
- **分離執行環境** - 單元測試並行，整合測試序列
- **覆蓋率報告** - 詳細的代碼覆蓋率統計
- **多格式報告** - HTML、LCOV、JSON 格式

### 覆蓋率門檻
- **行覆蓋率**: 70%
- **函數覆蓋率**: 70%  
- **分支覆蓋率**: 70%
- **語句覆蓋率**: 70%

## 🔧 測試工具

### 測試執行腳本 (run-tests.sh)
- 自動化測試環境設置
- 資料庫初始化和清理
- Docker 服務管理
- 測試報告生成

### 測試驗證工具 (validate-tests.js)
- 測試結構驗證
- 配置正確性檢查  
- 覆蓋率統計分析
- 測試品質評估

### 測試設置框架 (testSetup.ts)
- HTTP 客戶端管理
- 資料庫連接管理
- 測試資料建立
- 認證管理
- 環境清理

## 🛠️ Mock 和工具

### 全域 Mock
- **Logger** - 統一日誌 Mock
- **Database** - MySQL、MongoDB、Redis Mock  
- **Authentication** - bcrypt、JWT Mock
- **HTTP** - Express、Axios Mock

### 測試輔助工具
- **自定義匹配器** - 日期、Email、UUID 驗證
- **測試資料生成** - 隨機字符串、數字生成
- **時間模擬** - 時間戳差異驗證
- **錯誤處理** - 統一異常捕獲

## 📊 測試報告

### 報告格式
- **控制台輸出** - 實時測試結果
- **HTML 報告** - 詳細的測試報告頁面
- **JUnit XML** - CI/CD 整合格式
- **JSON 總結** - 程式化處理格式

### 覆蓋率報告
```bash
# 查看覆蓋率報告
open coverage/lcov-report/index.html

# 查看測試結果
open test-results/test-report.html
```

## 🚧 CI/CD 整合

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    cd microServices/test
    npm install
    npm run test:ci
```

### Docker 環境
```bash
# 使用 Docker 執行測試
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📈 測試最佳實踐

### 單元測試原則
- **獨立性** - 每個測試都是獨立的
- **可重複** - 測試結果應該一致
- **快速執行** - 單元測試應該快速完成
- **清晰描述** - 測試名稱應該描述測試意圖

### 整合測試原則  
- **真實環境** - 模擬真實的服務環境
- **數據隔離** - 每個測試使用獨立的測試資料
- **完整流程** - 測試端到端的業務流程
- **錯誤恢復** - 測試系統的錯誤處理能力

### Mock 策略
- **外部依賴** - Mock 所有外部服務
- **資料庫操作** - 使用 in-memory 或 Mock 資料庫
- **網路請求** - Mock HTTP 請求和響應
- **時間相關** - Mock 時間函數避免測試不穩定

## 🔍 故障排除

### 常見問題

#### 1. TypeScript 編譯錯誤
```bash
# 檢查 tsconfig.json 配置
npx tsc --noEmit

# 更新類型定義
npm update @types/jest @types/node
```

#### 2. ES Module 錯誤
```bash
# 確認 package.json 中的 "type": "module"
# 檢查 jest.config.js 中的 ES Module 配置
```

#### 3. 測試逾時
```bash
# 增加測試逾時時間
jest.setTimeout(30000)

# 或在 jest.config.js 中設定
testTimeout: 30000
```

#### 4. Mock 不生效
```bash
# 清除 Jest 快取
npx jest --clearCache

# 檢查 Mock 路徑是否正確
```

### 調試技巧
- 使用 `console.log` 進行調試
- 使用 `--runInBand` 序列執行測試
- 使用 `--verbose` 顯示詳細信息
- 使用 `--detectOpenHandles` 檢測資源洩漏

## 📚 參考資源

- [Jest 官方文檔](https://jestjs.io/docs/getting-started)
- [TypeScript Jest 配置](https://jestjs.io/docs/getting-started#using-typescript)  
- [Supertest API 測試](https://github.com/visionmedia/supertest)
- [測試最佳實踐](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 貢獻指南

### 新增測試
1. 遵循現有的檔案結構
2. 使用描述性的測試名稱
3. 包含正面和負面測試案例  
4. 添加適當的 Mock 和清理

### 測試覆蓋率
- 新功能必須包含對應測試
- 維持 70% 以上的覆蓋率
- 優先測試關鍵業務邏輯
- 包含邊界條件測試

---

**版本**: 1.0.0  
**作者**: AIOT Team  
**最後更新**: 2025-08-13