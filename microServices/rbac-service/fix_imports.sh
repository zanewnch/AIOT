#!/bin/bash
# 批量修復 RBAC 服務的導入路徑錯誤

echo "🔧 開始修復 RBAC 服務導入路徑..."

# 進入 RBAC 服務目錄
cd /home/user/GitHub/AIOT/microServices/rbac-service

# 修復所有 .*Repositorysitorysitory.js 導入
find src/ -name "*.ts" -exec sed -i 's/from.*Repositorysitorysitory\.js/from "..\/..\/repositories\/queries\/Repository.js"/g' {} \;

# 修復所有 .*Service.js 導入  
find src/ -name "*.ts" -exec sed -i 's/from.*Service\.js/from "..\/Service.js"/g' {} \;

echo "✅ RBAC 服務導入路徑修復完成"
