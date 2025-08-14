FROM node:18-bullseye

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 建置階段：安裝依賴
RUN npm install

# 建置階段：安裝必要的全域套件
RUN npm install -g nodemon tsx

# 複製 .env 檔案（如果存在）
COPY .env* ./

# 複製程式碼
COPY . .

EXPOSE 3001

# 執行階段：直接使用 node 啟動，跳過編譯問題
CMD ["node", "--loader", "ts-node/esm", "src/server-simple.ts"]