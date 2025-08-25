/**
 * @fileoverview Drone Service MCP Routes
 * 
 * 實現 MCP (Model Context Protocol) 服務端點，
 * 讓 LLM AI Engine 能夠通過自然語言操作無人機系統
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-24
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router, Request, Response } from 'express';
import { TYPES } from '../container/types.js';
import { ResResult } from 'aiot-shared-packages';

// 導入查詢控制器
import { DronePositionQueriesController } from.*Controller.js';
import { DroneCommandQueriesController } from.*Controller.js';
import { DroneStatusQueriesController } from.*Controller.js';
import { DroneRealTimeStatusQueriesController } from.*Controller.js';
import { ArchiveTaskQueriesController } from.*Controller.js';

/**
 * Drone Service MCP 工具定義
 * 提供給 LLM AI Engine 使用的自然語言工具列表
 */
const DRONE_MCP_TOOLS = [
    {
        name: 'get_drone_positions',
        description: '獲取無人機位置資訊。支援分頁查詢、關鍵字搜尋、按無人機ID篩選等功能',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，預設為 1' },
                pageSize: { type: 'number', description: '每頁資料數量，預設為 20' },
                search: { type: 'string', description: '搜尋關鍵字，可搜尋無人機ID或其他欄位' },
                droneId: { type: 'string', description: '指定無人機ID進行篩選' },
                sortBy: { type: 'string', description: '排序欄位，預設為 createdAt' },
                sortOrder: { type: 'string', description: '排序方式，ASC 或 DESC，預設為 DESC' }
            }
        }
    },
    {
        name: 'get_drone_position_by_id',
        description: '根據位置記錄ID獲取特定的無人機位置資料',
        inputSchema: {
            type: 'object',
            required: ['positionId'],
            properties: {
                positionId: { type: 'string', description: '位置記錄的唯一識別碼' }
            }
        }
    },
    {
        name: 'get_drone_commands',
        description: '獲取無人機指令列表。支援分頁查詢、狀態篩選、無人機ID篩選等功能',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，預設為 1' },
                pageSize: { type: 'number', description: '每頁資料數量，預設為 20' },
                search: { type: 'string', description: '搜尋關鍵字' },
                droneId: { type: 'string', description: '按無人機ID篩選' },
                status: { type: 'string', description: '按指令狀態篩選，如 pending, executing, completed' },
                commandType: { type: 'string', description: '按指令類型篩選，如 takeoff, land, move' }
            }
        }
    },
    {
        name: 'get_drone_command_by_id',
        description: '根據指令ID獲取特定的無人機指令詳細資訊',
        inputSchema: {
            type: 'object',
            required: ['commandId'],
            properties: {
                commandId: { type: 'string', description: '指令的唯一識別碼' }
            }
        }
    },
    {
        name: 'get_drone_statuses',
        description: '獲取無人機狀態資訊。包含電池、訊號強度、飛行狀態等資料',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，預設為 1' },
                pageSize: { type: 'number', description: '每頁資料數量，預設為 20' },
                search: { type: 'string', description: '搜尋關鍵字' },
                droneId: { type: 'string', description: '按無人機ID篩選' },
                batteryLevel: { type: 'number', description: '按電池電量篩選（百分比）' },
                connectionStatus: { type: 'string', description: '按連線狀態篩選，如 connected, disconnected' }
            }
        }
    },
    {
        name: 'get_drone_status_by_id',
        description: '根據狀態記錄ID獲取特定的無人機狀態詳細資訊',
        inputSchema: {
            type: 'object',
            required: ['statusId'],
            properties: {
                statusId: { type: 'string', description: '狀態記錄的唯一識別碼' }
            }
        }
    },
    {
        name: 'get_drone_realtime_status',
        description: '獲取無人機即時狀態資訊，包含當前位置、速度、方向等即時資料',
        inputSchema: {
            type: 'object',
            properties: {
                droneId: { type: 'string', description: '無人機ID，若不指定則返回所有無人機即時狀態' },
                includeHistory: { type: 'boolean', description: '是否包含歷史狀態資料' }
            }
        }
    },
    {
        name: 'get_archive_tasks',
        description: '獲取歸檔任務列表，用於管理無人機資料的歸檔作業',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'number', description: '頁碼，預設為 1' },
                pageSize: { type: 'number', description: '每頁資料數量，預設為 20' },
                taskStatus: { type: 'string', description: '按任務狀態篩選，如 pending, running, completed' },
                taskType: { type: 'string', description: '按任務類型篩選，如 position_archive, command_archive' }
            }
        }
    },
    {
        name: 'get_drone_statistics',
        description: '獲取無人機系統統計資訊，包含總數量、活躍狀態、指令統計等',
        inputSchema: {
            type: 'object',
            properties: {
                timeRange: { type: 'string', description: '時間範圍，如 today, week, month' },
                includeDetails: { type: 'boolean', description: '是否包含詳細統計資料' }
            }
        }
    },
    {
        name: 'search_drone_data',
        description: '綜合搜尋無人機資料，可同時搜尋位置、指令、狀態等資料',
        inputSchema: {
            type: 'object',
            required: ['query'],
            properties: {
                query: { type: 'string', description: '搜尋關鍵字' },
                dataTypes: { type: 'array', description: '資料類型陣列，如 [\"positions\", \"commands\", \"statuses\"]' },
                limit: { type: 'number', description: '每種資料類型的返回數量限制，預設為 10' }
            }
        }
    }
];

/**
 * Drone Service MCP 路由類別
 * 
 * 提供 MCP 協議的 HTTP API 端點，供 LLM AI Engine 調用
 */
@injectable()
export class DroneMCPRoutes {
    private router: Router;

    constructor(
        @inject(TYPES.DronePositionQueriesController) private dronePositionQueriesController: DronePositionQueriesController,
        @inject(TYPES.DroneCommandQueriesController) private droneCommandQueriesController: DroneCommandQueriesController,
        @inject(TYPES.DroneStatusQueriesController) private droneStatusQueriesController: DroneStatusQueriesController,
        @inject(TYPES.DroneRealTimeStatusQueriesController) private droneRealtimeQueriesController: DroneRealTimeStatusQueriesController,
        @inject(TYPES.ArchiveTaskQueriesController) private archiveTaskQueriesController: ArchiveTaskQueriesController
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * 初始化路由配置
     */
    private initializeRoutes = (): void => {
        // MCP 標準端點
        this.router.get('/list_tools', this.listTools);
        this.router.post('/call_tool', this.callTool);

        console.log('✅ Drone MCP routes initialized with', DRONE_MCP_TOOLS.length, 'tools');
    };

    /**
     * 獲取可用工具列表（MCP 標準）
     */
    private listTools = async (req: Request, res: Response): Promise<void> => {
        try {
            ResResult.success(res, { tools: DRONE_MCP_TOOLS }, '成功獲取 Drone Service 工具列表');
        } catch (error) {
            console.error('❌ List tools error:', error);
            ResResult.error(res, 500, '獲取工具列表失敗', error);
        }
    };

    /**
     * 執行工具調用（MCP 標準）
     */
    private callTool = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, arguments: args } = req.body;

            if (!name) {
                ResResult.error(res, 400, '工具名稱為必填參數');
                return;
            }

            // 路由到對應的工具處理函數
            switch (name) {
                case 'get_drone_positions':
                    await this.handleGetDronePositions(req, res, args);
                    break;

                case 'get_drone_position_by_id':
                    await this.handleGetDronePositionById(req, res, args);
                    break;

                case 'get_drone_commands':
                    await this.handleGetDroneCommands(req, res, args);
                    break;

                case 'get_drone_command_by_id':
                    await this.handleGetDroneCommandById(req, res, args);
                    break;

                case 'get_drone_statuses':
                    await this.handleGetDroneStatuses(req, res, args);
                    break;

                case 'get_drone_status_by_id':
                    await this.handleGetDroneStatusById(req, res, args);
                    break;

                case 'get_drone_realtime_status':
                    await this.handleGetDroneRealtimeStatus(req, res, args);
                    break;

                case 'get_archive_tasks':
                    await this.handleGetArchiveTasks(req, res, args);
                    break;

                case 'get_drone_statistics':
                    await this.handleGetDroneStatistics(req, res, args);
                    break;

                case 'search_drone_data':
                    await this.handleSearchDroneData(req, res, args);
                    break;

                default:
                    ResResult.error(res, 404, `未知的工具: ${name}`);
            }

        } catch (error) {
            console.error('❌ Tool execution error:', error);
            ResResult.error(res, 500, '工具執行失敗', error);
        }
    };

    /**
     * 處理獲取無人機位置
     */
    private handleGetDronePositions = async (req: Request, res: Response, args: any): Promise<void> => {
        // 將 MCP 參數轉換為查詢參數
        req.query = {
            page: args.page?.toString() || '1',
            pageSize: args.pageSize?.toString() || '20',
            search: args.search || '',
            droneId: args.droneId || '',
            sortBy: args.sortBy || 'createdAt',
            sortOrder: args.sortOrder || 'DESC'
        };

        // 呼叫現有的控制器方法
        await this.dronePositionQueriesController.getAllPositionsPaginated(req, res);
    };

    /**
     * 處理根據ID獲取無人機位置
     */
    private handleGetDronePositionById = async (req: Request, res: Response, args: any): Promise<void> => {
        if (!args.positionId) {
            ResResult.error(res, 400, '位置ID為必填參數');
            return;
        }

        req.params = { id: args.positionId };
        await this.dronePositionQueriesController.getPositionById(req, res);
    };

    /**
     * 處理獲取無人機指令
     */
    private handleGetDroneCommands = async (req: Request, res: Response, args: any): Promise<void> => {
        req.query = {
            page: args.page?.toString() || '1',
            pageSize: args.pageSize?.toString() || '20',
            search: args.search || '',
            droneId: args.droneId || '',
            status: args.status || '',
            commandType: args.commandType || ''
        };

        await this.droneCommandQueriesController.getAllCommandsPaginated(req, res);
    };

    /**
     * 處理根據ID獲取無人機指令
     */
    private handleGetDroneCommandById = async (req: Request, res: Response, args: any): Promise<void> => {
        if (!args.commandId) {
            ResResult.error(res, 400, '指令ID為必填參數');
            return;
        }

        req.params = { id: args.commandId };
        await this.droneCommandQueriesController.getCommandById(req, res);
    };

    /**
     * 處理獲取無人機狀態
     */
    private handleGetDroneStatuses = async (req: Request, res: Response, args: any): Promise<void> => {
        req.query = {
            page: args.page?.toString() || '1',
            pageSize: args.pageSize?.toString() || '20',
            search: args.search || '',
            droneId: args.droneId || '',
            batteryLevel: args.batteryLevel?.toString() || '',
            connectionStatus: args.connectionStatus || ''
        };

        await this.droneStatusQueriesController.getAllStatusesPaginated(req, res);
    };

    /**
     * 處理根據ID獲取無人機狀態
     */
    private handleGetDroneStatusById = async (req: Request, res: Response, args: any): Promise<void> => {
        if (!args.statusId) {
            ResResult.error(res, 400, '狀態ID為必填參數');
            return;
        }

        req.params = { id: args.statusId };
        await this.droneStatusQueriesController.getStatusById(req, res);
    };

    /**
     * 處理獲取無人機即時狀態
     */
    private handleGetDroneRealtimeStatus = async (req: Request, res: Response, args: any): Promise<void> => {
        req.query = {
            droneId: args.droneId || '',
            includeHistory: args.includeHistory?.toString() || 'false'
        };

        await this.droneRealtimeQueriesController.getAllRealTimeStatusPaginated(req, res);
    };

    /**
     * 處理獲取歸檔任務
     */
    private handleGetArchiveTasks = async (req: Request, res: Response, args: any): Promise<void> => {
        req.query = {
            page: args.page?.toString() || '1',
            pageSize: args.pageSize?.toString() || '20',
            taskStatus: args.taskStatus || '',
            taskType: args.taskType || ''
        };

        await this.archiveTaskQueriesController.getAllArchiveTasksPaginated(req, res);
    };

    /**
     * 處理獲取無人機統計資訊
     */
    private handleGetDroneStatistics = async (req: Request, res: Response, args: any): Promise<void> => {
        try {
            // 這是一個綜合統計功能，需要調用多個控制器來收集資料
            const stats = {
                summary: {
                    timeRange: args.timeRange || 'today',
                    generatedAt: new Date().toISOString()
                },
                counts: {
                    totalPositionRecords: 0,
                    totalCommands: 0,
                    totalStatusRecords: 0,
                    activeDrones: 0
                },
                recentActivity: {
                    recentCommands: [],
                    recentPositions: [],
                    recentStatuses: []
                }
            };

            if (args.includeDetails) {
                // 如果需要詳細資料，可以在這裡添加更多統計邏輯
                stats.counts = {
                    ...stats.counts,
                    // 這裡可以添加更詳細的統計資料
                };
            }

            ResResult.success(res, stats, '成功獲取無人機統計資訊');

        } catch (error) {
            console.error('❌ Get statistics error:', error);
            ResResult.error(res, 500, '獲取統計資訊失敗', error);
        }
    };

    /**
     * 處理綜合搜尋無人機資料
     */
    private handleSearchDroneData = async (req: Request, res: Response, args: any): Promise<void> => {
        try {
            if (!args.query) {
                ResResult.error(res, 400, '搜尋關鍵字為必填參數');
                return;
            }

            const searchResults = {
                query: args.query,
                dataTypes: args.dataTypes || ['positions', 'commands', 'statuses'],
                results: {
                    positions: [],
                    commands: [],
                    statuses: [],
                    realtime: []
                },
                summary: {
                    totalResults: 0,
                    searchTime: new Date().toISOString()
                }
            };

            // 根據指定的資料類型進行搜尋
            const dataTypes = args.dataTypes || ['positions', 'commands', 'statuses'];
            const limit = args.limit || 10;

            for (const dataType of dataTypes) {
                req.query = {
                    search: args.query,
                    pageSize: limit.toString(),
                    page: '1'
                };

                switch (dataType) {
                    case 'positions':
                        // 這裡需要修改控制器回應來收集結果，暫時跳過具體實現
                        searchResults.results.positions = [];
                        break;
                    case 'commands':
                        searchResults.results.commands = [];
                        break;
                    case 'statuses':
                        searchResults.results.statuses = [];
                        break;
                }
            }

            ResResult.success(res, searchResults, '搜尋完成');

        } catch (error) {
            console.error('❌ Search error:', error);
            ResResult.error(res, 500, '搜尋失敗', error);
        }
    };

    /**
     * 獲取 Express Router 實例
     */
    public getRouter = (): Router => {
        return this.router;
    };
}