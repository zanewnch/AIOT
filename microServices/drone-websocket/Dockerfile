# AIOT Drone Real-time WebSocket Service Dockerfile
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製源代碼
COPY . .

# 建置 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3004

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# 啟動服務
CMD ["npm", "start"]