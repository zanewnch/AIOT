#!/bin/bash

# 修復破損的導入語句
echo "Fixing broken import statements in rbac-service..."

# 修復 service 相關的導入
find ./src -name "*.ts" -type f | xargs sed -i 's/from\.\*Service\.js'\'';//g'
find ./src -name "*.ts" -type f | xargs sed -i 's/from\.\*Controller\.js'\'';//g'
find ./src -name "*.ts" -type f | xargs sed -i 's/from\.\*Repository\.js'\'';//g'

# 修復 Repository 名稱錯誤
find ./src -name "*.ts" -type f | xargs sed -i 's/Repositorysitory/Repository/g'

echo "Import statements fixed. Manual review and proper path correction needed."