FROM node:18-bullseye

WORKDIR /app/be

# 複製 package 檔案
COPY package*.json ./

# 建置階段：安裝依賴
RUN npm install

# 建置階段：安裝全域套件（如果真的需要）
RUN npm install -g @anthropic-ai/claude-code @google/gemini-cli

# 建置階段：設定 Git（如果真的需要）
RUN git config --global user.name "zanewnch" && \
    git config --global user.email "zanewnch@gmail.com"

# 複製 .env 檔案（如果存在）
COPY .env* ./

# 複製程式碼
COPY . .

EXPOSE 8000

# 執行階段：使用 npm start 啟動開發環境 (with nodemon)
CMD ["npm", "start"]