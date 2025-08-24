#!/bin/bash

# MySQL 部署腳本 - 使用 Kustomize
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MYSQL_OVERLAY_DIR="$SCRIPT_DIR/../overlays/production/mysql"

echo "🚀 部署 MySQL 使用 Kustomize..."
echo "📁 Overlay 目錄: $MYSQL_OVERLAY_DIR"

# 檢查目錄是否存在
if [ ! -d "$MYSQL_OVERLAY_DIR" ]; then
    echo "❌ 錯誤: Kustomize overlay 目錄不存在: $MYSQL_OVERLAY_DIR"
    exit 1
fi

# 檢查是否有 kustomization.yaml
if [ ! -f "$MYSQL_OVERLAY_DIR/kustomization.yaml" ]; then
    echo "❌ 錯誤: kustomization.yaml 文件不存在"
    exit 1
fi

# 更新 ConfigMap（確保使用最新的 SQL 腳本）
echo "🔄 更新 ConfigMap..."
cd "$MYSQL_OVERLAY_DIR"
if [ -f "generate-configmap.sh" ]; then
    ./generate-configmap.sh
else
    echo "⚠️  警告: generate-configmap.sh 不存在，跳過 ConfigMap 更新"
fi

# 部署 MySQL
echo "📦 部署 MySQL..."
kubectl apply -k .

# 檢查部署狀態
echo "🔍 檢查部署狀態..."
kubectl rollout status deployment/aiot-prod-mysql-deployment -n aiot-prod --timeout=300s

echo "✅ MySQL 部署完成！"