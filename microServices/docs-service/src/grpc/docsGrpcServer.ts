/**
 * @fileoverview Docs gRPC 服務器實作
 * 
 * 此文件實作 Docs 服務的 gRPC 服務器，提供：
 * - 文檔管理 gRPC 端點
 * - API 文檔生成 gRPC 端點
 * - 服務文檔查詢 gRPC 端點
 * - 健康檢查 gRPC 端點
 * 
 * @module gRPC/DocsGrpcServer
 * @version 1.0.0
 * @author AIOT Team
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

// 導入現有的控制器
import { DocsController } from '../controllers/docsController.js';
import { HealthController } from '../controllers/healthController.js';
import { ServiceController } from '../controllers/serviceController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Docs gRPC 服務器類別
 */
export class DocsGrpcServer {
  private server: grpc.Server;
  private docsController: DocsController;
  private healthController: HealthController;
  private serviceController: ServiceController;

  constructor() {
    this.server = new grpc.Server({
      'grpc.keepalive_time_ms': 30000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': true,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.http2.min_time_between_pings_ms': 10000,
      'grpc.http2.min_ping_interval_without_data_ms': 300000,
      'grpc.max_connection_idle_ms': 300000,
      'grpc.max_connection_age_ms': 30000,
      'grpc.max_connection_age_grace_ms': 5000
    });
    
    // 初始化控制器
    this.docsController = new DocsController();
    this.healthController = new HealthController();
    this.serviceController = new ServiceController();

    this.loadProtoAndAddService();
    this.addHealthService();
  }

  /**
   * 載入 proto 文件並添加服務
   */
  private loadProtoAndAddService(): void {
    const PROTO_PATH = path.join(__dirname, '../../proto/docs.proto');
    const HEALTH_PROTO_PATH = path.join(__dirname, '../../proto/health.proto');
    const PROTO_DIR = path.join(__dirname, '../../proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    // 載入健康檢查 proto
    const healthPackageDefinition = protoLoader.loadSync(HEALTH_PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    const docsProto = grpc.loadPackageDefinition(packageDefinition) as any;
    const healthProto = grpc.loadPackageDefinition(healthPackageDefinition) as any;

    this.server.addService(docsProto.docs.DocsService.service, {
      // 健康檢查和服務資訊方法
      HealthCheck: this.healthCheck.bind(this),
      GetServiceInfo: this.getServiceInfo.bind(this),

      // 文檔管理方法
      GetAllDocs: this.getAllDocs.bind(this),
      GetDocByService: this.getDocByService.bind(this),
      GenerateApiDocs: this.generateApiDocs.bind(this),
      GetApiDocumentation: this.getApiDocumentation.bind(this),
    });

    // 添加標準健康檢查服務
    this.server.addService(healthProto.grpc.health.v1.Health.service, {
      Check: this.healthCheck.bind(this),
      Watch: this.healthWatch.bind(this),
    });
  }

  /**
   * 添加健康檢查服務
   */
  private addHealthService(): void {
    // 健康檢查服務已在 loadProtoAndAddService 中添加
    console.log('✅ Health service added to Docs gRPC server');
  }

  // ============================================================================
  // gRPC 方法實作
  // ============================================================================

  /**
   * 健康檢查方法
   */
  private healthCheck(call: any, callback: grpc.sendUnaryData<any>): void {
    callback(null, {
      status: 'SERVING',
      service: 'docs-service',
      message: 'Docs service is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  /**
   * 健康檢查監聽方法
   */
  private healthWatch(call: any): void {
    // 實作健康檢查監聽
    call.write({ status: 1 }); // 1 = SERVING
  }

  /**
   * 獲取服務資訊
   */
  private async getServiceInfo(call: any, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      const serviceInfo = {
        service: 'docs-service',
        description: 'AIOT Documentation Aggregation Service',
        version: '1.0.0',
        author: 'AIOT Team',
        features: [
          'API Documentation Generation',
          'Service Documentation Aggregation',
          'Multi-format Documentation Export',
          'Real-time Documentation Updates'
        ]
      };

      callback(null, serviceInfo);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to get service info'
      }, null);
    }
  }

  /**
   * 獲取所有文檔
   */
  private async getAllDocs(call: any, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      const { page = 1, limit = 10 } = call.request;
      
      // 模擬文檔數據（實際應從數據庫或文件系統獲取）
      const docs = [
        {
          id: 1,
          service_name: 'rbac-service',
          title: 'RBAC Service API Documentation',
          description: 'Role-Based Access Control service documentation',
          version: '1.0.0',
          doc_type: 'openapi',
          file_path: '/docs/rbac/api.json',
          url: '/api/docs/api/rbac-service',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          service_name: 'drone-service',
          title: 'Drone Service API Documentation',
          description: 'Drone management service documentation',
          version: '1.0.0',
          doc_type: 'openapi',
          file_path: '/docs/drone/api.json',
          url: '/api/docs/api/drone-service',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          service_name: 'general-service',
          title: 'General Service API Documentation',
          description: 'General service and user preferences documentation',
          version: '1.0.0',
          doc_type: 'openapi',
          file_path: '/docs/general/api.json',
          url: '/api/docs/api/general-service',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const response = {
        docs: docs,
        total: docs.length,
        success: true,
        message: 'Successfully retrieved all documentation'
      };

      callback(null, response);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to get all docs'
      }, null);
    }
  }

  /**
   * 根據服務名稱獲取文檔
   */
  private async getDocByService(call: any, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      const { service_name } = call.request;
      
      // 模擬根據服務名稱查詢文檔
      const doc = {
        id: 1,
        service_name: service_name,
        title: `${service_name} API Documentation`,
        description: `${service_name} service documentation`,
        version: '1.0.0',
        doc_type: 'openapi',
        file_path: `/docs/${service_name}/api.json`,
        url: `/api/docs/api/${service_name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = {
        doc: doc,
        success: true,
        message: `Successfully retrieved documentation for ${service_name}`
      };

      callback(null, response);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to get doc by service'
      }, null);
    }
  }

  /**
   * 生成 API 文檔
   */
  private async generateApiDocs(call: any, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      const { service_name, doc_type = 'openapi', force_regenerate = false } = call.request;
      
      // 模擬文檔生成過程
      const documentationUrl = `/api/docs/api/${service_name}`;
      
      const response = {
        documentation_url: documentationUrl,
        generation_status: 'completed',
        success: true,
        message: `Successfully generated ${doc_type} documentation for ${service_name}`
      };

      callback(null, response);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to generate API docs'
      }, null);
    }
  }

  /**
   * 獲取 API 文檔內容
   */
  private async getApiDocumentation(call: any, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      const { service_name, format = 'json' } = call.request;
      
      // 模擬文檔內容
      const content = JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: `${service_name} API`,
          version: '1.0.0',
          description: `API documentation for ${service_name}`
        },
        paths: {
          '/health': {
            get: {
              summary: 'Health check',
              responses: {
                '200': {
                  description: 'Service is healthy'
                }
              }
            }
          }
        }
      }, null, 2);

      const response = {
        content: content,
        content_type: format === 'json' ? 'application/json' : 'text/yaml',
        success: true,
        message: `Successfully retrieved ${format} documentation for ${service_name}`
      };

      callback(null, response);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to get API documentation'
      }, null);
    }
  }

  // ============================================================================
  // 服務器管理方法
  // ============================================================================

  /**
   * 啟動 gRPC 服務器
   */
  public start(port: number = 50054): void {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          console.error('Failed to start Docs gRPC server:', error);
          return;
        }
        
        console.log(`Docs gRPC server running on port ${boundPort}`);
        this.server.start();
      }
    );
  }

  /**
   * 停止 gRPC 服務器
   */
  public stop(): void {
    this.server.tryShutdown((error) => {
      if (error) {
        console.error('Error stopping Docs gRPC server:', error);
        this.server.forceShutdown();
      } else {
        console.log('Docs gRPC server stopped gracefully');
      }
    });
  }
}