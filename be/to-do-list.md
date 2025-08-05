# date: 2025-06-24

- [x ] 下一步 是對 rbac table 的 testing
- [x ] 找一下 postman newman 的相關資訊 跟 使用jest testing
- [x ] 後來決定要用swagger 因為可以直接透過script 的方式來寫api doc

# date 2025-06-25

- [ ] 先寫好 api 的 requirement 才知道自己總共有哪些要處理, 跟寫好to-do-list

date: 2025-06-26

- [ ] 使用rabbitMQ
- [x] 使用gemini CLI
- [x] githubpage 這個也run 一個container, 為了port 使用正確且方便

# date 2025-07-12

- [x] 看typedoc 然後把fe request 寫好
- [x] 寫table 的request method and tsx
- [x] 分析tsdoc 介面的問題 為什麼controller 還是分散開來

# date 2025-07-15

- [x] 繼續修tableviewer
- [ ] 問AI 怎樣算熟ts 怎樣算熟sql 怎樣算熟express react 這種方式去學

# date 2025-07-17

- [ ] jwt reddis
- [ ] permission logic 實作
  micro service

# date 2025-7-26

- [ ] 修改controller 對 service 的DI

# date 2025-7-27

- [ ] be api design, frontend cache, micro service config(and general middleware), kubernetes, rabbitmq implement

# date 2025-7-28

- [ ] 下一步 從new model 創建repo 開始做

# date 2025-7-30

- [ ] 做websocket and rabbitmq and microserive
- [ ] 做frontend 修改 like feature-design.md

# date 2025-8-4

- [ ] websocket, connection pool, message queue, micro service, frontend(add be connection to page file, start from
  data analysis page), sql script for db initialization
- [ ] 準備面試內容



fe

NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_o0dWCymZaMZRzN6Uy2Rt3U_L56L_eH0

# Simulation Mode Configuration
VITE_ENABLE_SIMULATE_MODE=true

be


NODE_ENV=development
JWT_SECRET=zanewnch
PORT=8000

# Database Configuration for Docker
DB_HOST=aiot-mysqldb
DB_PORT=3306
DB_NAME=main_db
DB_USER=admin
DB_PASSWORD=admin

# Redis Configuration for Docker
REDIS_HOST=aiot-redis
REDIS_PORT=6379
REDIS_DB=0

# MongoDB Configuration for Docker
MONGODB_URL=mongodb://admin:admin@aiot-mongodb:27017/main_db?authSource=admin

# RabbitMQ Configuration for Docker
RABBITMQ_URL=amqp://admin:admin@aiot-rabbitmq:5672/
