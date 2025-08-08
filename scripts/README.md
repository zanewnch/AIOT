# AIOT 腳本工具

這個目錄包含了 AIOT 項目的各種實用腳本工具。

## 📋 腳本列表

### 🎛️ manage-microservices.sh - 微服務管理腳本

功能完整的微服務管理工具，提供分階段啟動、健康檢查、服務發現等功能。

#### 使用方法

```bash
# 一鍵啟動所有服務
./scripts/manage-microservices.sh start-all

# 分階段啟動 (更細粒度控制)
./scripts/manage-microservices.sh start-infra      # 只啟動基礎設施
./scripts/manage-microservices.sh start-gateway    # 啟動 API Gateway
./scripts/manage-microservices.sh start-services   # 啟動微服務

# 監控服務 (可選)
./scripts/manage-microservices.sh start-monitoring

# 管理命令
./scripts/manage-microservices.sh status           # 服務狀態
./scripts/manage-microservices.sh logs [service]   # 查看日誌
./scripts/manage-microservices.sh stop             # 停止服務
./scripts/manage-microservices.sh restart          # 重啟服務
./scripts/manage-microservices.sh clean            # 清理資源
```

### 🔍 validate-build.sh - 語法驗證腳本

用於驗證所有微服務和前端項目的語法正確性，通過執行 `npm run build` 來檢查編譯錯誤。

#### 功能特點

- ✅ **全自動檢查**：一鍵檢查所有項目的語法
- 📊 **詳細報告**：顯示成功/失敗統計和詳細信息
- ⏰ **超時保護**：防止構建過程卡住（5分鐘超時）
- 📦 **自動安裝依賴**：如果 node_modules 不存在會自動執行 npm install
- 🎯 **單項目模式**：可以只檢查特定項目
- 🌈 **彩色輸出**：清晰的視覺反饋

#### 檢查的項目

- `microServices/rbac` - RBAC 認證授權服務
- `microServices/drone` - 無人機管理服務  
- `microServices/feSetting` - 用戶偏好服務
- `fe` - React 前端應用

#### 使用方法

```bash
# 基本用法：檢查所有項目
cd /home/user/GitHub/AIOT
./scripts/validate-build.sh

# 只檢查特定項目
./scripts/validate-build.sh -s rbac        # 檢查 RBAC 服務
./scripts/validate-build.sh -s drone       # 檢查 Drone 服務
./scripts/validate-build.sh -s feSetting   # 檢查 FeSetting 服務
./scripts/validate-build.sh -s fe          # 檢查前端項目

# 顯示幫助信息
./scripts/validate-build.sh --help

# 詳細輸出模式
./scripts/validate-build.sh --verbose
```

#### 輸出示例

```bash
$ ./scripts/validate-build.sh

============================================================
🚀 AIOT 語法驗證腳本開始執行
📅 開始時間: Thu Jan  1 12:00:00 UTC 2024
============================================================
🎯 全項目驗證模式

============================================================
🔨 開始構建: microServices/rbac
📂 當前目錄: /home/user/GitHub/AIOT/microServices/rbac
🚀 執行 npm run build...
✅ microServices/rbac 構建成功

============================================================
🔨 開始構建: microServices/drone
📂 當前目錄: /home/user/GitHub/AIOT/microServices/drone
🚀 執行 npm run build...
✅ microServices/drone 構建成功

... (其他項目)

============================================================
📊 構建報告
============================================================
✅ 成功項目 (4):
  ✓ microServices/rbac
  ✓ microServices/drone
  ✓ microServices/feSetting
  ✓ fe

============================================================
📈 統計信息:
  總項目數: 4
  成功: 4
  失敗: 0
  成功率: 100%

🎉 所有項目構建成功！語法檢查通過！
```

#### 錯誤處理

腳本會自動處理以下情況：

- 項目不存在
- package.json 不存在
- 沒有 build 腳本
- 依賴未安裝
- 構建超時
- 構建失敗

#### 注意事項

1. **首次運行**：如果項目沒有 node_modules，腳本會自動執行 `npm install`
2. **構建時間**：完整檢查可能需要幾分鐘時間，特別是首次運行時
3. **依賴要求**：需要 Node.js 和 npm 環境
4. **超時設置**：每個項目構建最多等待 5 分鐘

#### 常見用途

- **提交前檢查**：確保所有代碼語法正確
- **CI/CD 集成**：可以集成到自動化流程中
- **開發調試**：快速發現語法問題
- **依賴驗證**：確保所有依賴正常安裝

## 🛠 開發新腳本

如果需要添加新的腳本工具：

1. 在 `scripts/` 目錄創建新腳本
2. 設置執行權限：`chmod +x script-name.sh`
3. 更新此 README 文檔
4. 遵循現有的代碼風格和錯誤處理模式

## 🤝 貢獻

如果你有改進建議或發現問題，歡迎：

1. 提交 Issue
2. 創建 Pull Request
3. 與團隊討論新功能需求