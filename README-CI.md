# 🚀 AIOT CI/CD 自動化測試系統

完全本地化的 CI/CD 解決方案，使用 GitHub Actions + act 實現。

## 📋 系統概覽

### 🎯 設計目標
- ✅ **完全本地執行** - 使用 act 替代雲端 GitHub Actions
- ✅ **快速反饋** - 分層測試策略，最快 2 分鐘獲得結果  
- ✅ **並行測試** - 8個微服務並行執行
- ✅ **完整報告** - HTML 格式的詳細測試報告
- ✅ **錯誤追蹤** - 編譯錯誤 + 執行錯誤 + Stack Trace

### 🏗️ 架構設計

```
AIOT CI/CD Pipeline
├── 靜態檢查層 (2-3分鐘)
│   ├── TypeScript 語法檢查
│   └── Python 語法檢查
├── 並行測試層 (10-15分鐘)  
│   ├── 微服務測試 (8個服務並行)
│   ├── 前端測試 (TypeScript + React)
│   └── Python 服務測試 (FastAPI + Django)
└── 報告生成層
    ├── 結果整合
    ├── HTML 報告生成
    └── 統計分析
```

## 🚀 快速開始

### 1. 環境準備

```bash
# 檢查依賴
docker --version    # 需要 Docker
act --version      # 已自動安裝

# 確保在專案根目錄
cd /home/user/GitHub/AIOT
```

### 2. 執行測試

```bash
# 快速模式 (2-3分鐘) - 只做語法檢查
./run-ci.sh quick

# 標準模式 (10-15分鐘) - 微服務 + 前端
./run-ci.sh standard

# 完整模式 (20-30分鐘) - 包含 Python 服務
./run-ci.sh full

# 查看所有選項
./run-ci.sh help
```

### 3. 查看報告

```bash
# 啟動報告服務器
./run-ci.sh serve

# 或手動啟動
python -m http.server 8080 --directory ci-reports
# 然後開啟: http://localhost:8080/final-report.html
```

## 📊 執行模式

| 模式 | 執行內容 | 預計時間 | 適用場景 |
|------|----------|----------|----------|
| `quick` | 靜態檢查 | 2-3分鐘 | 開發時快速驗證 |
| `standard` | 靜態 + 微服務 + 前端 | 10-15分鐘 | 提交前完整檢查 |
| `full` | 所有測試 | 20-30分鐘 | 發布前最終驗證 |

### 特定測試模式

```bash
./run-ci.sh microservices  # 只測試微服務
./run-ci.sh frontend       # 只測試前端
./run-ci.sh python         # 只測試 Python 服務
./run-ci.sh report         # 只生成報告
```

## 🔧 進階選項

```bash
# 預覽執行計劃
./run-ci.sh standard --dry-run

# 詳細執行日誌
./run-ci.sh full --verbose

# 列出所有可用 workflows
./run-ci.sh list
```

## 📁 檔案結構

```
.github/workflows/
├── main-ci.yml              # 主要 CI/CD 流程
├── microservices-test.yml   # 微服務測試
├── frontend-test.yml        # 前端測試
├── python-services-test.yml # Python 服務測試
└── test-report.yml          # 報告生成

ci-reports/                   # 測試報告目錄
├── final-report.html        # 最終 HTML 報告
├── latest-report.html       # 最新報告
└── final/                   # 詳細測試結果

.actrc                       # act 配置
.env.act                     # 測試環境變數
.env.microservices          # 微服務專用變數
run-ci.sh                   # 自動化執行腳本 ⭐
```

## 🎨 測試報告功能

### HTML 報告特色
- 📊 **視覺化儀表板** - 成功率圖表和統計
- 🔍 **詳細測試結果** - 每個服務的狀態和時間戳記
- 🎨 **響應式設計** - 支援桌面和手機瀏覽
- ⚡ **互動功能** - 可展開收合的詳細信息
- 🌈 **顏色編碼** - 綠色(成功) / 紅色(失敗) / 黃色(警告)

### 報告內容
- ✅ 測試通過數量和百分比
- ❌ 失敗測試詳細信息  
- 📈 歷史趨勢分析
- ⏱️ 執行時間統計
- 🐛 錯誤堆棧追蹤

## 🛠️ 故障排除

### 常見問題

**1. act 執行失敗**
```bash
# 檢查 Docker 是否運行
docker info

# 清理 Docker 容器
docker system prune
```

**2. 測試超時**
```bash
# 調整超時時間 (在 workflow 文件中)
timeout-minutes: 20
```

**3. 報告未生成**
```bash
# 檢查報告目錄
ls -la ci-reports/

# 手動執行報告生成
./run-ci.sh report
```

**4. 依賴安裝失敗**
```bash
# 清理 npm 快取
npm cache clean --force

# 刪除 node_modules 後重新安裝
find . -name "node_modules" -type d -prune -exec rm -rf {} +
```

## 📈 效能優化

### 提升執行速度
1. **使用本地快取** - npm/pip 依賴快取
2. **並行執行** - 多個服務同時測試  
3. **分層執行** - 快速失敗策略
4. **智能觸發** - 只測試變更的服務

### 資源管理
```bash
# 清理舊報告 (保留最近5個)
find ci-reports -name "html-report-*" -type d | sort -r | tail -n +6 | xargs rm -rf

# 監控 Docker 資源使用
docker stats
```

## 🔄 持續整合建議

### 開發工作流
```bash
# 1. 開發時快速檢查
git add .
./run-ci.sh quick

# 2. 提交前標準測試  
git commit -m "feature: 新功能"
./run-ci.sh standard

# 3. 推送前完整驗證
git push origin feature-branch
./run-ci.sh full
```

### Git Hooks 整合
```bash
# 在 .git/hooks/pre-commit 中添加
#!/bin/bash
./run-ci.sh quick
```

## 🤝 貢獻與支援

- 📧 問題回報：專案 Issues
- 📖 文檔：`CLAUDE.md`
- 🔧 配置：`.actrc` 和環境變數文件

---

*🤖 此文檔由 AIOT CI/CD 系統自動維護*