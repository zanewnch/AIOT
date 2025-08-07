# AIOT 微服務架構設計

## 🏗️ Kong + Consul 微服務架構

### 🎯 架構設計原則
- **微服務模式**: 每個服務獨立部署、獨立資料庫、獨立擴展
- **CQRS模式**: Command/Query Responsibility Segregation (讀寫分離)
- **分層架構**: Controller → Service → Repository 三層架構
- **編排式 Saga**: 集中協調分散式事務
- **服務發現**: Consul 自動服務註冊與發現

### 📁 目錄結構
```
AIOT/
├── services/
│   ├── rbac-service/               # RBAC服務 (Port: 3001)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nodemon.json
│   │   ├── .env
│   │   ├── .dockerignore
│   │   ├── .gitignore
│   │   ├── src/
│   │   │   ├── app.ts              # Express + gRPC Server
│   │   │   ├── server.ts           # 服務啟動 + Consul 註冊
│   │   │   ├── container/
│   │   │   │   ├── container.ts    # InversifyJS 容器配置
│   │   │   │   └── types.ts        # 依賴注入類型定義
│   │   │   ├── controllers/        # CQRS Controllers
│   │   │   │   ├── commands/       # Command Controllers (CUD)
│   │   │   │   │   ├── UserCommandsCtrl.ts
│   │   │   │   │   ├── RoleCommandsCtrl.ts
│   │   │   │   │   ├── PermissionCommandsCtrl.ts
│   │   │   │   │   ├── UserToRoleCommandsCtrl.ts
│   │   │   │   │   └── RoleToPermissionCommandsCtrl.ts
│   │   │   │   ├── queries/        # Query Controllers (R)
│   │   │   │   │   ├── UserQueriesCtrl.ts
│   │   │   │   │   ├── RoleQueriesCtrl.ts
│   │   │   │   │   ├── PermissionQueriesCtrl.ts
│   │   │   │   │   ├── UserToRoleQueriesCtrl.ts
│   │   │   │   │   └── RoleToPermissionQueriesCtrl.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/           # Business Logic Layer
│   │   │   │   ├── commands/       # Command Services
│   │   │   │   │   ├── UserCommandsSvc.ts
│   │   │   │   │   ├── RoleCommandsSvc.ts
│   │   │   │   │   ├── PermissionCommandsSvc.ts
│   │   │   │   │   ├── UserToRoleCommandsSvc.ts
│   │   │   │   │   └── RoleToPermissionCommandsSvc.ts
│   │   │   │   ├── queries/        # Query Services
│   │   │   │   │   ├── UserQueriesSvc.ts
│   │   │   │   │   ├── RoleQueriesSvc.ts
│   │   │   │   │   ├── PermissionQueriesSvc.ts
│   │   │   │   │   ├── UserToRoleQueriesSvc.ts
│   │   │   │   │   └── RoleToPermissionQueriesSvc.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/       # Data Access Layer
│   │   │   │   ├── commands/       # Command Repositories (CUD)
│   │   │   │   │   ├── UserCommandsRepo.ts
│   │   │   │   │   ├── RoleCommandsRepo.ts
│   │   │   │   │   ├── PermissionCommandsRepo.ts
│   │   │   │   │   ├── UserRoleCommandsRepo.ts
│   │   │   │   │   └── RolePermissionCommandsRepo.ts
│   │   │   │   ├── queries/        # Query Repositories (R)
│   │   │   │   │   ├── UserQueriesRepo.ts
│   │   │   │   │   ├── RoleQueriesRepo.ts
│   │   │   │   │   ├── PermissionQueriesRepo.ts
│   │   │   │   │   ├── UserRoleQueriesRepo.ts
│   │   │   │   │   └── RolePermissionQueriesRepo.ts
│   │   │   │   └── index.ts
│   │   │   ├── models/             # Data Models
│   │   │   │   ├── UserModel.ts
│   │   │   │   ├── RoleModel.ts
│   │   │   │   ├── PermissionModel.ts
│   │   │   │   ├── UserToRoleModel.ts
│   │   │   │   └── RoleToPermissionModel.ts
│   │   │   ├── routes/             # HTTP REST API Routes
│   │   │   │   ├── index.ts
│   │   │   │   ├── userRoutes.ts
│   │   │   │   ├── roleRoutes.ts
│   │   │   │   ├── permissionRoutes.ts
│   │   │   │   └── healthRoutes.ts
│   │   │   ├── grpc/               # gRPC 服務定義
│   │   │   │   ├── proto/          # Protocol Buffer定義
│   │   │   │   │   ├── user.proto
│   │   │   │   │   ├── role.proto
│   │   │   │   │   ├── permission.proto
│   │   │   │   │   └── common.proto
│   │   │   │   ├── handlers/       # gRPC Handler實作
│   │   │   │   │   ├── UserGrpcHandler.ts
│   │   │   │   │   ├── RoleGrpcHandler.ts
│   │   │   │   │   └── PermissionGrpcHandler.ts
│   │   │   │   ├── server.ts       # gRPC Server 設定
│   │   │   │   └── client.ts       # gRPC Client 工具
│   │   │   ├── configs/            # 配置檔案
│   │   │   │   ├── database.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── consul.ts
│   │   │   │   └── grpc.ts
│   │   │   ├── middleware/
│   │   │   │   ├── rbac-specific.ts    # RBAC 服務特定中間件
│   │   │   │   └── permission-check.ts # 權限檢查中間件
│   │   │   ├── utils/
│   │   │   │   ├── ControllerResult.ts
│   │   │   │   ├── ServiceResult.ts
│   │   │   │   └── constants.ts
│   │   │   └── types/              # 服務特定類型定義
│   │   │       ├── interfaces.ts
│   │   │       ├── enums.ts
│   │   │       └── dto.ts
│   │   ├── consul/
│   │   │   ├── service-config.json
│   │   │   └── health-check.js
│   │   ├── database/               # 獨立RBAC資料庫
│   │   │   ├── migrations/
│   │   │   │   ├── 001-create-users.sql
│   │   │   │   ├── 002-create-roles.sql
│   │   │   │   ├── 003-create-permissions.sql
│   │   │   │   ├── 004-create-user-roles.sql
│   │   │   │   └── 005-create-role-permissions.sql
│   │   │   ├── seeds/
│   │   │   │   ├── users.sql
│   │   │   │   ├── roles.sql
│   │   │   │   └── permissions.sql
│   │   │   └── init/
│   │   │       └── init.sql
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   └── controllers/
│   │   │   ├── integration/
│   │   │   │   ├── api/
│   │   │   │   └── grpc/
│   │   │   └── fixtures/
│   │   │       └── testData.ts
│   │   ├── docs/
│   │   │   ├── api.md
│   │   │   ├── grpc.md
│   │   │   └── deployment.md
│   │   └── dist/                   # 編譯輸出目錄
│   │
│   ├── drone-service/              # 無人機服務 (Port: 3002)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nodemon.json
│   │   ├── .env
│   │   ├── .dockerignore
│   │   ├── .gitignore
│   │   ├── src/
│   │   │   ├── app.ts              # Express + Socket.IO + gRPC Server
│   │   │   ├── server.ts           # 服務啟動 + Consul 註冊
│   │   │   ├── container/
│   │   │   │   ├── container.ts    # InversifyJS 容器配置
│   │   │   │   └── types.ts        # 依賴注入類型定義
│   │   │   ├── controllers/        # CQRS Controllers
│   │   │   │   ├── commands/       # Command Controllers (CUD)
│   │   │   │   │   ├── DroneCommandsCtrl.ts
│   │   │   │   │   ├── DroneStatusCommandsCtrl.ts
│   │   │   │   │   ├── DronePositionCommandsCtrl.ts
│   │   │   │   │   ├── DroneCommandQueueCommandsCtrl.ts
│   │   │   │   │   ├── DroneRealTimeStatusCommandsCtrl.ts
│   │   │   │   │   ├── DroneCommandsArchiveCommandsCtrl.ts
│   │   │   │   │   ├── DroneStatusArchiveCommandsCtrl.ts
│   │   │   │   │   ├── DronePositionsArchiveCommandsCtrl.ts
│   │   │   │   │   └── ArchiveTaskCommandsCtrl.ts
│   │   │   │   ├── queries/        # Query Controllers (R)
│   │   │   │   │   ├── DroneQueriesCtrl.ts
│   │   │   │   │   ├── DroneStatusQueriesCtrl.ts
│   │   │   │   │   ├── DronePositionQueriesCtrl.ts
│   │   │   │   │   ├── DroneCommandQueriesCtrl.ts
│   │   │   │   │   ├── DroneCommandQueueQueriesCtrl.ts
│   │   │   │   │   ├── DroneRealTimeStatusQueriesCtrl.ts
│   │   │   │   │   ├── DroneCommandsArchiveQueriesCtrl.ts
│   │   │   │   │   ├── DroneStatusArchiveQueriesCtrl.ts
│   │   │   │   │   ├── DronePositionsArchiveQueriesCtrl.ts
│   │   │   │   │   └── ArchiveTaskQueriesCtrl.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/           # Business Logic Layer
│   │   │   │   ├── commands/       # Command Services
│   │   │   │   │   ├── DroneCommandsSvc.ts
│   │   │   │   │   ├── DroneStatusCommandsSvc.ts
│   │   │   │   │   ├── DronePositionCommandsSvc.ts
│   │   │   │   │   ├── DroneCommandQueueCommandsSvc.ts
│   │   │   │   │   ├── DroneRealTimeStatusCommandsSvc.ts
│   │   │   │   │   ├── DroneCommandsArchiveCommandsSvc.ts
│   │   │   │   │   ├── DroneStatusArchiveCommandsSvc.ts
│   │   │   │   │   ├── DronePositionsArchiveCommandsSvc.ts
│   │   │   │   │   └── ArchiveTaskCommandsSvc.ts
│   │   │   │   ├── queries/        # Query Services
│   │   │   │   │   ├── DroneQueriesSvc.ts
│   │   │   │   │   ├── DroneStatusQueriesSvc.ts
│   │   │   │   │   ├── DronePositionQueriesSvc.ts
│   │   │   │   │   ├── DroneCommandQueriesSvc.ts
│   │   │   │   │   ├── DroneCommandQueueQueriesSvc.ts
│   │   │   │   │   ├── DroneRealTimeStatusQueriesSvc.ts
│   │   │   │   │   ├── DroneCommandsArchiveQueriesSvc.ts
│   │   │   │   │   ├── DroneStatusArchiveQueriesSvc.ts
│   │   │   │   │   ├── DronePositionsArchiveQueriesSvc.ts
│   │   │   │   │   └── ArchiveTaskQueriesSvc.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/       # Data Access Layer
│   │   │   │   ├── commands/       # Command Repositories (CUD)
│   │   │   │   │   ├── DroneCommandsRepo.ts
│   │   │   │   │   ├── DroneStatusCommandsRepo.ts
│   │   │   │   │   ├── DronePositionCommandsRepo.ts
│   │   │   │   │   ├── DroneCommandQueueCommandsRepo.ts
│   │   │   │   │   ├── DroneRealTimeStatusCommandsRepo.ts
│   │   │   │   │   ├── DroneCommandsArchiveCommandsRepo.ts
│   │   │   │   │   ├── DroneStatusArchiveCommandsRepo.ts
│   │   │   │   │   ├── DronePositionsArchiveCommandsRepo.ts
│   │   │   │   │   └── ArchiveTaskCommandsRepo.ts
│   │   │   │   ├── queries/        # Query Repositories (R)
│   │   │   │   │   ├── DroneQueriesRepo.ts
│   │   │   │   │   ├── DroneStatusQueriesRepo.ts
│   │   │   │   │   ├── DronePositionQueriesRepo.ts
│   │   │   │   │   ├── DroneCommandQueriesRepo.ts
│   │   │   │   │   ├── DroneCommandQueueQueriesRepo.ts
│   │   │   │   │   ├── DroneRealTimeStatusQueriesRepo.ts
│   │   │   │   │   ├── DroneCommandsArchiveQueriesRepo.ts
│   │   │   │   │   ├── DroneStatusArchiveQueriesRepo.ts
│   │   │   │   │   ├── DronePositionsArchiveQueriesRepo.ts
│   │   │   │   │   └── ArchiveTaskQueriesRepo.ts
│   │   │   │   └── index.ts
│   │   │   ├── models/             # Data Models (Drone相關所有模型)
│   │   │   │   ├── DroneModel.ts
│   │   │   │   ├── DroneCommandModel.ts
│   │   │   │   ├── DroneStatusModel.ts
│   │   │   │   ├── DronePositionModel.ts
│   │   │   │   ├── DroneCommandQueueModel.ts
│   │   │   │   ├── DroneRealTimeStatusModel.ts
│   │   │   │   ├── DroneCommandsArchiveModel.ts
│   │   │   │   ├── DroneStatusArchiveModel.ts
│   │   │   │   ├── DronePositionsArchiveModel.ts
│   │   │   │   └── ArchiveTaskModel.ts
│   │   │   ├── routes/             # HTTP REST API Routes
│   │   │   │   ├── index.ts
│   │   │   │   ├── droneRoutes.ts
│   │   │   │   ├── droneCommandRoutes.ts
│   │   │   │   ├── droneStatusRoutes.ts
│   │   │   │   ├── dronePositionRoutes.ts
│   │   │   │   ├── droneCommandQueueRoutes.ts
│   │   │   │   ├── droneRealTimeStatusRoutes.ts
│   │   │   │   ├── droneCommandsArchiveRoutes.ts
│   │   │   │   ├── droneStatusArchiveRoutes.ts
│   │   │   │   ├── dronePositionsArchiveRoutes.ts
│   │   │   │   ├── archiveTaskRoutes.ts
│   │   │   │   └── healthRoutes.ts
│   │   │   ├── grpc/               # gRPC 服務定義
│   │   │   │   ├── proto/          # Protocol Buffer定義
│   │   │   │   │   ├── drone.proto
│   │   │   │   │   ├── command.proto
│   │   │   │   │   ├── status.proto
│   │   │   │   │   ├── position.proto
│   │   │   │   │   ├── archive.proto
│   │   │   │   │   └── common.proto
│   │   │   │   ├── handlers/       # gRPC Handler實作
│   │   │   │   │   ├── DroneGrpcHandler.ts
│   │   │   │   │   ├── CommandGrpcHandler.ts
│   │   │   │   │   ├── StatusGrpcHandler.ts
│   │   │   │   │   ├── PositionGrpcHandler.ts
│   │   │   │   │   └── ArchiveGrpcHandler.ts
│   │   │   │   ├── server.ts       # gRPC Server 設定
│   │   │   │   └── client.ts       # gRPC Client 工具
│   │   │   ├── websocket/          # WebSocket 處理
│   │   │   │   ├── handlers/       # WebSocket事件處理器
│   │   │   │   │   ├── DroneStatusHandler.ts
│   │   │   │   │   ├── DronePositionHandler.ts
│   │   │   │   │   ├── DroneCommandHandler.ts
│   │   │   │   │   └── DroneEventHandler.ts
│   │   │   │   ├── namespaces/     # Socket.IO命名空間
│   │   │   │   │   ├── droneStatus.ts
│   │   │   │   │   ├── dronePosition.ts
│   │   │   │   │   ├── droneCommand.ts
│   │   │   │   │   └── droneEvents.ts
│   │   │   │   ├── events/         # 事件定義
│   │   │   │   │   ├── DroneEvents.ts
│   │   │   │   │   ├── CommandEvents.ts
│   │   │   │   │   └── StatusEvents.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── socketAuth.ts
│   │   │   │   │   └── socketLogger.ts
│   │   │   │   └── server.ts       # Socket.IO Server 設定
│   │   │   ├── configs/            # 配置檔案
│   │   │   │   ├── database.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── consul.ts
│   │   │   │   ├── grpc.ts
│   │   │   │   ├── websocket.ts
│   │   │   │   └── rabbitmq.ts
│   │   │   ├── middleware/
│   │   │   │   ├── drone-auth.ts        # 無人機特定認證中間件
│   │   │   │   └── command-validation.ts # 命令驗證中間件
│   │   │   ├── utils/
│   │   │   │   ├── ControllerResult.ts
│   │   │   │   ├── ServiceResult.ts
│   │   │   │   └── constants.ts
│   │   │   └── types/              # 服務特定類型定義
│   │   │       ├── interfaces.ts
│   │   │       ├── enums.ts
│   │   │       └── dto.ts
│   │   ├── consul/
│   │   │   ├── service-config.json
│   │   │   └── health-check.js
│   │   ├── database/               # 獨立無人機資料庫
│   │   │   ├── migrations/
│   │   │   │   ├── 001-create-drones.sql
│   │   │   │   ├── 002-create-drone-commands.sql
│   │   │   │   ├── 003-create-drone-status.sql
│   │   │   │   ├── 004-create-drone-positions.sql
│   │   │   │   ├── 005-create-drone-command-queue.sql
│   │   │   │   ├── 006-create-drone-real-time-status.sql
│   │   │   │   ├── 007-create-drone-commands-archive.sql
│   │   │   │   ├── 008-create-drone-status-archive.sql
│   │   │   │   ├── 009-create-drone-positions-archive.sql
│   │   │   │   └── 010-create-archive-tasks.sql
│   │   │   ├── seeds/
│   │   │   │   ├── drones.sql
│   │   │   │   ├── drone-commands.sql
│   │   │   │   └── drone-status.sql
│   │   │   └── init/
│   │   │       └── init.sql
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── controllers/
│   │   │   │   └── websocket/
│   │   │   ├── integration/
│   │   │   │   ├── api/
│   │   │   │   ├── grpc/
│   │   │   │   └── websocket/
│   │   │   └── fixtures/
│   │   │       └── testData.ts
│   │   ├── docs/
│   │   │   ├── api.md
│   │   │   ├── grpc.md
│   │   │   ├── websocket.md
│   │   │   └── deployment.md
│   │   └── dist/                   # 編譯輸出目錄
│   │
│   └── user-preference-service/    # 用戶偏好服務 (Port: 3003)
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── nodemon.json
│       ├── .env
│       ├── .dockerignore
│       ├── .gitignore
│       ├── src/
│       │   ├── app.ts              # Express + gRPC Server
│       │   ├── server.ts           # 服務啟動 + Consul 註冊
│       │   ├── container/
│       │   │   ├── container.ts    # InversifyJS 容器配置
│       │   │   └── types.ts        # 依賴注入類型定義
│       │   ├── controllers/        # CQRS Controllers
│       │   │   ├── commands/       # Command Controllers (CUD)
│       │   │   │   └── UserPreferenceCommandsCtrl.ts
│       │   │   ├── queries/        # Query Controllers (R)
│       │   │   │   └── UserPreferenceQueriesCtrl.ts
│       │   │   └── index.ts
│       │   ├── services/           # Business Logic Layer
│       │   │   ├── commands/       # Command Services
│       │   │   │   └── UserPreferenceCommandsSvc.ts
│       │   │   ├── queries/        # Query Services
│       │   │   │   └── UserPreferenceQueriesSvc.ts
│       │   │   └── index.ts
│       │   ├── repositories/       # Data Access Layer
│       │   │   ├── commands/       # Command Repositories (CUD)
│       │   │   │   └── UserPreferenceCommandsRepo.ts
│       │   │   ├── queries/        # Query Repositories (R)
│       │   │   │   └── UserPreferenceQueriesRepo.ts
│       │   │   └── index.ts
│       │   ├── models/             # Data Models
│       │   │   └── UserPreferenceModel.ts
│       │   ├── routes/             # HTTP REST API Routes
│       │   │   ├── index.ts
│       │   │   ├── userPreferenceRoutes.ts
│       │   │   └── healthRoutes.ts
│       │   ├── grpc/               # gRPC 服務定義
│       │   │   ├── proto/          # Protocol Buffer定義
│       │   │   │   ├── user-preference.proto
│       │   │   │   └── common.proto
│       │   │   ├── handlers/       # gRPC Handler實作
│       │   │   │   └── UserPreferenceGrpcHandler.ts
│       │   │   ├── server.ts       # gRPC Server 設定
│       │   │   └── client.ts       # gRPC Client 工具
│       │   ├── configs/            # 配置檔案
│       │   │   ├── database.ts
│       │   │   ├── logger.ts
│       │   │   ├── consul.ts
│       │   │   └── grpc.ts
│       │   ├── middleware/
│       │   │   └── user-preference-validation.ts # 用戶偏好驗證中間件
│       │   ├── utils/
│       │   │   ├── ControllerResult.ts
│       │   │   ├── ServiceResult.ts
│       │   │   └── constants.ts
│       │   └── types/              # 服務特定類型定義
│       │       ├── interfaces.ts
│       │       ├── enums.ts
│       │       └── dto.ts
│       ├── consul/
│       │   ├── service-config.json
│       │   └── health-check.js
│       ├── database/               # 獨立用戶偏好資料庫
│       │   ├── migrations/
│       │   │   └── 001-create-user-preferences.sql
│       │   ├── seeds/
│       │   │   └── user-preferences.sql
│       │   └── init/
│       │       └── init.sql
│       ├── tests/
│       │   ├── unit/
│       │   │   ├── services/
│       │   │   ├── repositories/
│       │   │   └── controllers/
│       │   ├── integration/
│       │   │   ├── api/
│       │   │   └── grpc/
│       │   ├── fixtures/
│       │   │   └── testData.ts
│       │   └── setup/
│       │       ├── testSetup.ts
│       │       └── testTeardown.ts
│       ├── docs/
│       │   ├── api.md
│       │   ├── grpc.md
│       │   └── deployment.md
│       └── dist/                   # 編譯輸出目錄
│
├── infrastructure/                # 基礎設施配置
│   ├── kong/                      # Kong API Gateway 配置
│   │   ├── kong.yml               # Kong 聲明式配置
│   │   ├── kong.conf              # Kong 配置檔案
│   │   ├── plugins/               # 自定義插件
│   │   │   ├── auth-plugin.lua    # 認證插件
│   │   │   ├── rate-limit-plugin.lua # 限流插件
│   │   │   └── logging-plugin.lua # 日誌插件
│   │   ├── migrations/            # Kong 資料庫遷移
│   │   │   ├── 001_initial.sql
│   │   │   └── 002_add_services.sql
│   │   └── scripts/
│   │       ├── setup-kong.sh      # Kong 初始化腳本
│   │       └── register-services.sh # 服務註冊腳本
│   │
│   ├── consul/                    # Consul 服務發現配置
│   │   ├── consul.json            # Consul 主配置
│   │   ├── server.hcl             # HCL 格式配置
│   │   ├── services/              # 服務定義
│   │   │   ├── rbac-service.json
│   │   │   ├── drone-service.json
│   │   │   ├── user-preference-service.json
│   │   │   └── kong-service.json
│   │   ├── policies/              # ACL 政策
│   │   │   ├── service-policy.hcl
│   │   │   └── admin-policy.hcl
│   │   ├── keys/                  # Key-Value 配置
│   │   │   ├── global-config.json
│   │   │   ├── rbac-config.json
│   │   │   ├── drone-config.json
│   │   │   └── user-preference-config.json
│   │   └── scripts/
│   │       ├── setup-consul.sh    # Consul 初始化腳本
│   │       └── register-services.sh # 服務註冊腳本
│   │
│   ├── docker/                    # Docker 容器化配置
│   │   ├── docker-compose.yml     # 開發環境編排檔案
│   │   └── .env                   # 環境變數配置
│   │
│   ├── config/                   # 基礎設施配置
│   │   ├── rabbitmq/
│   │   │   ├── rabbitmq.conf      # RabbitMQ 配置
│   │   │   └── definitions.json   # 佇列和交換器定義
│   │   └── ollama/
│   │       ├── npu.json           # NPU 配置
│   │       └── setup-npu.sh       # NPU 設定腳本
│   │
│   ├── security/                  # 安全配置
│   │   ├── ssl/
│   │   │   ├── certificates/
│   │   │   │   ├── ca.crt         # 根證書
│   │   │   │   ├── server.crt     # 服務器證書
│   │   │   │   └── server.key     # 服務器私鑰
│   │   │   ├── generate-certs.sh  # 證書生成腳本
│   │   │   └── renew-certs.sh     # 證書更新腳本
│   │   ├── vault/
│   │   │   ├── vault.hcl          # Vault 配置
│   │   │   ├── policies/
│   │   │   │   ├── service-policy.hcl
│   │   │   │   └── admin-policy.hcl
│   │   │   └── auth/
│   │   │       ├── jwt-auth.hcl
│   │   │       └── kubernetes-auth.hcl
│   │   └── network/
│   │       ├── firewall.conf      # 防火牆規則
│   │       ├── iptables.rules     # iptables 規則
│   │       └── security-groups.yml # 安全組配置
│   │
│
├── packages/                      # 共用中間件套件庫
│   ├── package.json               # 套件根配置
│   └── aiot-middleware/           # @aiot/middleware - 通用中間件
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── auth-middleware.ts     # JWT 認證中間件
│           ├── rbac-middleware.ts     # 權限檢查中間件
│           ├── error-handler.ts       # 錯誤處理中間件
│           ├── logger-middleware.ts   # 請求日誌中間件
│           ├── rate-limiter.ts        # 限流中間件
│           ├── cors-handler.ts        # CORS 處理
│           ├── request-validator.ts   # 請求驗證中間件
│           └── response-formatter.ts  # 統一回應格式中間件
│
├── gateway/                       # API Gateway 設定檔
│   ├── kong/
│   │   ├── declarative/           # Kong 聲明式配置
│   │   │   ├── kong.yaml          # 主配置檔案
│   │   │   ├── services.yaml      # 服務定義
│   │   │   ├── routes.yaml        # 路由規則
│   │   │   ├── plugins.yaml       # 插件配置
│   │   │   └── upstreams.yaml     # 上游服務配置
│   │   ├── templates/             # 配置模板
│   │   │   ├── service.template.yaml
│   │   │   ├── route.template.yaml
│   │   │   └── plugin.template.yaml
│   │   └── scripts/
│   │       ├── generate-config.sh  # 配置生成腳本
│   │       ├── validate-config.sh  # 配置驗證腳本
│   │       └── reload-config.sh    # 配置重載腳本
│
├── docs/                          # 基礎文檔
│   ├── README.md                  # 項目說明
│   └── ARCHITECTURE.md            # 架構設計文檔
│
├── .github/                       # GitHub 配置
│   ├── workflows/                 # GitHub Actions 工作流
│   │   ├── ci.yml                 # 持續集成
│   │   ├── cd.yml                 # 持續部署
│   │   ├── security-scan.yml      # 安全掃描
│   │   ├── dependency-check.yml   # 依賴檢查
│   │   └── release.yml            # 發布流程
│   ├── ISSUE_TEMPLATE/            # Issue 模板
│   │   ├── bug_report.md          # Bug 報告模板
│   │   ├── feature_request.md     # 功能請求模板
│   │   └── question.md            # 問題模板
│   ├── PULL_REQUEST_TEMPLATE.md   # PR 模板
│   └── CODEOWNERS                 # 代碼所有者
│
├── .gitignore                     # Git 忽略檔案
├── .dockerignore                  # Docker 忽略檔案
├── .env                           # 環境變數配置
├── .editorconfig                  # 編輯器配置
├── .nvmrc                         # Node.js 版本配置
├── package.json                   # 根項目 package.json
├── lerna.json                     # Lerna 配置
├── tsconfig.json                  # 根 TypeScript 配置
├── jest.config.js                 # Jest 測試配置
├── docker-compose.yml             # Docker Compose 主配置
├── docker-compose.dev.yml         # 開發環境 Docker Compose
├── docker-compose.prod.yml        # 生產環境 Docker Compose
└── README.md                      # 項目說明
```

## 🌐 架構組件說明

### 1. Kong API Gateway
- **作用**: 統一入口、路由轉發、認證、限流、日誌
- **Port**: 8000 (HTTP), 8443 (HTTPS), 8001 (Admin API)
- **功能**:
  - 動態路由到微服務
  - JWT 認證整合
  - 請求/回應轉換
  - 限流和安全防護

### 2. Consul Service Discovery
- **作用**: 服務註冊與發現、健康檢查、配置管理
- **Port**: 8500 (HTTP UI), 8600 (DNS)
- **功能**:
  - 自動服務註冊
  - 健康狀態監控
  - 服務間通訊發現
  - 配置中心

### 3. 微服務列表

| 服務名稱 | 端口 | 功能描述 | 資料庫 | 通訊協議 |
|---------|------|----------|--------|----------|
| rbac-service | 3001 | 角色權限管理、用戶管理 | rbac_db | HTTP + gRPC |
| drone-service | 3002 | 無人機管理、命令、歷史、WebSocket | drone_db | HTTP + gRPC + WebSocket |
| user-preference-service | 3003 | 用戶偏好設定 | preference_db | HTTP + gRPC |

## 🔄 服務間通訊

### 對外 API (客戶端調用)
```
Client → Kong Gateway → Consul (服務發現) → 微服務 (HTTP REST)
```

### WebSocket 連線
```
Client → Kong Gateway (WebSocket支援) → drone-service (Socket.IO)
```

### 服務間通訊 (高效能)
```
微服務A → Consul (服務發現) → 微服務B (gRPC)
```

### 異步通訊
```
微服務 → RabbitMQ → 其他微服務 (事件驅動)
```

### 跨服務事務 (編排式 Saga)
```
業務服務 → Saga Orchestrator → 依序協調多個微服務
                              ↓
                    失敗時觸發補償操作 (Compensation)
```

## 🚀 部署流程

### 1. 啟動基礎設施
```bash
# 啟動 Consul + Kong + 資料庫
docker-compose up consul kong postgres redis rabbitmq -d
```

### 2. 啟動微服務
```bash
# 啟動所有微服務 (自動註冊到 Consul)
docker-compose up rbac-service drone-service user-preference-service -d
```

### 3. Kong 路由自動配置
```bash
# Kong 透過 Consul 自動發現服務並配置路由
# 支援自動健康檢查和故障轉移
```

### 4. 擴展服務 (Kubernetes 就緒)
```bash
# 水平擴展無人機服務
kubectl scale deployment drone-service --replicas=3
```

## 🛡️ 安全考量

### 1. 服務間認證
- 使用 mTLS (Mutual TLS)
- JWT Token 傳遞
- API Key 驗證

### 2. Kong 安全插件
- Rate Limiting
- CORS
- IP Restriction
- Request/Response Transformation

## 📊 監控與日誌

### 1. 健康檢查
- Consul Health Checks
- Kong Upstream Health
- 自定義健康端點

### 2. 日誌聚合
- Kong Access Logs
- 微服務應用日誌
- Consul 操作日誌

### 3. 指標收集
- Kong Prometheus Plugin
- 服務級別指標
- 基礎設施指標

## 🔧 開發與測試

### 1. 本地開發
```bash
# 啟動單一服務進行開發
cd services/auth-service
npm run dev
```

### 2. 整合測試
```bash
# 啟動完整環境
docker-compose -f docker-compose.dev.yml up
```

### 3. 服務測試
- 單元測試: 各服務獨立測試
- 整合測試: 通過 Kong Gateway 測試
- gRPC 測試: 服務間通訊測試
- 端到端測試: 模擬真實用戶流程

## 🎯 技術棧總結

### 微服務核心
- **API Gateway**: Kong
- **服務發現**: Consul
- **容器化**: Docker + Docker Compose
- **編排**: Kubernetes (生產環境)
- **套件管理**: Lerna Monorepo + 7個npm packages

### 通訊協議
- **對外API**: HTTP REST
- **服務間**: gRPC (高效能)
- **即時通訊**: WebSocket (Socket.IO)
- **異步**: RabbitMQ

### 資料存儲
- **主資料庫**: MySQL 8.0 (每服務獨立)
- **快取**: Redis
- **分散式事務**: 編排式 Saga Pattern

### 認證授權
- **認證庫**: 共用 @aiot/auth 套件
- **中間件**: 共用 @aiot/middleware 套件
- **協議**: JWT + mTLS
- **授權**: RBAC (角色權限控制)

### 監控運維
- **健康檢查**: Consul + Kong
- **日誌**: 統一日誌收集
- **指標**: Prometheus + Grafana
- **追蹤**: Jaeger (分散式追蹤)

## 📦 Monorepo 套件庫管理

### 為何使用 npm packages?

1. **跨設備部署靈活性**：
   - 不同設備可以只安裝需要的套件
   - 邊緣設備可能只需要 `@aiot/auth` + `@aiot/grpc`
   - 中央服務器可以安裝完整的套件組合

2. **版本管理**：
   - 每個套件獨立版本控制
   - 微服務可以選擇相容的版本
   - 向後相容性保證

3. **團隊協作**：
   - 不同團隊可以維護不同套件
   - 清晰的 API 界面定義
   - 獨立的測試和發布週期

### 套件依賴關係

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Services  │───▶│ @aiot/auth      │───▶│ @aiot/types │
│             │    └─────────────────┘    └─────────────┘
│             │    ┌─────────────────┐           ▲
│             │───▶│ @aiot/grpc      │───────────┤
│             │    └─────────────────┘           │
│             │    ┌─────────────────┐           │
│             │───▶│ @aiot/middleware│───────────┤
│             │    └─────────────────┘           │
│             │    ┌─────────────────┐    ┌──────┴──────┐
│             │───▶│ @aiot/saga      │───▶│@aiot/consul │
│             │    └─────────────────┘    └─────────────┘
│             │    ┌─────────────────┐
│             │───▶│ @aiot/utils     │
└─────────────┘    └─────────────────┘
```

### 套件使用範例

```typescript
// rbac-service/package.json
{
  "dependencies": {
    "@aiot/types": "^1.0.0",
    "@aiot/auth": "^1.0.0", 
    "@aiot/grpc": "^1.0.0",
    "@aiot/consul": "^1.0.0",
    "@aiot/middleware": "^1.0.0",  // 共用中間件
    "@aiot/utils": "^1.0.0"
  }
}

// drone-service/package.json  
{
  "dependencies": {
    "@aiot/types": "^1.0.0",
    "@aiot/auth": "^1.0.0",
    "@aiot/grpc": "^1.0.0", 
    "@aiot/consul": "^1.0.0",
    "@aiot/saga": "^1.0.0",        // 需要分散式事務
    "@aiot/middleware": "^1.0.0",  // 共用中間件
    "@aiot/utils": "^1.0.0"
  }
}

// user-preference-service/package.json
{
  "dependencies": {
    "@aiot/types": "^1.0.0",
    "@aiot/auth": "^1.0.0",
    "@aiot/grpc": "^1.0.0",
    "@aiot/consul": "^1.0.0", 
    "@aiot/middleware": "^1.0.0",  // 共用中間件
    "@aiot/utils": "^1.0.0"
  }
}

// 邊緣設備 (minimal setup)
{
  "dependencies": {
    "@aiot/types": "^1.0.0",
    "@aiot/auth": "^1.0.0",
    "@aiot/grpc": "^1.0.0"         // 只需要基本通訊
  }
}
```

### 套件發布策略

```bash
# 使用 Lerna 管理 Monorepo
npm install -g lerna

# 初始化 Monorepo
lerna init

# 安裝所有依賴
lerna bootstrap

# 發布所有套件
lerna publish

# 只發布特定套件
lerna publish --scope @aiot/auth
```

## 🔄 編排式 Saga 設計

### 為何選擇編排式 Saga？

1. **邏輯集中，易於管理**：
   - 中央協調者（Orchestrator）集中處理所有業務邏輯
   - 開發者容易追蹤流程、除錯和管理狀態
   - 特別適合複雜業務流程和多微服務協調

2. **無人機業務場景適用**：
   - 無人機任務執行涉及：用戶認證 → 命令驗證 → 執行 → 狀態更新 → 歷史歸檔
   - 任何步驟失敗都需要回滾到一致狀態

### Saga 實作架構

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Drone Service  │───▶│ Saga Orchestrator │───▶│  RBAC Service    │
│  (主業務邏輯)     │    │  (事務協調器)       │    │  (權限檢查)       │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ User Preference  │
                    │    Service       │
                    │  (偏好設定更新)    │
                    └──────────────────┘
