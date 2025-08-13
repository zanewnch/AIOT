# 使用 Node.js 官方映像
FROM node:20-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 並安裝依賴
COPY package*.json ./
RUN npm install

# 複製源代碼
COPY . .

# 複製所有微服務的文檔到容器內
COPY ../rbac/docs ./docs/rbac
COPY ../drone/docs ./docs/drone
COPY ../drone-websocket/docs ./docs/drone-websocket
COPY ../general/docs ./docs/general
COPY ../../fe/docs ./docs/frontend

# 編譯 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3005

# 設置環境變數
ENV NODE_ENV=production
ENV SERVICE_NAME=docs-service
ENV SERVICE_PORT=3005

# 啟動服務
CMD ["npm", "start"]