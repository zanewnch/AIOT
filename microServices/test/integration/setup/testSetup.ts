/**
 * @fileoverview 整合測試設置框架
 * 
 * 提供整合測試的共用設置，包含：
 * - 測試環境配置
 * - 資料庫連接管理
 * - 測試資料建立和清理
 * - HTTP 客戶端設置
 * - 通用測試工具
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { Sequelize } from 'sequelize';
import { createLogger } from '@aiot/shared-packages/loggerConfig.js';

const logger = createLogger('IntegrationTestSetup');

/**
 * 測試環境配置介面
 */
export interface TestEnvironmentConfig {
    services: {
        rbacService: {
            baseUrl: string;
            port: number;
        };
        droneService: {
            baseUrl: string;
            port: number;
        };
        generalService: {
            baseUrl: string;
            port: number;
        };
        apiGateway: {
            baseUrl: string;
            port: number;
        };
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    timeout: number;
    retryAttempts: number;
}

/**
 * 測試資料介面
 */
export interface TestData {
    users: Array<{
        id: number;
        username: string;
        email: string;
        password: string;
        is_active: boolean;
    }>;
    roles: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    permissions: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    drones: Array<{
        id: number;
        name: string;
        model: string;
        status: string;
    }>;
}

/**
 * HTTP 客戶端管理器
 */
export class HttpClientManager {
    private clients: Map<string, AxiosInstance> = new Map();
    private authTokens: Map<string, string> = new Map();

    constructor(private config: TestEnvironmentConfig) {
        this.initializeClients();
    }

    private initializeClients(): void {
        // RBAC Service 客戶端
        this.clients.set('rbac', axios.create({
            baseURL: this.config.services.rbacService.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        }));

        // Drone Service 客戶端
        this.clients.set('drone', axios.create({
            baseURL: this.config.services.droneService.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        }));

        // General Service 客戶端
        this.clients.set('general', axios.create({
            baseURL: this.config.services.generalService.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        }));

        // API Gateway 客戶端
        this.clients.set('gateway', axios.create({
            baseURL: this.config.services.apiGateway.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true // 支援 cookie 認證
        }));
    }

    /**
     * 獲取指定服務的 HTTP 客戶端
     */
    getClient(serviceName: string): AxiosInstance {
        const client = this.clients.get(serviceName);
        if (!client) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        return client;
    }

    /**
     * 用戶登入並儲存認證令牌
     */
    async authenticateUser(serviceName: string, username: string, password: string): Promise<void> {
        try {
            const client = this.getClient(serviceName);
            const response = await client.post('/api/auth/login', {
                username,
                password
            });

            if (response.data.token) {
                this.authTokens.set(serviceName, response.data.token);
                // 設置認證標頭
                client.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            }

            logger.info(`User ${username} authenticated successfully for ${serviceName}`);
        } catch (error) {
            logger.error(`Authentication failed for ${serviceName}:`, error);
            throw error;
        }
    }

    /**
     * 清除認證信息
     */
    clearAuthentication(serviceName?: string): void {
        if (serviceName) {
            this.authTokens.delete(serviceName);
            const client = this.clients.get(serviceName);
            if (client) {
                delete client.defaults.headers.common['Authorization'];
            }
        } else {
            this.authTokens.clear();
            this.clients.forEach((client) => {
                delete client.defaults.headers.common['Authorization'];
            });
        }
    }
}

/**
 * 資料庫管理器
 */
export class DatabaseManager {
    private sequelize: Sequelize;

    constructor(private config: TestEnvironmentConfig) {
        this.sequelize = new Sequelize({
            dialect: 'mysql',
            host: config.database.host,
            port: config.database.port,
            username: config.database.username,
            password: config.database.password,
            database: config.database.database,
            logging: false, // 測試時不輸出 SQL 日誌
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });
    }

    /**
     * 測試資料庫連接
     */
    async testConnection(): Promise<void> {
        try {
            await this.sequelize.authenticate();
            logger.info('Database connection established successfully');
        } catch (error) {
            logger.error('Unable to connect to database:', error);
            throw error;
        }
    }

    /**
     * 執行 SQL 查詢
     */
    async query(sql: string, replacements?: any): Promise<any> {
        return await this.sequelize.query(sql, {
            replacements,
            type: 'SELECT'
        });
    }

    /**
     * 清理測試資料
     */
    async cleanDatabase(): Promise<void> {
        try {
            // 按照外鍵依賴順序清理資料表
            const tables = [
                'user_to_roles',
                'role_to_permissions', 
                'drone_commands',
                'drone_positions',
                'drone_status',
                'user_preferences',
                'permissions',
                'roles',
                'users',
                'drones'
            ];

            for (const table of tables) {
                await this.sequelize.query(`DELETE FROM ${table}`, { type: 'DELETE' });
                // 重設自增 ID
                await this.sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`, { type: 'RAW' });
            }

            logger.info('Database cleaned successfully');
        } catch (error) {
            logger.error('Error cleaning database:', error);
            throw error;
        }
    }

    /**
     * 關閉資料庫連接
     */
    async close(): Promise<void> {
        await this.sequelize.close();
        logger.info('Database connection closed');
    }
}

/**
 * 測試資料管理器
 */
export class TestDataManager {
    constructor(
        private dbManager: DatabaseManager,
        private httpManager: HttpClientManager
    ) {}

    /**
     * 建立測試資料
     */
    async seedTestData(): Promise<TestData> {
        logger.info('Seeding test data...');

        try {
            // 創建測試使用者
            const users = await this.createTestUsers();
            
            // 創建測試角色
            const roles = await this.createTestRoles();
            
            // 創建測試權限
            const permissions = await this.createTestPermissions();
            
            // 創建測試無人機
            const drones = await this.createTestDrones();

            // 建立使用者角色關聯
            await this.assignRolesToUsers(users, roles);
            
            // 建立角色權限關聯
            await this.assignPermissionsToRoles(roles, permissions);

            logger.info('Test data seeded successfully');

            return {
                users,
                roles,
                permissions,
                drones
            };
        } catch (error) {
            logger.error('Error seeding test data:', error);
            throw error;
        }
    }

    private async createTestUsers(): Promise<TestData['users']> {
        const client = this.httpManager.getClient('rbac');
        
        const testUsers = [
            {
                username: 'admin_test',
                email: 'admin@test.com',
                password: 'admin123',
                is_active: true
            },
            {
                username: 'operator_test',
                email: 'operator@test.com',
                password: 'operator123',
                is_active: true
            },
            {
                username: 'viewer_test',
                email: 'viewer@test.com',
                password: 'viewer123',
                is_active: true
            }
        ];

        const users = [];
        for (const userData of testUsers) {
            try {
                const response = await client.post('/api/rbac/users', userData);
                users.push({
                    id: response.data.data.id,
                    ...userData
                });
            } catch (error) {
                logger.warn(`User ${userData.username} might already exist`);
                // 嘗試通過登入獲取用戶 ID
                const loginResponse = await client.post('/api/auth/login', {
                    username: userData.username,
                    password: userData.password
                });
                users.push({
                    id: loginResponse.data.user.id,
                    ...userData
                });
            }
        }

        return users;
    }

    private async createTestRoles(): Promise<TestData['roles']> {
        const client = this.httpManager.getClient('rbac');
        
        const testRoles = [
            { name: 'admin', description: '系統管理員' },
            { name: 'operator', description: '操作員' },
            { name: 'viewer', description: '觀察員' }
        ];

        const roles = [];
        for (const roleData of testRoles) {
            try {
                const response = await client.post('/api/rbac/roles', roleData);
                roles.push({
                    id: response.data.data.id,
                    ...roleData
                });
            } catch (error) {
                logger.warn(`Role ${roleData.name} might already exist`);
            }
        }

        return roles;
    }

    private async createTestPermissions(): Promise<TestData['permissions']> {
        const client = this.httpManager.getClient('rbac');
        
        const testPermissions = [
            { name: 'user.create', description: '創建使用者' },
            { name: 'user.read', description: '讀取使用者' },
            { name: 'user.update', description: '更新使用者' },
            { name: 'user.delete', description: '刪除使用者' },
            { name: 'drone.control', description: '控制無人機' },
            { name: 'drone.view', description: '查看無人機狀態' }
        ];

        const permissions = [];
        for (const permData of testPermissions) {
            try {
                const response = await client.post('/api/rbac/permissions', permData);
                permissions.push({
                    id: response.data.data.id,
                    ...permData
                });
            } catch (error) {
                logger.warn(`Permission ${permData.name} might already exist`);
            }
        }

        return permissions;
    }

    private async createTestDrones(): Promise<TestData['drones']> {
        const client = this.httpManager.getClient('drone');
        
        const testDrones = [
            { name: 'Drone-001', model: 'DJI Mini 3', status: 'idle' },
            { name: 'Drone-002', model: 'DJI Air 2S', status: 'flying' },
            { name: 'Drone-003', model: 'DJI Mavic 3', status: 'maintenance' }
        ];

        const drones = [];
        for (const droneData of testDrones) {
            try {
                const response = await client.post('/api/drones', droneData);
                drones.push({
                    id: response.data.data.id,
                    ...droneData
                });
            } catch (error) {
                logger.warn(`Drone ${droneData.name} might already exist`);
            }
        }

        return drones;
    }

    private async assignRolesToUsers(users: TestData['users'], roles: TestData['roles']): Promise<void> {
        const client = this.httpManager.getClient('rbac');
        
        // 分配角色：admin 用戶 -> admin 角色，operator 用戶 -> operator 角色，等等
        const assignments = [
            { userId: users.find(u => u.username === 'admin_test')?.id, roleId: roles.find(r => r.name === 'admin')?.id },
            { userId: users.find(u => u.username === 'operator_test')?.id, roleId: roles.find(r => r.name === 'operator')?.id },
            { userId: users.find(u => u.username === 'viewer_test')?.id, roleId: roles.find(r => r.name === 'viewer')?.id }
        ];

        for (const assignment of assignments) {
            if (assignment.userId && assignment.roleId) {
                try {
                    await client.post(`/api/rbac/users/${assignment.userId}/roles`, {
                        roleId: assignment.roleId
                    });
                } catch (error) {
                    logger.warn('Role assignment might already exist');
                }
            }
        }
    }

    private async assignPermissionsToRoles(roles: TestData['roles'], permissions: TestData['permissions']): Promise<void> {
        const client = this.httpManager.getClient('rbac');
        
        // 分配權限給角色
        const adminRole = roles.find(r => r.name === 'admin');
        const operatorRole = roles.find(r => r.name === 'operator');
        const viewerRole = roles.find(r => r.name === 'viewer');

        if (adminRole) {
            // admin 角色獲得所有權限
            for (const permission of permissions) {
                try {
                    await client.post(`/api/rbac/roles/${adminRole.id}/permissions`, {
                        permissionId: permission.id
                    });
                } catch (error) {
                    logger.warn('Permission assignment might already exist');
                }
            }
        }

        if (operatorRole) {
            // operator 角色獲得無人機控制權限
            const dronePermissions = permissions.filter(p => p.name.startsWith('drone.'));
            for (const permission of dronePermissions) {
                try {
                    await client.post(`/api/rbac/roles/${operatorRole.id}/permissions`, {
                        permissionId: permission.id
                    });
                } catch (error) {
                    logger.warn('Permission assignment might already exist');
                }
            }
        }

        if (viewerRole) {
            // viewer 角色只有查看權限
            const viewPermissions = permissions.filter(p => p.name.includes('read') || p.name.includes('view'));
            for (const permission of viewPermissions) {
                try {
                    await client.post(`/api/rbac/roles/${viewerRole.id}/permissions`, {
                        permissionId: permission.id
                    });
                } catch (error) {
                    logger.warn('Permission assignment might already exist');
                }
            }
        }
    }
}

/**
 * 整合測試設置類別
 */
export class IntegrationTestSetup {
    public config: TestEnvironmentConfig;
    public httpManager: HttpClientManager;
    public dbManager: DatabaseManager;
    public dataManager: TestDataManager;
    public testData: TestData | null = null;

    constructor(config?: Partial<TestEnvironmentConfig>) {
        this.config = this.buildConfig(config);
        this.httpManager = new HttpClientManager(this.config);
        this.dbManager = new DatabaseManager(this.config);
        this.dataManager = new TestDataManager(this.dbManager, this.httpManager);
    }

    private buildConfig(overrides?: Partial<TestEnvironmentConfig>): TestEnvironmentConfig {
        const defaultConfig: TestEnvironmentConfig = {
            services: {
                rbacService: {
                    baseUrl: process.env.RBAC_SERVICE_URL || 'http://localhost:3001',
                    port: parseInt(process.env.RBAC_SERVICE_PORT || '3001')
                },
                droneService: {
                    baseUrl: process.env.DRONE_SERVICE_URL || 'http://localhost:3002',
                    port: parseInt(process.env.DRONE_SERVICE_PORT || '3002')
                },
                generalService: {
                    baseUrl: process.env.GENERAL_SERVICE_URL || 'http://localhost:3003',
                    port: parseInt(process.env.GENERAL_SERVICE_PORT || '3003')
                },
                apiGateway: {
                    baseUrl: process.env.API_GATEWAY_URL || 'http://localhost:30000',
                    port: parseInt(process.env.API_GATEWAY_PORT || '30000')
                }
            },
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                username: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'password',
                database: process.env.DB_NAME || 'aiot_test'
            },
            timeout: 10000,
            retryAttempts: 3
        };

        return { ...defaultConfig, ...overrides };
    }

    /**
     * 設置測試環境
     */
    async setup(): Promise<void> {
        logger.info('Setting up integration test environment...');
        
        try {
            // 測試資料庫連接
            await this.dbManager.testConnection();
            
            // 清理舊資料
            await this.dbManager.cleanDatabase();
            
            // 等待服務啟動 (簡單的健康檢查)
            await this.waitForServices();
            
            // 建立測試資料
            this.testData = await this.dataManager.seedTestData();
            
            logger.info('Integration test environment setup completed');
        } catch (error) {
            logger.error('Failed to setup test environment:', error);
            throw error;
        }
    }

    /**
     * 清理測試環境
     */
    async teardown(): Promise<void> {
        logger.info('Tearing down integration test environment...');
        
        try {
            // 清理認證信息
            this.httpManager.clearAuthentication();
            
            // 清理測試資料
            await this.dbManager.cleanDatabase();
            
            // 關閉資料庫連接
            await this.dbManager.close();
            
            logger.info('Integration test environment teardown completed');
        } catch (error) {
            logger.error('Failed to teardown test environment:', error);
            throw error;
        }
    }

    /**
     * 等待所有服務啟動
     */
    private async waitForServices(): Promise<void> {
        const services = ['rbac', 'drone', 'general', 'gateway'];
        
        for (const service of services) {
            await this.waitForService(service);
        }
    }

    /**
     * 等待指定服務啟動
     */
    private async waitForService(serviceName: string): Promise<void> {
        const client = this.httpManager.getClient(serviceName);
        let attempts = 0;

        while (attempts < this.config.retryAttempts) {
            try {
                await client.get('/health');
                logger.info(`Service ${serviceName} is ready`);
                return;
            } catch (error) {
                attempts++;
                logger.warn(`Service ${serviceName} not ready, attempt ${attempts}/${this.config.retryAttempts}`);
                
                if (attempts >= this.config.retryAttempts) {
                    throw new Error(`Service ${serviceName} failed to start after ${attempts} attempts`);
                }
                
                // 等待 2 秒後重試
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    /**
     * 取得管理員認證的 HTTP 客戶端
     */
    async getAuthenticatedClient(serviceName: string, username = 'admin_test'): Promise<AxiosInstance> {
        const user = this.testData?.users.find(u => u.username === username);
        if (!user) {
            throw new Error(`Test user ${username} not found`);
        }

        await this.httpManager.authenticateUser(serviceName, user.username, user.password);
        return this.httpManager.getClient(serviceName);
    }
}

/**
 * 常用測試輔助函數
 */
export class TestHelpers {
    /**
     * 延遲函數
     */
    static async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 重試函數
     */
    static async retry<T>(
        fn: () => Promise<T>, 
        maxAttempts: number = 3, 
        delay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                if (attempt < maxAttempts) {
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError!;
    }

    /**
     * 生成隨機字符串
     */
    static generateRandomString(length: number = 8): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 檢查響應是否成功
     */
    static isSuccessResponse(status: number): boolean {
        return status >= 200 && status < 300;
    }

    /**
     * 驗證 API 響應格式
     */
    static validateApiResponse(response: any, expectedStatus: number): void {
        expect(response.status).toBe(expectedStatus);
        expect(response.data).toBeDefined();
        expect(typeof response.data.status).toBe('number');
        expect(typeof response.data.message).toBe('string');
    }
}