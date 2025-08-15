/**
 * 簡化版 RBAC 服務器
 * 用於測試基本路由功能
 */

import express from 'express';
import cors from 'cors';
import net from 'net';

const app = express();
const PORT = process.env.GRPC_PORT || 50051;
const HTTP_PORT = process.env.HTTP_PORT || 3001;

// 中間件
app.use(cors());
app.use(express.json());

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rbac-service',
    timestamp: new Date().toISOString()
  });
});

// RBAC API 根端點
app.get('/', (req, res) => {
  res.json({
    message: 'RBAC Service is running',
    service: 'rbac-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/users',
      roles: '/roles',
      permissions: '/permissions'
    }
  });
});

// 用戶端點
app.get('/users', (req, res) => {
  res.json({
    message: 'Users endpoint',
    users: []
  });
});

// 角色端點
app.get('/roles', (req, res) => {
  res.json({
    message: 'Roles endpoint',
    roles: []
  });
});

// 權限端點
app.get('/permissions', (req, res) => {
  res.json({
    message: 'Permissions endpoint',
    permissions: []
  });
});

// 錯誤處理
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 啟動 HTTP 服務器
app.listen(HTTP_PORT, () => {
  console.log(`🚀 RBAC Service (Simple) is running on port ${HTTP_PORT}`);
  console.log(`📊 Health check: http://localhost:${HTTP_PORT}/health`);
});

// 模擬 gRPC 服務器在指定端口
const grpcServer = net.createServer();

grpcServer.listen(PORT, () => {
  console.log(`🔗 Mock gRPC Server is listening on port ${PORT}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  grpcServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  grpcServer.close(() => {
    process.exit(0);
  });
});