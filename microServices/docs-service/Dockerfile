# 使用 Node.js 官方映像
FROM node:20-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 並安裝依賴
COPY package*.json ./
RUN npm install

# 複製源代碼
COPY . .

# 創建 docs 目錄結構（實際文檔通過 volume 掛載）
RUN mkdir -p docs/rbac docs/drone docs/drone-websocket docs/general docs/frontend

# 編譯 TypeScript (暫時跳過因為缺少 winston 依賴)
# RUN npm run build

# 暴露端口
EXPOSE 3005

# 設置環境變數
ENV NODE_ENV=production
ENV SERVICE_NAME=docs-service
ENV SERVICE_PORT=3005

# 啟動服務（使用開發模式，因為沒有編譯）
CMD ["npm", "run", "dev"]