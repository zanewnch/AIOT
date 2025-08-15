/**
 * @fileoverview DocsController 單元測試
 * 
 * 測試 docs-service 的文檔控制器功能，包含：
 * - 文檔首頁渲染
 * - 手動觸發文檔生成
 * - 生成狀態查詢
 * - 重定向功能
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { Request, Response } from 'express';
import { DocsController } from '../../../../../docs-service/src/controllers/docsController.js';
import { DocsGenerationService } from '../../../../../docs-service/src/services/DocsGenerationService.js';
import { availableServices, config } from '../../../../../docs-service/src/config/index.js';

// Mock DocsGenerationService
jest.mock('../../../../../docs-service/src/services/DocsGenerationService.js');
// Mock config
jest.mock('../../../../../docs-service/src/config/index.js');

const mockDocsGenerationService = DocsGenerationService as jest.Mocked<typeof DocsGenerationService>;
const mockAvailableServices = availableServices as jest.Mocked<typeof availableServices>;
const mockConfig = config as jest.Mocked<typeof config>;

describe('DocsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockRender: jest.Mock;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;
    let mockRedirect: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // 設置 mock 返回值
        mockAvailableServices.mockReturnValue([
            { name: 'RBAC Service', path: '/rbac' },
            { name: 'Drone Service', path: '/drone' }
        ] as any);
        
        mockConfig.mockReturnValue({
            service: { version: '1.0.0' }
        } as any);

        // Mock Express Response methods
        mockRender = jest.fn();
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnThis();
        mockRedirect = jest.fn();

        mockRequest = {};
        mockResponse = {
            render: mockRender,
            json: mockJson,
            status: mockStatus,
            redirect: mockRedirect
        };
    });

    describe('getHomepage', () => {
        it('應該成功渲染首頁且文檔不需要更新', async () => {
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockResolvedValue(false);

            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);

            expect(mockDocsGenerationService.checkIfDocsNeedUpdate).toHaveBeenCalledTimes(1);
            expect(mockDocsGenerationService.generateAllDocs).not.toHaveBeenCalled();
            expect(mockRender).toHaveBeenCalledWith('homepage', expect.objectContaining({
                services: expect.any(Array),
                version: '1.0.0',
                lastUpdated: expect.any(String),
                generationInfo: expect.objectContaining({
                    needsUpdate: false,
                    checkDuration: expect.any(Number),
                    timestamp: expect.any(String)
                })
            }));
        });

        it('應該在文檔需要更新時生成文檔並渲染首頁', async () => {
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockResolvedValue(true);
            mockDocsGenerationService.generateAllDocs.mockResolvedValue(true);

            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);

            expect(mockDocsGenerationService.checkIfDocsNeedUpdate).toHaveBeenCalledTimes(1);
            expect(mockDocsGenerationService.generateAllDocs).toHaveBeenCalledTimes(1);
            expect(mockRender).toHaveBeenCalledWith('homepage', expect.objectContaining({
                generationInfo: expect.objectContaining({
                    needsUpdate: true
                })
            }));
        });

        it('應該在文檔生成失敗時仍然渲染首頁', async () => {
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockResolvedValue(true);
            mockDocsGenerationService.generateAllDocs.mockResolvedValue(false);

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);

            expect(consoleSpy).toHaveBeenCalledWith('⚠️ 部分文檔生成失敗，但繼續顯示頁面');
            expect(mockRender).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('應該在檢查文檔狀態發生錯誤時使用備用數據渲染', async () => {
            const error = new Error('檢查錯誤');
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockRejectedValue(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);

            expect(consoleSpy).toHaveBeenCalledWith('❌ 處理文檔首頁請求時發生錯誤:', error);
            expect(mockRender).toHaveBeenCalledWith('homepage', expect.objectContaining({
                generationInfo: expect.objectContaining({
                    needsUpdate: false,
                    checkDuration: 0,
                    error: 'Failed to check or generate docs'
                })
            }));
            
            consoleSpy.mockRestore();
        });
    });

    describe('generateDocs', () => {
        it('應該成功手動生成文檔', async () => {
            mockDocsGenerationService.generateAllDocs.mockResolvedValue(true);

            await DocsController.generateDocs(mockRequest as Request, mockResponse as Response);

            expect(mockDocsGenerationService.generateAllDocs).toHaveBeenCalledTimes(1);
            expect(mockJson).toHaveBeenCalledWith({
                status: 'success',
                message: '所有文檔生成成功',
                timestamp: expect.any(String)
            });
        });

        it('應該在部分文檔生成失敗時返回錯誤狀態', async () => {
            mockDocsGenerationService.generateAllDocs.mockResolvedValue(false);

            await DocsController.generateDocs(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                status: 'error',
                message: '部分文檔生成失敗',
                timestamp: expect.any(String)
            });
        });

        it('應該在生成過程發生異常時返回錯誤響應', async () => {
            const error = new Error('生成錯誤');
            mockDocsGenerationService.generateAllDocs.mockRejectedValue(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await DocsController.generateDocs(mockRequest as Request, mockResponse as Response);

            expect(consoleSpy).toHaveBeenCalledWith('手動生成文檔時發生錯誤:', error);
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                status: 'error',
                message: '文檔生成過程中發生錯誤',
                error: '生成錯誤',
                timestamp: expect.any(String)
            });
            
            consoleSpy.mockRestore();
        });

        it('應該處理非 Error 實例的異常', async () => {
            mockDocsGenerationService.generateAllDocs.mockRejectedValue('字符串錯誤');

            await DocsController.generateDocs(mockRequest as Request, mockResponse as Response);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                error: '未知錯誤'
            }));
        });
    });

    describe('getGenerationStatus', () => {
        it('應該返回文檔生成狀態', () => {
            const mockStatus = new Map([
                ['service1', { isGenerating: true, lastGenerated: new Date(), lastChecked: new Date() }],
                ['service2', { isGenerating: false, lastGenerated: null, lastChecked: new Date() }]
            ]);

            mockDocsGenerationService.getGenerationStatus.mockReturnValue(mockStatus);

            DocsController.getGenerationStatus(mockRequest as Request, mockResponse as Response);

            expect(mockDocsGenerationService.getGenerationStatus).toHaveBeenCalledTimes(1);
            expect(mockJson).toHaveBeenCalledWith({
                services: [
                    { 
                        service: 'service1', 
                        isGenerating: true, 
                        lastGenerated: expect.any(Date), 
                        lastChecked: expect.any(Date) 
                    },
                    { 
                        service: 'service2', 
                        isGenerating: false, 
                        lastGenerated: null, 
                        lastChecked: expect.any(Date) 
                    }
                ],
                timestamp: expect.any(String)
            });
        });

        it('應該處理空狀態', () => {
            mockDocsGenerationService.getGenerationStatus.mockReturnValue(new Map());

            DocsController.getGenerationStatus(mockRequest as Request, mockResponse as Response);

            expect(mockJson).toHaveBeenCalledWith({
                services: [],
                timestamp: expect.any(String)
            });
        });
    });

    describe('redirectToHomepage', () => {
        it('應該重定向到文檔首頁', () => {
            DocsController.redirectToHomepage(mockRequest as Request, mockResponse as Response);

            expect(mockRedirect).toHaveBeenCalledWith('/docs');
        });
    });

    describe('邊界條件測試', () => {
        it('應該處理 availableServices 為空的情況', async () => {
            mockAvailableServices.mockReturnValue([] as any);
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockResolvedValue(false);

            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);

            expect(mockRender).toHaveBeenCalledWith('homepage', expect.objectContaining({
                services: []
            }));
        });

        it('應該處理 config.service 為 undefined 的情況', async () => {
            mockConfig.mockReturnValue({ service: undefined } as any);
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockResolvedValue(false);

            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);

            expect(mockRender).toHaveBeenCalledWith('homepage', expect.objectContaining({
                version: undefined
            }));
        });
    });

    describe('靜態方法測試', () => {
        it('所有方法都應該是靜態的', () => {
            expect(typeof DocsController.getHomepage).toBe('function');
            expect(typeof DocsController.generateDocs).toBe('function');
            expect(typeof DocsController.getGenerationStatus).toBe('function');
            expect(typeof DocsController.redirectToHomepage).toBe('function');
        });
    });

    describe('時間相關測試', () => {
        it('應該記錄正確的執行時間', async () => {
            mockDocsGenerationService.checkIfDocsNeedUpdate.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve(false), 10))
            );

            const startTime = Date.now();
            await DocsController.getHomepage(mockRequest as Request, mockResponse as Response);
            const endTime = Date.now();

            expect(mockRender).toHaveBeenCalledWith('homepage', expect.objectContaining({
                generationInfo: expect.objectContaining({
                    checkDuration: expect.any(Number)
                })
            }));

            const callArgs = mockRender.mock.calls[0][1];
            const actualDuration = callArgs.generationInfo.checkDuration;
            
            // 驗證時間記錄在合理範圍內
            expect(actualDuration).toBeGreaterThanOrEqual(0);
            expect(actualDuration).toBeLessThanOrEqual(endTime - startTime + 100); // 允許 100ms 誤差
        });

        it('應該生成正確的時間戳格式', async () => {
            mockDocsGenerationService.generateAllDocs.mockResolvedValue(true);

            await DocsController.generateDocs(mockRequest as Request, mockResponse as Response);

            const callArgs = mockJson.mock.calls[0][0];
            const timestamp = callArgs.timestamp;
            
            // 驗證 ISO 8601 時間戳格式
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });
});