FROM node:18-bullseye

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 建置階段：安裝依賴
RUN npm install

# 建置階段：安裝必要的全域套件
RUN npm install -g nodemon tsx

# 安裝 gRPC 健康檢查工具
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.19 && \
    wget -qO /usr/local/bin/grpc_health_probe \
    https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /usr/local/bin/grpc_health_probe

# 複製 .env 檔案（如果存在）
COPY .env* ./

# 複製程式碼
COPY . .

EXPOSE 3001

# 執行階段：使用 tsx 啟動  
CMD ["node", "--import", "tsx/esm", "src/server.ts"]