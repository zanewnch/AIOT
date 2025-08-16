/**
 * @fileoverview AIOT 文檔服務 - 配置管理
 */

import path from 'path';
import { fileURLToPath } from 'url';
import type { ServiceInfo } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.NODE_ENV || 'development';

export const config = {
  server: {
    port: process.env.HTTP_PORT || process.env.SERVICE_PORT || 3054,
    environment,
  },
  
  service: {
    name: 'AIOT Documentation Service',
    version: '1.0.0',
    description: 'Unified documentation service for all AIOT microservices',
  },
  
  cors: {
    origin: '*',
    methods: ['GET', 'HEAD', 'OPTIONS'] as string[],
    allowedHeaders: ['Content-Type', 'Authorization'] as string[],
    credentials: false,
  },
  
  paths: {
    docs: environment === 'production' 
      ? path.join(__dirname, '../../docs')
      : path.join(__dirname, '../../../'),
  },
  
  cache: {
    maxAge: environment === 'production' ? '1d' : 0,
  },
} as const;

// 可用的微服務配置
export const availableServices: ServiceInfo[] = [
  {
    name: 'RBAC Service',
    path: '/docs/rbac/',
    description: '權限控制和用戶管理服務文檔',
    type: 'backend'
  },
  {
    name: 'Drone Service',
    path: '/docs/drone/',
    description: '無人機控制和管理服務文檔',
    type: 'backend'
  },
  {
    name: 'Drone WebSocket Service',
    path: '/docs/drone-websocket/',
    description: '無人機即時通訊服務文檔',
    type: 'backend'
  },
  {
    name: 'General Service',
    path: '/docs/general/',
    description: '通用服務和用戶偏好設定文檔',
    type: 'backend'
  }
];

export const endpoints = {
  health: '/health',
  info: '/info',
  docs: '/docs/',
  'service-list': '/api/services'
} as const;