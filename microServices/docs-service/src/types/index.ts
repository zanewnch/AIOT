/**
 * @fileoverview AIOT 文檔服務 - 類型定義
 */

export interface ServiceInfo {
  name: string;
  path: string;
  description: string;
  type: 'backend' | 'frontend';
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ServiceInfoResponse {
  service: string;
  version: string;
  description: string;
  availableServices: Record<string, string>;
  endpoints: Record<string, string>;
  timestamp: string;
}

export interface ServicesListResponse {
  services: ServiceInfo[];
  total: number;
  timestamp: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  path?: string;
  timestamp: string;
  availableEndpoints?: Record<string, string>;
}