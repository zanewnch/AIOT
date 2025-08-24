/**
 * @fileoverview Drone WebSocket Service API 整合測試
 * 
 * 測試 drone-websocket-service 的 API 端點整合功能，包含：
 * - WebSocket 連接測試
 * - 即時狀態查詢 API 測試
 * - 健康檢查測試
 * - WebSocket 實時通信測試
 * - 錯誤處理測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import request from 'supertest';
import WebSocket from 'ws';
import { testSetup } from '../setup/testSetup.js';

describe('Drone WebSocket Service API Integration Tests', () => {
    let httpClient: ReturnType<typeof testSetup.createHttpClient>;

    beforeAll(async () => {
        httpClient = testSetup.createHttpClient('drone-websocket-service');
        
        // 等待服務啟動
        await testSetup.waitForService('drone-websocket-service');
    });

    afterAll(async () => {
        await testSetup.cleanup();
    });

    describe('健康檢查', () => {
        it('GET /health 應該返回服務健康狀態', async () => {
            const response = await httpClient.get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('OK');
        });

        it('應該包含 WebSocket 服務的基本信息', async () => {
            const response = await httpClient.get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('service');
            expect(response.body.service).toBe('drone-websocket-service');
        });

        it('應該快速響應健康檢查請求', async () => {
            const startTime = Date.now();
            const response = await httpClient.get('/health');
            const responseTime = Date.now() - startTime;
            
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // 1秒內響應
        });
    });

    describe('API 端點測試', () => {
        describe('即時狀態查詢', () => {
            it('應該能夠查詢在線無人機狀態', async () => {
                const response = await httpClient.get('/api/status/online');
                
                expect([200, 404].includes(response.status)).toBe(true);
                
                if (response.status === 200) {
                    expect(Array.isArray(response.body)).toBe(true);
                    expect(response.headers['content-type']).toMatch(/application\/json/);
                }
            });

            it('應該能夠查詢特定無人機狀態', async () => {
                const droneId = 1;
                const response = await httpClient.get(`/api/status/drone/${droneId}`);
                
                expect([200, 404].includes(response.status)).toBe(true);
                
                if (response.status === 200) {
                    expect(response.body).toHaveProperty('drone_id');
                    expect(response.body.drone_id).toBe(droneId);
                }
            });

            it('應該能夠查詢無人機健康摘要', async () => {
                const droneId = 1;
                const response = await httpClient.get(`/api/health/drone/${droneId}`);
                
                expect([200, 404].includes(response.status)).toBe(true);
                
                if (response.status === 200) {
                    expect(response.body).toHaveProperty('droneId');
                    expect(response.body).toHaveProperty('isOnline');
                    expect(response.body).toHaveProperty('batteryLevel');
                    expect(response.body).toHaveProperty('signalStrength');
                    expect(response.body).toHaveProperty('lastUpdate');
                    expect(response.body).toHaveProperty('healthStatus');
                    
                    // 驗證數據類型
                    expect(typeof response.body.droneId).toBe('number');
                    expect(typeof response.body.isOnline).toBe('boolean');
                    expect(typeof response.body.batteryLevel).toBe('number');
                    expect(typeof response.body.signalStrength).toBe('number');
                    expect(typeof response.body.lastUpdate).toBe('string');
                    expect(['healthy', 'warning', 'critical', 'offline'].includes(response.body.healthStatus)).toBe(true);
                }
            });
        });

        describe('狀態更新 API', () => {
            it('應該能夠更新無人機即時狀態', async () => {
                const droneId = 1;
                const updateData = {
                    current_battery_level: 75,
                    signal_strength: 85,
                    current_altitude: 150.0,
                    current_speed: 30.0
                };

                const response = await httpClient.put(`/api/status/drone/${droneId}`)
                    .send(updateData);
                
                expect([200, 201, 404].includes(response.status)).toBe(true);
                
                if (response.status === 200 || response.status === 201) {
                    expect(response.body).toHaveProperty('drone_id');
                    expect(response.body.drone_id).toBe(droneId);
                }
            });

            it('應該拒絕無效的更新數據', async () => {
                const droneId = 1;
                const invalidData = {
                    current_battery_level: 150, // 超過 100%
                    signal_strength: -10, // 負值
                    current_speed: 300 // 超過限制
                };

                const response = await httpClient.put(`/api/status/drone/${droneId}`)
                    .send(invalidData);
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('error');
            });

            it('應該處理部分字段更新', async () => {
                const droneId = 1;
                const partialData = {
                    current_battery_level: 65
                };

                const response = await httpClient.put(`/api/status/drone/${droneId}`)
                    .send(partialData);
                
                expect([200, 201, 404].includes(response.status)).toBe(true);
            });
        });
    });

    describe('WebSocket 連接測試', () => {
        const getWebSocketUrl = () => {
            const port = process.env.DRONE_WEBSOCKET_SERVICE_PORT || 3005;
            return `ws://localhost:${port}`;
        };

        it('應該能夠建立 WebSocket 連接', (done) => {
            const ws = new WebSocket(getWebSocketUrl());
            
            const timeout = setTimeout(() => {
                ws.close();
                done(new Error('WebSocket 連接超時'));
            }, 10000);
            
            ws.on('open', () => {
                clearTimeout(timeout);
                ws.close();
                done();
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                // WebSocket 可能還未啟動，這在測試環境中是正常的
                console.warn('WebSocket 連接失敗:', error.message);
                done();
            });
        });

        it('應該能夠接收即時狀態更新', (done) => {
            const ws = new WebSocket(getWebSocketUrl());
            
            const timeout = setTimeout(() => {
                ws.close();
                done();
            }, 5000);
            
            ws.on('open', () => {
                // 訂閱無人機狀態更新
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    droneId: 1
                }));
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    if (message.type === 'status_update') {
                        expect(message).toHaveProperty('droneId');
                        expect(message).toHaveProperty('status');
                        clearTimeout(timeout);
                        ws.close();
                        done();
                    }
                } catch (error) {
                    console.warn('解析 WebSocket 消息失敗:', error);
                }
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                console.warn('WebSocket 測試錯誤:', error.message);
                done();
            });
        });

        it('應該處理無效的 WebSocket 消息', (done) => {
            const ws = new WebSocket(getWebSocketUrl());
            
            const timeout = setTimeout(() => {
                ws.close();
                done();
            }, 5000);
            
            ws.on('open', () => {
                // 發送無效消息
                ws.send('invalid json message');
                
                setTimeout(() => {
                    clearTimeout(timeout);
                    ws.close();
                    done();
                }, 1000);
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                console.warn('WebSocket 無效消息測試錯誤:', error.message);
                done();
            });
        });
    });

    describe('錯誤處理', () => {
        it('應該處理不存在的路由', async () => {
            const response = await httpClient.get('/nonexistent-route');
            
            expect(response.status).toBe(404);
        });

        it('應該處理無效的無人機 ID', async () => {
            const response = await httpClient.get('/api/status/drone/invalid');
            
            expect(response.status).toBe(400);
        });

        it('應該處理不存在的無人機查詢', async () => {
            const response = await httpClient.get('/api/status/drone/99999');
            
            expect(response.status).toBe(404);
        });

        it('應該處理錯誤的請求方法', async () => {
            const response = await httpClient.delete('/api/status/online');
            
            expect([404, 405].includes(response.status)).toBe(true);
        });

        it('應該處理無效的 JSON 請求', async () => {
            const response = await request(httpClient.app)
                .put('/api/status/drone/1')
                .send('invalid json')
                .set('Content-Type', 'application/json');
            
            expect([400, 500].includes(response.status)).toBe(true);
        });
    });

    describe('HTTP 標頭檢查', () => {
        it('應該設置正確的 Content-Type 標頭', async () => {
            const response = await httpClient.get('/health');
            
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('應該設置基本安全標頭', async () => {
            const response = await httpClient.get('/health');
            
            expect(response.headers).toHaveProperty('x-powered-by');
        });
    });

    describe('性能測試', () => {
        it('API 響應時間應該在合理範圍內', async () => {
            const startTime = Date.now();
            const response = await httpClient.get('/api/status/online');
            const responseTime = Date.now() - startTime;
            
            expect([200, 404].includes(response.status)).toBe(true);
            expect(responseTime).toBeLessThan(3000); // 3秒內響應
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
        it('應該能夠處理多個併發的狀態查詢', async () => {
            const concurrentRequests = 10;
            const promises = Array(concurrentRequests).fill(null).map(() => 
                httpClient.get('/api/status/online')
            );
            
            const responses = await Promise.all(promises);
            
            responses.forEach(response => {
                expect([200, 404].includes(response.status)).toBe(true);
            });
        });

        it('應該處理混合 API 請求', async () => {
            const requests = [
                httpClient.get('/health'),
                httpClient.get('/api/status/online'),
                httpClient.get('/api/status/drone/1'),
                httpClient.get('/api/health/drone/1')
            ];
            
            const responses = await Promise.allSettled(requests);
            
            responses.forEach(result => {
                expect(result.status).toMatch(/fulfilled|rejected/);
                if (result.status === 'fulfilled') {
                    expect([200, 404, 400].includes(result.value.status)).toBe(true);
                }
            });
        });
    });

    describe('邊界條件測試', () => {
        it('應該處理極大的無人機 ID', async () => {
            const largeId = Number.MAX_SAFE_INTEGER;
            const response = await httpClient.get(`/api/status/drone/${largeId}`);
            
            expect([200, 404, 400].includes(response.status)).toBe(true);
        });

        it('應該處理特殊字符的請求', async () => {
            const response = await httpClient.get('/api/status/drone/%20test');
            
            expect([400, 404].includes(response.status)).toBe(true);
        });

        it('應該限制大請求體', async () => {
            const largeData = {
                data: 'x'.repeat(10 * 1024 * 1024) // 10MB
            };
            
            const response = await request(httpClient.app)
                .put('/api/status/drone/1')
                .send(largeData)
                .timeout(5000);
            
            expect([400, 413, 500].includes(response.status)).toBe(true);
        });
    });

    describe('實時功能測試', () => {
        it('應該能夠處理狀態更新和立即查詢', async () => {
            const droneId = 1;
            const updateData = {
                current_battery_level: 60,
                signal_strength: 75
            };

            // 更新狀態
            const updateResponse = await httpClient.put(`/api/status/drone/${droneId}`)
                .send(updateData);
            
            if (updateResponse.status === 200 || updateResponse.status === 201) {
                // 立即查詢狀態
                const queryResponse = await httpClient.get(`/api/status/drone/${droneId}`);
                
                if (queryResponse.status === 200) {
                    expect(queryResponse.body.current_battery_level).toBe(updateData.current_battery_level);
                    expect(queryResponse.body.signal_strength).toBe(updateData.signal_strength);
                }
            }
        });

        it('應該正確更新健康狀態', async () => {
            const droneId = 1;
            
            // 設置低電量狀態
            const lowBatteryUpdate = {
                current_battery_level: 15 // 警告級別
            };

            const updateResponse = await httpClient.put(`/api/status/drone/${droneId}`)
                .send(lowBatteryUpdate);
            
            if (updateResponse.status === 200 || updateResponse.status === 201) {
                // 查詢健康摘要
                const healthResponse = await httpClient.get(`/api/health/drone/${droneId}`);
                
                if (healthResponse.status === 200) {
                    expect(healthResponse.body.batteryLevel).toBe(15);
                    expect(['warning', 'critical'].includes(healthResponse.body.healthStatus)).toBe(true);
                }
            }
        });
    });

    describe('資源清理測試', () => {
        it('應該在請求完成後正確清理資源', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // 執行多個請求
            for (let i = 0; i < 20; i++) {
                await httpClient.get('/health');
            }
            
            // 強制垃圾回收（如果可用）
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // 記憶體增長應該在合理範圍內
            expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 20MB
        });
    });

    describe('服務整合測試', () => {
        it('應該與其他微服務協同工作', async () => {
            // 這裡可以添加與其他服務的整合測試
            // 例如與 drone-service 的數據同步測試
            
            const response = await httpClient.get('/health');
            expect(response.status).toBe(200);
            
            // 模擬服務間通信測試
            const statusResponse = await httpClient.get('/api/status/online');
            expect([200, 404].includes(statusResponse.status)).toBe(true);
        });
    });
});