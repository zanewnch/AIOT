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

EXPOSE 3003

# 執行階段：使用 npm start 啟動開發環境 (with nodemon)
CMD ["npm", "start"]