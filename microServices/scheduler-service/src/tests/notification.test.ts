/**
 * @fileoverview 通知系統測試腳本
 * 
 * 提供簡單的功能測試和驗證
 * 可用於開發階段的快速測試
 */

import { Logger } from 'winston';
import { NotificationService } from '../services/NotificationService';
import { EmailNotificationProvider } from '../providers/EmailNotificationProvider';
import { WebhookNotificationProvider } from '../providers/WebhookNotificationProvider';
import { notificationServiceConfig } from '../configs/notificationConfig';
import { 
  NotificationMessage, 
  NotificationServiceConfig,
  PerformanceAlert 
} from '../types/NotificationTypes';

/**
 * 創建測試用的 Logger
 */
const createTestLogger = (): Logger => {
  const winston = require('winston');
  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple()
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
};

/**
 * 創建測試用的 Redis 配置
 */
const createTestRedisConfig = () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

/**
 * 測試 Email 通知提供者
 */
async function testEmailProvider() {
  console.log('\n=== 測試 Email 通知提供者 ===');
  
  const logger = createTestLogger();
  const emailProvider = new EmailNotificationProvider(logger, notificationServiceConfig.email);

  try {
    // 測試初始化
    await emailProvider.initialize();
    console.log('✅ Email 提供者初始化成功');

    // 測試配置驗證
    const isValid = await emailProvider.validateConfig();
    console.log(`✅ Email 配置驗證: ${isValid ? '通過' : '失敗'}`);

    // 創建測試通知
    const testNotification: NotificationMessage = {
      id: `test_email_${Date.now()}`,
      title: '測試 Email 通知',
      content: '這是一個來自通知系統的測試郵件，用於驗證 Email 通知功能是否正常運作。',
      severity: 'info',
      channel: 'email',
      recipients: ['test@example.com'],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 1,
      metadata: {
        testMode: true
      }
    };

    // 測試發送（注意：需要有效的 SMTP 配置）
    if (notificationServiceConfig.email.enabled) {
      const result = await emailProvider.send(testNotification);
      console.log(`📧 Email 發送結果: ${result.success ? '成功' : '失敗'}`);
      if (!result.success) {
        console.log(`   錯誤: ${result.error}`);
      }
    } else {
      console.log('⚠️  Email 通知已停用，跳過發送測試');
    }

    // 清理
    await emailProvider.cleanup();
    console.log('✅ Email 提供者清理完成');

  } catch (error) {
    console.error('❌ Email 提供者測試失敗:', error);
  }
}

/**
 * 測試 Webhook 通知提供者
 */
async function testWebhookProvider() {
  console.log('\n=== 測試 Webhook 通知提供者 ===');
  
  const logger = createTestLogger();
  const webhookProvider = new WebhookNotificationProvider(logger, notificationServiceConfig.webhook);

  try {
    // 測試初始化
    await webhookProvider.initialize();
    console.log('✅ Webhook 提供者初始化成功');

    // 測試配置驗證
    const isValid = await webhookProvider.validateConfig();
    console.log(`✅ Webhook 配置驗證: ${isValid ? '通過' : '失敗'}`);

    // 創建測試通知
    const testNotification: NotificationMessage = {
      id: `test_webhook_${Date.now()}`,
      title: '測試 Webhook 通知',
      content: '這是一個來自通知系統的測試 Webhook，用於驗證 Webhook 通知功能是否正常運作。',
      severity: 'warning',
      channel: 'webhook',
      recipients: [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 1,
      metadata: {
        testMode: true
      }
    };

    // 測試發送
    if (notificationServiceConfig.webhook.enabled) {
      const result = await webhookProvider.send(testNotification);
      console.log(`🔗 Webhook 發送結果: ${result.success ? '成功' : '失敗'}`);
      if (!result.success) {
        console.log(`   錯誤: ${result.error}`);
      }
    } else {
      console.log('⚠️  Webhook 通知已停用，跳過發送測試');
    }

    // 清理
    await webhookProvider.cleanup();
    console.log('✅ Webhook 提供者清理完成');

  } catch (error) {
    console.error('❌ Webhook 提供者測試失敗:', error);
  }
}

/**
 * 測試通知服務
 */
async function testNotificationService() {
  console.log('\n=== 測試通知服務 ===');
  
  const logger = createTestLogger();
  const redisConfig = createTestRedisConfig();
  
  const notificationService = new NotificationService(
    logger,
    redisConfig,
    notificationServiceConfig
  );

  try {
    // 註冊提供者
    const emailProvider = new EmailNotificationProvider(logger, notificationServiceConfig.email);
    const webhookProvider = new WebhookNotificationProvider(logger, notificationServiceConfig.webhook);

    if (notificationServiceConfig.email.enabled) {
      await notificationService.registerProvider(emailProvider);
      console.log('✅ Email 提供者已註冊');
    }

    if (notificationServiceConfig.webhook.enabled) {
      await notificationService.registerProvider(webhookProvider);
      console.log('✅ Webhook 提供者已註冊');
    }

    // 啟動服務
    await notificationService.start();
    console.log('✅ 通知服務已啟動');

    // 測試警報通知
    const testAlert: PerformanceAlert = {
      id: `test_alert_${Date.now()}`,
      type: 'cpu',
      severity: 'warning',
      message: '測試 CPU 使用率警報',
      value: 85,
      threshold: 80,
      timestamp: new Date(),
      resolved: false
    };

    await notificationService.sendAlertNotification(testAlert);
    console.log('✅ 測試警報通知已發送');

    // 等待一段時間讓通知處理完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 獲取統計
    const stats = await notificationService.getNotificationStats();
    console.log('📊 通知統計:', {
      總計: stats.total,
      成功: stats.sent,
      失敗: stats.failed,
      待處理: stats.pending
    });

    // 停止服務
    await notificationService.stop();
    console.log('✅ 通知服務已停止');

  } catch (error) {
    console.error('❌ 通知服務測試失敗:', error);
  }
}

/**
 * 主測試函數
 */
async function runTests() {
  console.log('🚀 開始通知系統測試');
  console.log('配置狀態:');
  console.log(`  - Email 通知: ${notificationServiceConfig.email.enabled ? '啟用' : '停用'}`);
  console.log(`  - Webhook 通知: ${notificationServiceConfig.webhook.enabled ? '啟用' : '停用'}`);

  try {
    await testEmailProvider();
    await testWebhookProvider();
    await testNotificationService();
    
    console.log('\n🎉 所有測試完成！');
  } catch (error) {
    console.error('\n💥 測試過程中發生錯誤:', error);
    process.exit(1);
  }
}

/**
 * API 端點測試函數
 */
async function testAPIEndpoints() {
  console.log('\n=== API 端點測試說明 ===');
  console.log('啟動服務後，您可以使用以下 curl 命令測試 API：');
  
  console.log('\n1. 測試通知發送:');
  console.log(`curl -X POST http://localhost:3000/api/notifications/test \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "email",
    "recipients": ["test@example.com"],
    "title": "API 測試通知",
    "content": "這是透過 API 發送的測試通知",
    "severity": "info"
  }'`);

  console.log('\n2. 獲取通知統計:');
  console.log('curl http://localhost:3000/api/notifications/stats');

  console.log('\n3. 獲取通知歷史:');
  console.log('curl http://localhost:3000/api/notifications/history?limit=10');

  console.log('\n4. 檢查通知系統健康狀態:');
  console.log('curl http://localhost:3000/api/notifications/health');

  console.log('\n5. 測試監控警報通知:');
  console.log(`curl -X POST http://localhost:3000/api/notifications/test-monitoring \\
  -H "Content-Type: application/json" \\
  -d '{"channel": "email"}'`);
}

// 運行測試
if (require.main === module) {
  console.log('選擇測試模式:');
  console.log('1. 運行功能測試: npm run test:notifications');
  console.log('2. 查看 API 測試說明: npm run test:notifications:api');
  
  const mode = process.argv[2];
  
  if (mode === 'api') {
    testAPIEndpoints();
  } else {
    runTests();
  }
}

export {
  testEmailProvider,
  testWebhookProvider,
  testNotificationService,
  testAPIEndpoints
};