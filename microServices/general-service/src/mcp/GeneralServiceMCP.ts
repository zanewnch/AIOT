/**
 * @fileoverview General Service MCP Server
 * 將用戶偏好設定服務轉換為 MCP 工具，支援自然語言操作
 */

import { MCPServer, Tool, CallToolRequestSchema } from '@modelcontextprotocol/sdk/server/index.js';
import { UserPreferenceQueriesController } from '../controllers/queries/UserPreferenceQueriesCtrl.js';
import { UserPreferenceCommandsController } from '../controllers/commands/UserPreferenceCommandsCtrl.js';

export class GeneralServiceMCP extends MCPServer {
  private queriesController: UserPreferenceQueriesController;
  private commandsController: UserPreferenceCommandsController;

  constructor() {
    super(
      {
        name: 'general-service-mcp',
        version: '1.0.0',
        description: 'AIOT General Service MCP Server - 用戶偏好設定自然語言操作'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupTools();
  }

  private setupTools() {
    // ============================================
    // 查詢工具 (Query Tools)
    // ============================================

    this.addTool({
      name: 'get_user_preferences',
      description: '獲取用戶偏好設定。支援多種查詢方式：按用戶ID、主題、搜尋關鍵字等',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { 
            type: 'string', 
            description: '用戶ID，如果提供則獲取特定用戶的偏好設定' 
          },
          theme: { 
            type: 'string', 
            description: '主題名稱（light、dark等），如果提供則按主題篩選' 
          },
          searchQuery: { 
            type: 'string', 
            description: '搜尋關鍵字，用於模糊搜尋偏好設定' 
          },
          page: { 
            type: 'number', 
            description: '分頁頁碼，預設為1' 
          },
          limit: { 
            type: 'number', 
            description: '每頁數量，預設為10' 
          }
        }
      }
    });

    this.addTool({
      name: 'get_preference_statistics',
      description: '獲取用戶偏好設定的統計資料，包括主題分布、用戶數量等',
      inputSchema: {
        type: 'object',
        properties: {
          groupBy: {
            type: 'string',
            enum: ['theme', 'language', 'region'],
            description: '統計分組方式'
          }
        }
      }
    });

    this.addTool({
      name: 'check_user_preference_exists',
      description: '檢查指定用戶是否已有偏好設定',
      inputSchema: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { 
            type: 'string', 
            description: '要檢查的用戶ID' 
          }
        }
      }
    });

    // ============================================
    // 操作工具 (Command Tools)  
    // ============================================

    this.addTool({
      name: 'create_user_preference',
      description: '為用戶創建新的偏好設定',
      inputSchema: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: '用戶ID' },
          theme: { type: 'string', description: '主題設定（light、dark等）' },
          language: { type: 'string', description: '語言設定（zh-TW、en-US等）' },
          timezone: { type: 'string', description: '時區設定' },
          notifications: { 
            type: 'object', 
            description: '通知設定',
            properties: {
              email: { type: 'boolean' },
              sms: { type: 'boolean' },
              push: { type: 'boolean' }
            }
          }
        }
      }
    });

    this.addTool({
      name: 'update_user_preference',
      description: '更新用戶偏好設定',
      inputSchema: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: '用戶ID' },
          updates: {
            type: 'object',
            description: '要更新的設定項目',
            properties: {
              theme: { type: 'string' },
              language: { type: 'string' },
              timezone: { type: 'string' },
              notifications: { type: 'object' }
            }
          }
        }
      }
    });

    this.addTool({
      name: 'bulk_update_preferences',
      description: '批量更新多個用戶的偏好設定',
      inputSchema: {
        type: 'object',
        required: ['updates'],
        properties: {
          userIds: {
            type: 'array',
            items: { type: 'string' },
            description: '要更新的用戶ID列表，如果為空則更新所有用戶'
          },
          updates: {
            type: 'object',
            description: '要更新的設定項目',
            properties: {
              theme: { type: 'string' },
              language: { type: 'string' },
              timezone: { type: 'string' }
            }
          },
          conditions: {
            type: 'object',
            description: '更新條件，只有滿足條件的用戶才會被更新',
            properties: {
              currentTheme: { type: 'string' },
              currentLanguage: { type: 'string' }
            }
          }
        }
      }
    });

    this.addTool({
      name: 'reset_user_preference',
      description: '重置用戶偏好設定為預設值',
      inputSchema: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: '用戶ID' },
          resetAll: { 
            type: 'boolean', 
            description: '是否重置所有設定，預設為true' 
          },
          resetFields: {
            type: 'array',
            items: { type: 'string' },
            description: '要重置的具體欄位，如果resetAll為false則使用此設定'
          }
        }
      }
    });

    this.addTool({
      name: 'delete_user_preference',
      description: '刪除用戶偏好設定',
      inputSchema: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: '要刪除偏好設定的用戶ID' },
          confirm: { 
            type: 'boolean', 
            description: '確認刪除，必須為true才會執行刪除' 
          }
        }
      }
    });
  }

  async handleToolCall(name: string, args: any) {
    try {
      switch (name) {
        case 'get_user_preferences':
          return await this.handleGetUserPreferences(args);
        case 'get_preference_statistics':
          return await this.handleGetPreferenceStatistics(args);
        case 'check_user_preference_exists':
          return await this.handleCheckUserPreferenceExists(args);
        case 'create_user_preference':
          return await this.handleCreateUserPreference(args);
        case 'update_user_preference':
          return await this.handleUpdateUserPreference(args);
        case 'bulk_update_preferences':
          return await this.handleBulkUpdatePreferences(args);
        case 'reset_user_preference':
          return await this.handleResetUserPreference(args);
        case 'delete_user_preference':
          return await this.handleDeleteUserPreference(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `執行 ${name} 時發生錯誤: ${error.message}`
        }],
        isError: true
      };
    }
  }

  // ============================================
  // 查詢處理器
  // ============================================

  private async handleGetUserPreferences(args: any) {
    if (args.userId) {
      // 獲取特定用戶的偏好設定
      const result = await this.queriesController.getUserPreferenceByUserId({
        params: { userId: args.userId }
      });
      
      return {
        content: [{
          type: 'text',
          text: `用戶 ${args.userId} 的偏好設定：\n${JSON.stringify(result.data, null, 2)}`
        }]
      };
    } else if (args.theme) {
      // 按主題查詢
      const result = await this.queriesController.getUserPreferencesByTheme({
        params: { theme: args.theme }
      });
      
      return {
        content: [{
          type: 'text', 
          text: `使用 ${args.theme} 主題的用戶偏好設定：\n${JSON.stringify(result.data, null, 2)}`
        }]
      };
    } else if (args.searchQuery) {
      // 搜尋查詢
      const result = await this.queriesController.searchUserPreferences({
        query: { q: args.searchQuery, page: args.page || 1, limit: args.limit || 10 }
      });
      
      return {
        content: [{
          type: 'text',
          text: `搜尋 "${args.searchQuery}" 的結果：\n${JSON.stringify(result.data, null, 2)}`
        }]
      };
    } else {
      // 分頁查詢所有偏好設定
      const result = await this.queriesController.getUserPreferencesWithPagination({
        query: { page: args.page || 1, limit: args.limit || 10 }
      });
      
      return {
        content: [{
          type: 'text',
          text: `用戶偏好設定列表（第 ${args.page || 1} 頁）：\n${JSON.stringify(result.data, null, 2)}`
        }]
      };
    }
  }

  private async handleGetPreferenceStatistics(args: any) {
    const result = await this.queriesController.getUserPreferenceStatistics({
      query: { groupBy: args.groupBy || 'theme' }
    });
    
    return {
      content: [{
        type: 'text',
        text: `用戶偏好設定統計（按 ${args.groupBy || 'theme'} 分組）：\n${JSON.stringify(result.data, null, 2)}`
      }]
    };
  }

  private async handleCheckUserPreferenceExists(args: any) {
    const result = await this.queriesController.checkUserPreferenceExists({
      params: { userId: args.userId }
    });
    
    return {
      content: [{
        type: 'text',
        text: `用戶 ${args.userId} ${result.data?.exists ? '已有' : '沒有'} 偏好設定`
      }]
    };
  }

  // ============================================
  // 操作處理器
  // ============================================

  private async handleCreateUserPreference(args: any) {
    const preferenceData = {
      userId: args.userId,
      theme: args.theme || 'light',
      language: args.language || 'zh-TW',
      timezone: args.timezone || 'Asia/Taipei',
      notifications: args.notifications || { email: true, sms: false, push: true }
    };

    const result = await this.commandsController.createUserPreference({
      body: preferenceData
    });
    
    return {
      content: [{
        type: 'text',
        text: `成功為用戶 ${args.userId} 創建偏好設定：\n${JSON.stringify(result.data, null, 2)}`
      }]
    };
  }

  private async handleUpdateUserPreference(args: any) {
    const result = await this.commandsController.updateUserPreferenceByUserId({
      params: { userId: args.userId },
      body: args.updates
    });
    
    return {
      content: [{
        type: 'text',
        text: `成功更新用戶 ${args.userId} 的偏好設定：\n${JSON.stringify(result.data, null, 2)}`
      }]
    };
  }

  private async handleBulkUpdatePreferences(args: any) {
    const result = await this.commandsController.bulkCreateUserPreferences({
      body: {
        userIds: args.userIds,
        updates: args.updates,
        conditions: args.conditions
      }
    });
    
    return {
      content: [{
        type: 'text',
        text: `批量更新完成，影響 ${result.data?.updatedCount || 0} 位用戶`
      }]
    };
  }

  private async handleResetUserPreference(args: any) {
    const result = await this.commandsController.resetUserPreferenceToDefault({
      params: { userId: args.userId },
      body: { 
        resetAll: args.resetAll !== false,
        resetFields: args.resetFields 
      }
    });
    
    return {
      content: [{
        type: 'text',
        text: `成功重置用戶 ${args.userId} 的偏好設定為預設值`
      }]
    };
  }

  private async handleDeleteUserPreference(args: any) {
    if (!args.confirm) {
      return {
        content: [{
          type: 'text',
          text: `⚠️  警告：要刪除用戶 ${args.userId} 的偏好設定，請在參數中設定 "confirm": true`
        }],
        isError: true
      };
    }

    const result = await this.commandsController.deleteUserPreferenceByUserId({
      params: { userId: args.userId }
    });
    
    return {
      content: [{
        type: 'text',
        text: `成功刪除用戶 ${args.userId} 的偏好設定`
      }]
    };
  }
}

// ============================================
// 自然語言查詢範例
// ============================================

/**
 * 使用範例：
 * 
 * 1. "幫我看看用戶 john123 的偏好設定"
 *    → get_user_preferences({ userId: "john123" })
 * 
 * 2. "有多少用戶使用深色主題？"
 *    → get_user_preferences({ theme: "dark" })
 *    → get_preference_statistics({ groupBy: "theme" })
 * 
 * 3. "把所有用戶的語言改為英文"
 *    → bulk_update_preferences({ updates: { language: "en-US" } })
 * 
 * 4. "為新用戶 alice456 建立預設偏好設定"
 *    → create_user_preference({ userId: "alice456" })
 * 
 * 5. "把用戶 bob789 的主題改為深色模式，並開啟所有通知"
 *    → update_user_preference({ 
 *        userId: "bob789", 
 *        updates: { 
 *          theme: "dark", 
 *          notifications: { email: true, sms: true, push: true } 
 *        }
 *      })
 * 
 * 6. "重置用戶 charlie000 的設定"
 *    → reset_user_preference({ userId: "charlie000" })
 * 
 * 7. "刪除用戶 david111 的所有偏好設定"  
 *    → delete_user_preference({ userId: "david111", confirm: true })
 */