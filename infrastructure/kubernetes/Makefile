# AIOT Kubernetes 部署 Makefile
# 使用 Kustomize 進行配置管理

.PHONY: help deploy deploy-mysql deploy-all clean update-configmaps

# 默認目標
help:
	@echo "AIOT Kubernetes 部署命令："
	@echo "  make deploy-mysql    - 使用 Kustomize 部署 MySQL"
	@echo "  make deploy-all      - 部署所有服務"
	@echo "  make update-configmaps - 更新所有 ConfigMaps"
	@echo "  make clean           - 清理部署"

# 部署 MySQL 使用 Kustomize
deploy-mysql:
	@echo "🚀 部署 MySQL 使用 Kustomize..."
	cd overlays/production/mysql && \
	if [ -f "generate-configmap.sh" ]; then ./generate-configmap.sh; fi && \
	kubectl apply -k .
	@echo "✅ MySQL 部署完成"

# 更新 ConfigMaps
update-configmaps:
	@echo "🔄 更新 MySQL ConfigMaps..."
	cd overlays/production/mysql && ./generate-configmap.sh
	@echo "✅ ConfigMaps 更新完成"

# 部署所有服務
deploy-all: deploy-mysql
	@echo "🚀 部署所有 AIOT 服務..."
	./deploy.sh

# 清理部署
clean:
	@echo "🧹 清理 AIOT 部署..."
	kubectl delete namespace aiot-prod --ignore-not-found=true
	@echo "✅ 清理完成"

# 檢查狀態
status:
	@echo "📊 檢查 AIOT 服務狀態..."
	kubectl get pods -n aiot-prod
	kubectl get services -n aiot-prod