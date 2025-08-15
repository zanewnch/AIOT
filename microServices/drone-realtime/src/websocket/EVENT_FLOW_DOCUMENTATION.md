# WebSocket 事件流程完整說明

## 📋 概述
這份文件詳細說明前端 emit 事件後，後端的完整處理流程。

## 🔄 事件流程總覽

### 1. 位置訂閱流程
```
FE: socket.emit('drone_position_subscribe', { droneId: '001' })
↓
BE: DroneEventHandler.setupDroneNamespaceHandlers() [接收事件]
↓
BE: DronePositionEventHandler.handlePositionSubscription() [處理邏輯]
├── validateDroneAccess() [權限驗證]
├── wsService.subscribeToDrone() [加入房間]
└── [發送當前位置] (未實現)
↓
FE: 開始接收 'drone_position_update' 事件
```

### 2. 狀態訂閱流程
```
FE: socket.emit('drone_status_subscribe', { droneId: '001' })
↓
BE: DroneEventHandler.setupDroneNamespaceHandlers() [接收事件]
↓
BE: DroneStatusEventHandler.handleStatusSubscription() [處理邏輯]
├── validateDroneAccess() [權限驗證]
├── wsService.subscribeToDrone() [加入房間]
└── [發送當前狀態] (未實現)
↓
FE: 開始接收 'drone_status_update' 事件
```

### 3. 命令發送流程
```
FE: socket.emit('drone_command_send', { droneId: '001', command: 'takeoff' })
↓
BE: DroneEventHandler.setupDroneNamespaceHandlers() [接收事件]
↓
BE: DroneCommandEventHandler.handleCommandSend() [處理邏輯]
├── validateDroneCommandAccess() [權限驗證]
├── validateCommandFormat() [格式驗證]
├── executeCommand() [執行命令]
└── wsService.sendCommandResponse() [回傳結果]
↓
FE: 接收 'drone_command_response' 事件回應
```

## 🏗️ 架構說明

### 主要組件
- **DroneEventHandler** - 事件分發器（路由中心）
- **DronePositionEventHandler** - 位置事件專門處理器
- **DroneStatusEventHandler** - 狀態事件專門處理器  
- **DroneCommandEventHandler** - 命令事件專門處理器
- **WebSocketService** - WebSocket 核心服務

### 設計模式
- **事件分發模式** - 統一接收點，分發到專門處理器
- **單一職責原則** - 每個處理器專注特定功能
- **責任鏈模式** - 權限驗證 → 格式驗證 → 業務處理

## 🔍 詳細方法說明

### DroneEventHandler
- `setupDroneNamespaceHandlers()` - 設定事件監聽器，作為所有前端事件的第一個接收點
- `handleSocketConnection()` - 處理新 socket 連線
- `setupCommonHandlers()` - 設定通用事件處理器

### DronePositionEventHandler  
- `handlePositionSubscription()` - 處理位置訂閱請求
- `handlePositionUnsubscription()` - 處理取消位置訂閱
- `broadcastPositionUpdate()` - 廣播位置更新到訂閱客戶端
- `validateDroneAccess()` - 驗證無人機存取權限

### DroneStatusEventHandler
- `handleStatusSubscription()` - 處理狀態訂閱請求
- `handleStatusUnsubscription()` - 處理取消狀態訂閱
- `broadcastStatusUpdate()` - 廣播狀態更新到訂閱客戶端
- `validateDroneAccess()` - 驗證無人機存取權限

### DroneCommandEventHandler
- `handleCommandSend()` - 處理命令發送請求
- `executeCommand()` - 執行具體的無人機命令
- `validateCommandFormat()` - 驗證命令格式
- `validateDroneCommandAccess()` - 驗證無人機控制權限
- `broadcastCommandUpdate()` - 廣播命令狀態更新

## 🚦 權限系統
- 位置/狀態訂閱：需要 `drone:read` 或 `drone:{droneId}:read` 權限
- 命令執行：需要 `drone:control` 或 `drone:{droneId}:control` 權限
- 管理員：自動擁有所有權限

## 📡 房間管理
- 位置房間：`drone:position:{droneId}`
- 狀態房間：`drone:status:{droneId}`
- 自動清理：socket 斷線時自動離開所有房間

## 🔮 未來擴展
- 真實無人機 API 整合
- 命令隊列管理
- 實時數據流處理
- 多無人機協調
- 地理圍欄檢查