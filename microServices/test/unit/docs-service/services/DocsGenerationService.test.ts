/**
 * @fileoverview DocsGenerationService 單元測試
 * 
 * 測試 docs-service 的文檔生成服務功能，包含：
 * - 文檔更新檢查邏輯
 * - 文檔生成流程
 * - 文件系統操作
 * - 命令執行和錯誤處理
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { DocsGenerationService } from '../../../../../docs-service/src/services/DocsGenerationService.js';
import { availableServices } from '../../../../../docs-service/src/config/index.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

// Mock 外部依賴
jest.mock('../../../../../docs-service/src/config/index.js');
jest.mock('child_process');
jest.mock('fs/promises');

const mockAvailableServices = availableServices as jest.Mocked<typeof availableServices>;
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DocsGenerationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
        
        // 設置默認 mock 返回值
        mockAvailableServices.mockReturnValue([
            { name: 'RBAC Service', path: '/rbac' },
            { name: 'Drone Service', path: '/drone' },
            { name: 'General Service', path: '/general' }
        ] as any);

        // 清除生成狀態
        DocsGenerationService.clearGenerationStatus();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('checkIfDocsNeedUpdate', () => {
        it('應該在所有服務都不需要更新時返回 false', async () => {
            // Mock 文件系統操作
            mockFs.access.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({
                mtime: new Date('2024-01-01T12:00:00Z')
            } as any);
            mockFs.readdir.mockResolvedValue([]);

            const result = await DocsGenerationService.checkIfDocsNeedUpdate();

            expect(result).toBe(false);
            expect(mockFs.access).toHaveBeenCalledTimes(6); // 每個服務檢查 src 和 docs 目錄
        });

        it('應該在有服務需要更新時返回 true', async () => {
            let accessCallCount = 0;
            mockFs.access.mockImplementation(() => {
                accessCallCount++;
                if (accessCallCount === 2) {
                    // 第二次調用（docs 目錄檢查）拋出錯誤，表示文檔不存在
                    return Promise.reject(new Error('Directory not exists'));
                }
                return Promise.resolve(undefined);
            });

            const result = await DocsGenerationService.checkIfDocsNeedUpdate();

            expect(result).toBe(true);
        });

        it('應該在源文件比文檔新時返回 true', async () => {
            mockFs.access.mockResolvedValue(undefined);
            mockFs.stat.mockResolvedValue({
                mtime: new Date('2024-01-01T10:00:00Z') // 文檔時間
            } as any);
            mockFs.readdir.mockResolvedValue([
                { name: 'test.ts', isDirectory: () => false, isFile: () => true }
            ] as any);
            
            // 模擬源文件更新時間比文檔新
            let statCallCount = 0;
            mockFs.stat.mockImplementation(() => {
                statCallCount++;
                if (statCallCount > 3) {
                    // 源文件的 stat 調用返回更新的時間
                    return Promise.resolve({
                        mtime: new Date('2024-01-01T12:00:00Z')
                    } as any);
                }
                return Promise.resolve({
                    mtime: new Date('2024-01-01T10:00:00Z')
                } as any);
            });

            const result = await DocsGenerationService.checkIfDocsNeedUpdate();

            expect(result).toBe(true);
        });

        it('應該處理文件系統錯誤並返回 false', async () => {
            const error = new Error('文件系統錯誤');
            mockFs.access.mockRejectedValue(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await DocsGenerationService.checkIfDocsNeedUpdate();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('檢查文檔更新狀態時發生錯誤:', error);
            
            consoleSpy.mockRestore();
        });
    });

    describe('generateAllDocs', () => {
        it('應該成功生成所有服務的文檔', async () => {
            // Mock 成功的命令執行
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockSpawn.mockReturnValue(mockProcess);

            const promise = DocsGenerationService.generateAllDocs();

            // 模擬所有服務成功生成
            setTimeout(() => {
                mockProcess.emit('close', 0);
            }, 100);
            setTimeout(() => {
                mockProcess.emit('close', 0);
            }, 200);
            setTimeout(() => {
                mockProcess.emit('close', 0);
            }, 300);

            jest.advanceTimersByTime(500);

            const result = await promise;

            expect(result).toBe(true);
            expect(mockSpawn).toHaveBeenCalledTimes(3);
        });

        it('應該在部分服務生成失敗時返回 false', async () => {
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockSpawn.mockReturnValue(mockProcess);

            const promise = DocsGenerationService.generateAllDocs();

            // 模擬第一個服務成功，第二個失敗，第三個成功
            setTimeout(() => {
                mockProcess.emit('close', 0);
            }, 100);
            setTimeout(() => {
                mockProcess.emit('close', 1); // 失敗
            }, 200);
            setTimeout(() => {
                mockProcess.emit('close', 0);
            }, 300);

            jest.advanceTimersByTime(500);

            const result = await promise;

            expect(result).toBe(false);
        });

        it('應該防止併發生成', async () => {
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockSpawn.mockReturnValue(mockProcess);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // 啟動第一個生成請求
            const promise1 = DocsGenerationService.generateAllDocs();
            
            // 立即啟動第二個生成請求
            const promise2 = DocsGenerationService.generateAllDocs();

            // 完成第一個請求
            setTimeout(() => {
                mockProcess.emit('close', 0);
                mockProcess.emit('close', 0);
                mockProcess.emit('close', 0);
            }, 100);

            jest.advanceTimersByTime(200);

            const [result1, result2] = await Promise.all([promise1, promise2]);

            expect(result1).toBe(true);
            expect(result2).toBe(true); // 第二個請求應該立即返回
            expect(consoleSpy).toHaveBeenCalledWith('📋 文檔生成已在進行中，跳過重複請求');
            
            consoleSpy.mockRestore();
        });

        it('應該處理生成過程中的異常', async () => {
            const error = new Error('生成過程異常');
            mockSpawn.mockImplementation(() => {
                throw error;
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await DocsGenerationService.generateAllDocs();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('❌ 文檔生成過程中發生錯誤:', error);
            
            consoleSpy.mockRestore();
        });
    });

    describe('runDocCommand', () => {
        it('應該成功執行文檔生成命令', async () => {
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockProcess.kill = jest.fn();
            mockSpawn.mockReturnValue(mockProcess);

            // 使用 Reflect 訪問私有方法進行測試
            const runDocCommand = Reflect.get(DocsGenerationService, 'runDocCommand');
            const promise = runDocCommand('/test/service', 'test-service');

            setTimeout(() => {
                mockProcess.stdout.emit('data', 'Generated documentation');
                mockProcess.emit('close', 0);
            }, 100);

            jest.advanceTimersByTime(200);

            const result = await promise;

            expect(result).toBe(true);
            expect(mockSpawn).toHaveBeenCalledWith('npm', ['run', 'docs:generate'], {
                cwd: '/test/service',
                stdio: ['ignore', 'pipe', 'pipe']
            });
        });

        it('應該處理命令執行失敗', async () => {
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockProcess.kill = jest.fn();
            mockSpawn.mockReturnValue(mockProcess);

            const runDocCommand = Reflect.get(DocsGenerationService, 'runDocCommand');
            const promise = runDocCommand('/test/service', 'test-service');

            setTimeout(() => {
                mockProcess.stderr.emit('data', 'Generation failed');
                mockProcess.emit('close', 1);
            }, 100);

            jest.advanceTimersByTime(200);

            const result = await promise;

            expect(result).toBe(false);
        });

        it('應該處理命令執行超時', async () => {
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockProcess.kill = jest.fn();
            mockSpawn.mockReturnValue(mockProcess);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const runDocCommand = Reflect.get(DocsGenerationService, 'runDocCommand');
            const promise = runDocCommand('/test/service', 'test-service');

            // 模擬超時（30秒）
            jest.advanceTimersByTime(30000);

            const result = await promise;

            expect(result).toBe(false);
            expect(mockProcess.kill).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('⏰ 服務 test-service 文檔生成超時');
            
            consoleSpy.mockRestore();
        });

        it('應該處理進程錯誤', async () => {
            const mockProcess = new EventEmitter() as any;
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();
            mockProcess.kill = jest.fn();
            mockSpawn.mockReturnValue(mockProcess);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const runDocCommand = Reflect.get(DocsGenerationService, 'runDocCommand');
            const promise = runDocCommand('/test/service', 'test-service');

            const processError = new Error('進程錯誤');
            setTimeout(() => {
                mockProcess.emit('error', processError);
            }, 100);

            jest.advanceTimersByTime(200);

            const result = await promise;

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('執行 npm run docs:generate 時發生錯誤 (test-service):', processError);
            
            consoleSpy.mockRestore();
        });
    });

    describe('getServiceFolderName', () => {
        it('應該正確映射服務名稱到資料夾名稱', () => {
            const getServiceFolderName = Reflect.get(DocsGenerationService, 'getServiceFolderName');

            expect(getServiceFolderName('RBAC Service')).toBe('rbac-service');
            expect(getServiceFolderName('Drone Service')).toBe('drone-service');
            expect(getServiceFolderName('Drone WebSocket Service')).toBe('drone-websocket-service');
            expect(getServiceFolderName('General Service')).toBe('general-service');
            expect(getServiceFolderName('Unknown Service')).toBe('Unknown Service');
        });
    });

    describe('isSourceFile', () => {
        it('應該正確識別源代碼文件', () => {
            const isSourceFile = Reflect.get(DocsGenerationService, 'isSourceFile');

            expect(isSourceFile('test.ts')).toBe(true);
            expect(isSourceFile('test.tsx')).toBe(true);
            expect(isSourceFile('test.js')).toBe(true);
            expect(isSourceFile('test.jsx')).toBe(true);
            expect(isSourceFile('config.json')).toBe(true);
            expect(isSourceFile('test.txt')).toBe(false);
            expect(isSourceFile('node_modules/test.js')).toBe(false);
            expect(isSourceFile('dist/test.js')).toBe(false);
            expect(isSourceFile('.git/test.js')).toBe(false);
            expect(isSourceFile('docs/test.js')).toBe(false);
        });
    });

    describe('getLatestModificationTime', () => {
        it('應該正確獲取目錄中最新的修改時間', async () => {
            const testDate1 = new Date('2024-01-01T10:00:00Z');
            const testDate2 = new Date('2024-01-01T12:00:00Z');
            const testDate3 = new Date('2024-01-01T08:00:00Z');

            mockFs.readdir.mockResolvedValue([
                { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
                { name: 'file2.js', isDirectory: () => false, isFile: () => true },
                { name: 'subdir', isDirectory: () => true, isFile: () => false }
            ] as any);

            let statCallCount = 0;
            mockFs.stat.mockImplementation(() => {
                statCallCount++;
                if (statCallCount === 1) return Promise.resolve({ mtime: testDate1 } as any);
                if (statCallCount === 2) return Promise.resolve({ mtime: testDate2 } as any);
                return Promise.resolve({ mtime: testDate3 } as any);
            });

            // 模擬子目錄遞歸
            mockFs.readdir
                .mockResolvedValueOnce([
                    { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
                    { name: 'file2.js', isDirectory: () => false, isFile: () => true },
                    { name: 'subdir', isDirectory: () => true, isFile: () => false }
                ] as any)
                .mockResolvedValueOnce([
                    { name: 'subfile.ts', isDirectory: () => false, isFile: () => true }
                ] as any);

            const getLatestModificationTime = Reflect.get(DocsGenerationService, 'getLatestModificationTime');
            const result = await getLatestModificationTime('/test/dir');

            expect(result).toEqual(testDate2); // 應該返回最新的時間
        });

        it('應該處理讀取目錄錯誤', async () => {
            const error = new Error('讀取目錄失敗');
            mockFs.readdir.mockRejectedValue(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const getLatestModificationTime = Reflect.get(DocsGenerationService, 'getLatestModificationTime');
            const result = await getLatestModificationTime('/test/dir');

            expect(result).toEqual(new Date(0)); // 應該返回默認時間
            expect(consoleSpy).toHaveBeenCalledWith('讀取目錄 /test/dir 時發生錯誤:', error);
            
            consoleSpy.mockRestore();
        });
    });

    describe('生成狀態管理', () => {
        it('應該正確跟蹤生成狀態', () => {
            const status = DocsGenerationService.getGenerationStatus();
            expect(status).toBeInstanceOf(Map);
            expect(status.size).toBe(0);
        });

        it('應該能夠清除生成狀態', () => {
            DocsGenerationService.clearGenerationStatus();
            const status = DocsGenerationService.getGenerationStatus();
            expect(status.size).toBe(0);
        });
    });

    describe('邊界條件測試', () => {
        it('應該處理空的服務列表', async () => {
            mockAvailableServices.mockReturnValue([] as any);

            const result = await DocsGenerationService.checkIfDocsNeedUpdate();

            expect(result).toBe(false);
        });

        it('應該處理服務目錄不存在的情況', async () => {
            mockFs.access.mockImplementation((path) => {
                if (path.includes('/app/microservices/')) {
                    return Promise.reject(new Error('目錄不存在'));
                }
                return Promise.resolve(undefined);
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await DocsGenerationService.generateAllDocs();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('跳過不存在的服務'));
            
            consoleSpy.mockRestore();
        });

        it('應該處理 package.json 不存在的情況', async () => {
            let accessCallCount = 0;
            mockFs.access.mockImplementation(() => {
                accessCallCount++;
                if (accessCallCount > 3) {
                    // package.json 檢查失敗
                    return Promise.reject(new Error('文件不存在'));
                }
                return Promise.resolve(undefined);
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = await DocsGenerationService.generateAllDocs();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('沒有 package.json，跳過文檔生成'));
            
            consoleSpy.mockRestore();
        });
    });
});