// 暫時禁用 gRPC 服務
const fs = require('fs');
let content = fs.readFileSync('authGrpcServer.ts', 'utf8');

// 替換 loadProtoAndAddService 方法
content = content.replace(
  /private loadProtoAndAddService\(\): void \{[\s\S]*?(?=^\s*\/\*\*|^\s*private|^\s*public|^\s*\}$)/m,
  `private loadProtoAndAddService(): void {
    // TODO: Auth service 的 gRPC 服務待實現
    // 暫時註釋掉，只提供 HTTP 服務
    console.log('⚠️ Auth gRPC service not implemented yet, only HTTP endpoints available');
  }

  /**`
);

fs.writeFileSync('authGrpcServer.ts', content);
