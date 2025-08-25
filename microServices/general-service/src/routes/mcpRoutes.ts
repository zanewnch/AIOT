/**
 * @fileoverview MCP (Model Context Protocol) 路由類別
 * 
 * 將 General Service 的功能暴露為 MCP 工具，供 LLM AI Engine 調用。
 * 提供標準化的 MCP 工具接口，支援自然語言操作用戶偏好設定。
 * 
 * @module MCPRoutes
 * @author AIOT Team
 * @since 2.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router, Request, Response } from 'express';
import { TYPES } from '../container/types.js';
import { UserPreferenceCommandsController } from '../controllers/commands/UserPreferenceCommandsController.js';
import { UserPreferenceQueriesController } from '../controllers/queries/UserPreferenceQueriesController.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';
import { createLogger } from '../configs/loggerConfig.js';

// 創建 MCP 專用的 logger 實例
const logger = createLogger('MCPRoutes');

/**
 * MCP 工具定義介面
 */
interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}

/**
 * MCP 工具調用請求介面
 */
interface MCPToolRequest {
    name: string;
    toolArguments: Record<string, any>;
}

/**
 * MCP 工具調用回應介面
 */
interface MCPToolResponse {
    success: boolean;
    result?: any;
    error?: string;
    tool_name: string;
    execution_time_ms?: number;
}

/**
 * General Service MCP 路由類別
 * 
 * 提供 MCP 標準的工具接口，將用戶偏好設定功能暴露給 LLM AI Engine
 */
@injectable()
export class MCPRoutes {
    private readonly router: Router;
    private readonly tools: MCPTool[];

    constructor(
        @inject(TYPES.UserPreferenceCommandsController) 
        private readonly commandsController: UserPreferenceCommandsController,
        @inject(TYPES.UserPreferenceQueriesController) 
        private readonly queriesController: UserPreferenceQueriesController
    ) {
        this.router = Router();
        this.tools = this.defineTools();
        this.setupRoutes();
        
        logger.info(`MCP Routes initialized with ${this.tools.length} tools`);
    }

    /**
     * 定義可用的 MCP 工具
     */
    private defineTools = (): MCPTool[] => {
        return [
            {
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
            },
            {
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
            },
            {
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
            },
            {
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
            },
            {
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
            },
            {
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
            },
            {
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
            }
        ];
    }

    /**
     * 設定 MCP 路由
     */
    private setupRoutes = (): void => {
        // 獲取可用工具列表
        this.router.get('/tools', this.getAvailableTools);
        
        // 執行工具調用
        this.router.post('/tools/:toolName', this.executeToolCall);
        
        // 批量工具調用
        this.router.post('/execute', this.executeBatchToolCalls);
        
        // MCP 服務狀態
        this.router.get('/status', this.getMCPStatus);
    }

    /**
     * 獲取可用工具列表
     */
    private getAvailableTools = async (req: Request, res: Response): Promise<void> => {
        try {
            const response = {
                success: true,
                service: 'general-service',
                tools: this.tools,
                total: this.tools.length,
                version: '1.0.0'
            };

            logger.info('MCP tools list requested');
            res.status(200).json(response);
        } catch (error) {
            logger.error('Failed to get MCP tools list:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve tools list'
            });
        }
    }

    /**
     * 執行單個工具調用
     */
    private executeToolCall = async (req: Request, res: Response): Promise<void> => {
        const startTime = Date.now();
        const toolName = req.params.toolName;
        const toolArgs = req.body;

        try {
            logger.info(`Executing MCP tool: ${toolName}`, { toolArgs });

            const result = await this.handleToolExecution(toolName, toolArgs);
            const executionTime = Date.now() - startTime;

            const response: MCPToolResponse = {
                success: result.success,
                result: result.data,
                error: result.error,
                tool_name: toolName,
                execution_time_ms: executionTime
            };

            logger.info(`MCP tool execution completed: ${toolName}`, { 
                success: result.success,
                executionTime 
            });

            res.status(result.success ? 200 : 400).json(response);
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logger.error(`MCP tool execution failed: ${toolName}`, error);

            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                tool_name: toolName,
                execution_time_ms: executionTime
            });
        }
    }

    /**
     * 批量工具調用
     */
    private executeBatchToolCalls = async (req: Request, res: Response): Promise<void> => {
        const startTime = Date.now();
        const toolCalls: MCPToolRequest[] = req.body.tools || [];

        try {
            logger.info(`Executing ${toolCalls.length} MCP tools in batch`);

            const results = await Promise.allSettled(
                toolCalls.map(async (toolCall) => {
                    return await this.handleToolExecution(toolCall.name, toolCall.toolArguments);
                })
            );

            const responses = results.map((result, index) => {
                const toolCall = toolCalls[index];
                if (result.status === 'fulfilled') {
                    return {
                        success: result.value.success,
                        result: result.value.data,
                        error: result.value.error,
                        tool_name: toolCall.name
                    };
                } else {
                    return {
                        success: false,
                        error: result.reason?.message || 'Execution failed',
                        tool_name: toolCall.name
                    };
                }
            });

            const executionTime = Date.now() - startTime;
            const successCount = responses.filter(r => r.success).length;

            logger.info(`Batch MCP execution completed: ${successCount}/${toolCalls.length} successful`, {
                executionTime
            });

            res.status(200).json({
                success: true,
                results: responses,
                total: toolCalls.length,
                successful: successCount,
                execution_time_ms: executionTime
            });
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logger.error('Batch MCP execution failed:', error);

            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Batch execution failed',
                execution_time_ms: executionTime
            });
        }
    }

    /**
     * 獲取 MCP 服務狀態
     */
    private getMCPStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = {
                success: true,
                service: 'general-service',
                mcp_version: '1.0.0',
                tools_count: this.tools.length,
                status: 'healthy',
                capabilities: [
                    'user_preference_management',
                    'preference_statistics',
                    'batch_operations'
                ],
                last_health_check: new Date().toISOString()
            };

            res.status(200).json(status);
        } catch (error) {
            logger.error('Failed to get MCP status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve MCP status'
            });
        }
    }

    /**
     * 處理工具執行邏輯
     */
    private handleToolExecution = async (toolName: string, toolArgs: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            switch (toolName) {
                case 'get_user_preferences':
                    return await this.handleGetUserPreferences(toolArgs);
                
                case 'create_user_preference':
                    return await this.handleCreateUserPreference(toolArgs);
                
                case 'update_user_preference':
                    return await this.handleUpdateUserPreference(toolArgs);
                
                case 'get_preference_statistics':
                    return await this.handleGetPreferenceStatistics(toolArgs);
                
                case 'check_user_preference_exists':
                    return await this.handleCheckUserPreferenceExists(toolArgs);
                
                case 'reset_user_preference':
                    return await this.handleResetUserPreference(toolArgs);
                
                case 'delete_user_preference':
                    return await this.handleDeleteUserPreference(toolArgs);
                
                default:
                    return {
                        success: false,
                        error: `未知的工具: ${toolName}`
                    };
            }
        } catch (error) {
            logger.error(`Tool execution error for ${toolName}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '工具執行失敗'
            };
        }
    }

    // ============================================
    // 工具處理器實作
    // ============================================

    private handleGetUserPreferences = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            if (args.userId) {
                // 獲取特定用戶的偏好設定
                const mockReq = { params: { userId: args.userId } } as any;
                const result = await this.queriesController.getUserPreferenceByUserId(mockReq, null as any, null as any);
                return { success: true, data: result };
            } else if (args.theme) {
                // 按主題查詢
                const mockReq = { params: { theme: args.theme } } as any;
                const result = await this.queriesController.getUserPreferencesByTheme(mockReq, null as any, null as any);
                return { success: true, data: result };
            } else if (args.searchQuery) {
                // 搜尋查詢
                const mockReq = { query: { q: args.searchQuery, page: args.page || 1, limit: args.limit || 10 } } as any;
                const result = await this.queriesController.searchUserPreferences(mockReq, null as any, null as any);
                return { success: true, data: result };
            } else {
                // 分頁查詢所有偏好設定
                const mockReq = { query: { page: args.page || 1, limit: args.limit || 10 } } as any;
                const result = await this.queriesController.getUserPreferencesWithPagination(mockReq, null as any, null as any);
                return { success: true, data: result };
            }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private handleCreateUserPreference = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const preferenceData = {
                userId: args.userId,
                theme: args.theme || 'light',
                language: args.language || 'zh-TW',
                timezone: args.timezone || 'Asia/Taipei',
                notifications: args.notifications || { email: true, sms: false, push: true }
            };

            const mockReq = { body: preferenceData } as any;
            const result = await this.commandsController.createUserPreference(mockReq, null as any, null as any);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private handleUpdateUserPreference = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const mockReq = {
                params: { userId: args.userId },
                body: args.updates
            } as any;
            const result = await this.commandsController.updateUserPreferenceByUserId(mockReq, null as any, null as any);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private handleGetPreferenceStatistics = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const mockReq = { query: { groupBy: args.groupBy || 'theme' } } as any;
            const result = await this.queriesController.getUserPreferenceStatistics(mockReq, null as any, null as any);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private handleCheckUserPreferenceExists = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const mockReq = { params: { userId: args.userId } } as any;
            const result = await this.queriesController.checkUserPreferenceExists(mockReq, null as any, null as any);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private handleResetUserPreference = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            const mockReq = {
                params: { userId: args.userId },
                body: { 
                    resetAll: args.resetAll !== false,
                    resetFields: args.resetFields 
                }
            } as any;
            const result = await this.commandsController.resetUserPreferenceToDefault(mockReq, null as any, null as any);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private handleDeleteUserPreference = async (args: any): Promise<{ success: boolean; data?: any; error?: string }> => {
        try {
            if (!args.confirm) {
                return {
                    success: false,
                    error: `⚠️  警告：要刪除用戶 ${args.userId} 的偏好設定，請在參數中設定 "confirm": true`
                };
            }

            const mockReq = { params: { userId: args.userId } } as any;
            const result = await this.commandsController.deleteUserPreferenceByUserId(mockReq, null as any, null as any);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}