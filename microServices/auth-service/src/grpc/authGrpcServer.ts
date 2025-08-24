import 'reflect-metadata';
import { injectable } from 'inversify';
import * as grpc from '@grpc/grpc-js';

@injectable()
export class AuthGrpcServer {
  private server: grpc.Server;
  private readonly port: number;

  constructor() {
    this.port = Number(process.env.GRPC_PORT) || 50055;
    this.server = new grpc.Server({
      'grpc.keepalive_time_ms': 30000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': 1,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.http2.min_time_between_pings_ms': 10000,
    });
    
    console.log('⚠️ Auth gRPC service not implemented yet, only HTTP endpoints available');
  }

  async start(): Promise<void> {
    console.log('⚠️ Auth gRPC server skipped - using HTTP only');
  }

  async shutdown(): Promise<void> {
    console.log('Auth gRPC server shutdown (not started)');
  }
}
