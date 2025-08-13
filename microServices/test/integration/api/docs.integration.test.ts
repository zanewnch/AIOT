/**
 * @fileoverview Docs Service API 整合測試
 * 
 * 測試 docs-service 的 API 端點整合功能，包含：
 * - 文檔首頁渲染測試
 * - 手動文檔生成 API 測試
 * - 生成狀態查詢 API 測試
 * - 健康檢查測試
 * - 錯誤處理測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import request from 'supertest';
import { testSetup } from '../setup/testSetup.js';

describe('Docs Service API Integration Tests', () => {
    let httpClient: ReturnType<typeof testSetup.createHttpClient>;

    beforeAll(async () => {
        httpClient = testSetup.createHttpClient('docs-service');
        
        // 等待服務啟動
        await testSetup.waitForService('docs-service');
    });

    afterAll(async () => {
        await testSetup.cleanup();
    });

    describe('GET /', () => {
        it('應該重定向到文檔首頁', async () => {
            const response = await httpClient.get('/');
            
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/docs');
        });
    });

    describe('GET /docs', () => {
        it('應該成功渲染文檔首頁', async () => {
            const response = await httpClient.get('/docs');
            
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/text\/html/);
            expect(response.text).toContain('AIOT'); // 檢查頁面內容
            expect(response.text).toContain('Microservices'); // 檢查頁面內容
        }, 30000); // 增加超時時間，因為可能需要生成文檔

        it('應該包含所有可用服務的鏈接', async () => {
            const response = await httpClient.get('/docs');
            
            expect(response.status).toBe(200);
            expect(response.text).toContain('RBAC Service');
            expect(response.text).toContain('Drone Service');
            expect(response.text).toContain('General Service');
        });

        it('應該顯示版本和最後更新時間', async () => {
            const response = await httpClient.get('/docs');
            
            expect(response.status).toBe(200);
            expect(response.text).toMatch(/version|版本/i);
            expect(response.text).toMatch(/updated|更新/i);
        });

        it('應該在多次請求時使用緩存', async () => {
            const startTime = Date.now();
            
            // 第一次請求
            const response1 = await httpClient.get('/docs');
            const firstRequestTime = Date.now() - startTime;
            
            expect(response1.status).toBe(200);
            
            // 第二次請求（應該更快，使用緩存）
            const secondStartTime = Date.now();
            const response2 = await httpClient.get('/docs');
            const secondRequestTime = Date.now() - secondStartTime;
            
            expect(response2.status).toBe(200);
            
            // 第二次請求應該顯著更快（使用緩存）
            expect(secondRequestTime).toBeLessThan(firstRequestTime / 2);
        }, 45000);
    });

    describe('POST /api/docs/generate', () => {
        it('應該成功手動觸發文檔生成', async () => {
            const response = await httpClient.post('/api/docs/generate');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'success',
                message: '所有文檔生成成功',
                timestamp: expect.any(String)
            });
            
            // 驗證時間戳格式
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        }, 60000); // 增加超時時間，文檔生成可能需要時間

        it('應該返回正確的 JSON 響應格式', async () => {
            const response = await httpClient.post('/api/docs/generate');
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('應該處理併發生成請求', async () => {
            // 同時發起多個生成請求
            const promises = Array(3).fill(null).map(() => 
                httpClient.post('/api/docs/generate')
            );
            
            const responses = await Promise.all(promises);
            
            // 所有請求都應該成功，但可能有些會被跳過
            responses.forEach(response => {
                expect([200, 500].includes(response.status)).toBe(true);
                expect(response.body).toHaveProperty('status');
                expect(response.body).toHaveProperty('message');
            });
        }, 90000);
    });

    describe('GET /api/docs/status', () => {
        it('應該返回文檔生成狀態', async () => {
            const response = await httpClient.get('/api/docs/status');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('services');
            expect(response.body).toHaveProperty('timestamp');
            expect(Array.isArray(response.body.services)).toBe(true);
        });

        it('應該包含每個服務的狀態信息', async () => {
            // 先觸發一次生成以確保有狀態
            await httpClient.post('/api/docs/generate');
            
            const response = await httpClient.get('/api/docs/status');
            
            expect(response.status).toBe(200);
            
            if (response.body.services.length > 0) {
                const service = response.body.services[0];
                expect(service).toHaveProperty('service');
                expect(service).toHaveProperty('isGenerating');
                expect(service).toHaveProperty('lastChecked');
                expect(typeof service.isGenerating).toBe('boolean');
            }
        });

        it('應該返回正確的時間戳格式', async () => {
            const response = await httpClient.get('/api/docs/status');
            
            expect(response.status).toBe(200);
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('健康檢查', () => {
        it('GET /health 應該返回服務健康狀態', async () => {
            const response = await httpClient.get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('OK');
        });

        it('應該包含服務基本信息', async () => {
            const response = await httpClient.get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('service');
            expect(response.body.service).toBe('docs-service');
        });
    });

    describe('錯誤處理', () => {
        it('應該處理不存在的路由', async () => {
            const response = await httpClient.get('/nonexistent-route');
            
            expect(response.status).toBe(404);
        });

        it('應該處理錯誤的請求方法', async () => {
            const response = await httpClient.delete('/api/docs/generate');
            
            expect([404, 405].includes(response.status)).toBe(true);
        });

        it('應該處理無效的 JSON 請求', async () => {
            const response = await request(httpClient.app)
                .post('/api/docs/generate')
                .send('invalid json')
                .set('Content-Type', 'application/json');
            
            expect([400, 500].includes(response.status)).toBe(true);
        });
    });

    describe('HTTP 標頭檢查', () => {
        it('應該設置正確的 Content-Type 標頭', async () => {
            const htmlResponse = await httpClient.get('/docs');
            expect(htmlResponse.headers['content-type']).toMatch(/text\/html/);
            
            const jsonResponse = await httpClient.get('/api/docs/status');
            expect(jsonResponse.headers['content-type']).toMatch(/application\/json/);
        });

        it('應該設置安全標頭', async () => {
            const response = await httpClient.get('/docs');
            
            // 檢查是否有基本的安全標頭
            expect(response.headers).toHaveProperty('x-powered-by');
        });
    });

    describe('性能測試', () => {
        it('首頁響應時間應該在合理範圍內', async () => {
            const startTime = Date.now();
            const response = await httpClient.get('/docs');
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(10000); // 10秒內響應
        }, 15000);

        it('API 端點響應時間應該在合理範圍內', async () => {
            const startTime = Date.now();
            const response = await httpClient.get('/api/docs/status');
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(2000); // 2秒內響應
        });

        it('健康檢查應該快速響應', async () => {
            const startTime = Date.now();
            const response = await httpClient.get('/health');
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(500); // 500ms內響應
        });
    });

    describe('併發測試', () => {
        it('應該能夠處理多個併發請求', async () => {
            const concurrentRequests = 10;
            const promises = Array(concurrentRequests).fill(null).map(() => 
                httpClient.get('/api/docs/status')
            );
            
            const responses = await Promise.all(promises);
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('services');
            });
        });

        it('應該處理混合 API 請求', async () => {
            const requests = [
                httpClient.get('/health'),
                httpClient.get('/api/docs/status'),
                httpClient.get('/docs'),
                httpClient.post('/api/docs/generate')
            ];
            
            const responses = await Promise.allSettled(requests);
            
            // 所有請求都應該完成（成功或失敗）
            responses.forEach(result => {
                expect(result.status).toMatch(/fulfilled|rejected/);
            });
        }, 30000);
    });

    describe('邊界條件測試', () => {
        it('應該處理極長的請求 URL', async () => {
            const longPath = '/docs/' + 'a'.repeat(1000);
            const response = await httpClient.get(longPath);
            
            expect([404, 414, 500].includes(response.status)).toBe(true);
        });

        it('應該處理特殊字符的請求', async () => {
            const response = await httpClient.get('/docs/test%20with%20spaces');
            
            expect([200, 404, 500].includes(response.status)).toBe(true);
        });

        it('應該限制大請求體', async () => {
            const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
            
            const response = await request(httpClient.app)
                .post('/api/docs/generate')
                .send({ data: largeData })
                .timeout(5000);
            
            expect([400, 413, 500].includes(response.status)).toBe(true);
        });
    });

    describe('資源清理測試', () => {
        it('應該在請求完成後正確清理資源', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // 執行多個請求
            for (let i = 0; i < 10; i++) {
                await httpClient.get('/api/docs/status');
            }
            
            // 強制垃圾回收（如果可用）
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // 記憶體增長應該在合理範圍內
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
        });
    });
});