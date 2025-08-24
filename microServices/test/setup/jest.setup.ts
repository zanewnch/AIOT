/**
 * @fileoverview Jest 測試環境設定
 * 
 * 配置全域測試環境，包含：
 * - 環境變數設定
 * - 全域 Mock 設定
 * - 測試超時處理
 * - 錯誤處理設定
 * - 測試工具配置
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { config } from 'dotenv';
import { performance } from 'perf_hooks';

// 載入測試環境變數
config({ path: '.env.test' });

// 設定測試環境變數
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.DB_NAME = process.env.DB_NAME || 'aiot_test';

// 全域測試配置
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinRange(floor: number, ceiling: number): R;
            toBeValidDate(): R;
            toBeValidEmail(): R;
            toBeValidUUID(): R;
            toHaveTimestampDifference(timestamp: string, maxDiffMs: number): R;
        }
    }
}

// 擴展 Jest 匹配器
expect.extend({
    toBeWithinRange(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },

    toBeValidDate(received: string | Date) {
        const date = new Date(received);
        const pass = !isNaN(date.getTime());
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid date`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid date`,
                pass: false,
            };
        }
    },

    toBeValidEmail(received: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass = emailRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid email`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid email`,
                pass: false,
            };
        }
    },

    toBeValidUUID(received: string) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const pass = uuidRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid UUID`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid UUID`,
                pass: false,
            };
        }
    },

    toHaveTimestampDifference(received: string, expectedTimestamp: string, maxDiffMs: number = 1000) {
        const receivedDate = new Date(received);
        const expectedDate = new Date(expectedTimestamp);
        const diff = Math.abs(receivedDate.getTime() - expectedDate.getTime());
        const pass = diff <= maxDiffMs;
        
        if (pass) {
            return {
                message: () => `expected timestamp difference of ${diff}ms to be greater than ${maxDiffMs}ms`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected timestamp difference of ${diff}ms to be within ${maxDiffMs}ms`,
                pass: false,
            };
        }
    },
});

// 全域 Mock 設定
jest.mock('@aiot/shared-packages/loggerConfig.js', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
    })),
    logRequest: jest.fn(),
    logAuthEvent: jest.fn(),
    logPermissionCheck: jest.fn(),
}));

// Mock Redis
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        expire: jest.fn(),
        flushAll: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isReady: true,
        isOpen: true,
    })),
}));

// Mock MongoDB
jest.mock('mongodb', () => ({
    MongoClient: {
        connect: jest.fn(() => ({
            db: jest.fn(() => ({
                collection: jest.fn(() => ({
                    find: jest.fn(() => ({
                        toArray: jest.fn(() => []),
                        limit: jest.fn(() => ({ toArray: jest.fn(() => []) })),
                        sort: jest.fn(() => ({ toArray: jest.fn(() => []) })),
                    })),
                    findOne: jest.fn(),
                    insertOne: jest.fn(),
                    insertMany: jest.fn(),
                    updateOne: jest.fn(),
                    updateMany: jest.fn(),
                    deleteOne: jest.fn(),
                    deleteMany: jest.fn(),
                    countDocuments: jest.fn(),
                })),
            })),
            close: jest.fn(),
        })),
    },
}));

// Mock Mongoose
jest.mock('mongoose', () => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    connection: {
        readyState: 1,
        on: jest.fn(),
        once: jest.fn(),
    },
    Schema: jest.fn(() => ({})),
    model: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(() => Promise.resolve('hashed_password')),
    compare: jest.fn(() => Promise.resolve(true)),
    genSalt: jest.fn(() => Promise.resolve('salt')),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mocked_jwt_token'),
    verify: jest.fn(() => ({ userId: 1, username: 'testuser' })),
    decode: jest.fn(() => ({ userId: 1, username: 'testuser' })),
}));

// Mock Express
jest.mock('express', () => {
    const mockExpress = () => ({
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        listen: jest.fn((port, callback) => {
            if (callback) callback();
            return { close: jest.fn() };
        }),
        set: jest.fn(),
        static: jest.fn(),
    });
    
    mockExpress.json = jest.fn();
    mockExpress.urlencoded = jest.fn();
    mockExpress.static = jest.fn();
    mockExpress.Router = jest.fn(() => ({
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
    }));
    
    return mockExpress;
});

// 全域測試 Hooks
beforeAll(async () => {
    // 記錄測試開始時間
    (global as any).testStartTime = performance.now();
    
    // 設定測試逾時警告
    jest.setTimeout(30000);
    
    console.log('🧪 Starting test suite...');
});

afterAll(async () => {
    // 計算測試執行時間
    const testEndTime = performance.now();
    const testDuration = testEndTime - (global as any).testStartTime;
    
    console.log(`✅ Test suite completed in ${Math.round(testDuration)}ms`);
    
    // 清理全域資源
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
});

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
});

// 測試失敗時的額外資訊
const originalTestFn = (global as any).test;
if (originalTestFn) {
    (global as any).test = (name: string, fn: () => void | Promise<void>, timeout?: number) => {
        return originalTestFn(name, async () => {
            const testStartTime = performance.now();
            
            try {
                await fn();
            } catch (error) {
                const testEndTime = performance.now();
                const testDuration = testEndTime - testStartTime;
                
                console.error(`❌ Test "${name}" failed after ${Math.round(testDuration)}ms`);
                console.error('Error details:', error);
                throw error;
            }
            
            const testEndTime = performance.now();
            const testDuration = testEndTime - testStartTime;
            
            if (testDuration > 5000) {
                console.warn(`⚠️ Test "${name}" took ${Math.round(testDuration)}ms (slow test)`);
            }
        }, timeout);
    };
}

// 測試工具函數
(global as any).testUtils = {
    /**
     * 等待指定時間
     */
    sleep: (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 生成隨機字符串
     */
    randomString: (length: number = 8): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * 生成隨機數字
     */
    randomNumber: (min: number = 0, max: number = 100): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 生成隨機電子郵件
     */
    randomEmail: (): string => {
        const username = (global as any).testUtils.randomString(8);
        const domain = (global as any).testUtils.randomString(5);
        return `${username}@${domain}.com`;
    },

    /**
     * 創建模擬的 Express Request 物件
     */
    mockRequest: (overrides: any = {}): any => {
        return {
            body: {},
            params: {},
            query: {},
            headers: {},
            user: null,
            ...overrides,
        };
    },

    /**
     * 創建模擬的 Express Response 物件
     */
    mockResponse: (): any => {
        const res: any = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            send: jest.fn(() => res),
            redirect: jest.fn(() => res),
            cookie: jest.fn(() => res),
            clearCookie: jest.fn(() => res),
            set: jest.fn(() => res),
            get: jest.fn(),
        };
        return res;
    },

    /**
     * 創建模擬的 Next Function
     */
    mockNext: (): jest.MockedFunction<any> => {
        return jest.fn();
    },
};

// 導出類型定義
export {};

console.log('✨ Jest setup completed');
console.log(`📝 Test environment: ${process.env.NODE_ENV}`);
console.log(`🗄️ Test database: ${process.env.DB_NAME}`);
console.log(`📊 Log level: ${process.env.LOG_LEVEL}`);