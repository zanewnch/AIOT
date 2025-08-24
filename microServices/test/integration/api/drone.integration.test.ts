/**
 * @fileoverview 無人機 API 整合測試
 * 
 * 測試無人機相關的 API 端點，包含：
 * - 無人機指令管理測試
 * - 無人機狀態查詢測試
 * - 無人機位置追蹤測試
 * - 飛行指令執行測試
 * - 權限控制測試
 * - 實時數據更新測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { IntegrationTestSetup, TestHelpers } from '../setup/testSetup.js';
import { AxiosInstance } from 'axios';

describe('Drone API Integration Tests', () => {
    let testSetup: IntegrationTestSetup;
    let adminClient: AxiosInstance;
    let operatorClient: AxiosInstance;
    let viewerClient: AxiosInstance;

    beforeAll(async () => {
        testSetup = new IntegrationTestSetup();
        await testSetup.setup();
        
        // 設置不同權限的客戶端
        adminClient = await testSetup.getAuthenticatedClient('drone', 'admin_test');
        operatorClient = await testSetup.getAuthenticatedClient('drone', 'operator_test');
        viewerClient = await testSetup.getAuthenticatedClient('drone', 'viewer_test');
    }, 30000);

    afterAll(async () => {
        await testSetup.teardown();
    }, 10000);

    describe('無人機基本資訊 API', () => {
        it('應該能獲取所有無人機清單', async () => {
            const response = await viewerClient.get('/api/drones');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
            
            const drone = response.data.data[0];
            expect(drone.id).toBeDefined();
            expect(drone.name).toBeDefined();
            expect(drone.model).toBeDefined();
            expect(drone.status).toBeDefined();
        });

        it('應該能根據 ID 獲取特定無人機資訊', async () => {
            const dronesResponse = await viewerClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const response = await viewerClient.get(`/api/drones/${droneId}`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.id).toBe(droneId);
            expect(response.data.data.name).toBeDefined();
            expect(response.data.data.model).toBeDefined();
            expect(response.data.data.status).toBeDefined();
        });

        it('應該在查詢不存在的無人機時返回 404', async () => {
            try {
                await viewerClient.get('/api/drones/999999');
                fail('Expected request to fail with 404');
            } catch (error: any) {
                expect(error.response.status).toBe(404);
                expect(error.response.data.message).toContain('找不到');
            }
        });

        it('應該能按狀態篩選無人機', async () => {
            const response = await viewerClient.get('/api/drones?status=idle');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            
            // 檢查所有返回的無人機都是 idle 狀態
            response.data.data.forEach((drone: any) => {
                expect(drone.status).toBe('idle');
            });
        });
    });

    describe('無人機指令 API', () => {
        let testDroneId: number;

        beforeEach(async () => {
            const dronesResponse = await adminClient.get('/api/drones');
            testDroneId = dronesResponse.data.data.find((drone: any) => drone.status === 'idle')?.id;
            
            if (!testDroneId) {
                throw new Error('No idle drone available for testing');
            }
        });

        it('操作員應該能發送起飛指令', async () => {
            const commandData = {
                droneId: testDroneId,
                altitude: 10,
                parameters: {
                    speed: 2
                }
            };

            const response = await operatorClient.post('/api/drone-commands/send/takeoff', commandData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.command_type).toBe('TAKEOFF');
            expect(response.data.data.drone_id).toBe(testDroneId);
            expect(response.data.data.status).toBe('PENDING');
        });

        it('操作員應該能發送降落指令', async () => {
            const commandData = {
                droneId: testDroneId,
                parameters: {
                    speed: 1
                }
            };

            const response = await operatorClient.post('/api/drone-commands/send/land', commandData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.command_type).toBe('LAND');
            expect(response.data.data.drone_id).toBe(testDroneId);
        });

        it('操作員應該能發送移動指令', async () => {
            const commandData = {
                droneId: testDroneId,
                latitude: 25.0334,
                longitude: 121.5654,
                altitude: 50,
                parameters: {
                    speed: 3
                }
            };

            const response = await operatorClient.post('/api/drone-commands/send/flyTo', commandData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.command_type).toBe('MOVE');
            expect(response.data.data.drone_id).toBe(testDroneId);
        });

        it('應該能發送緊急停止指令', async () => {
            const commandData = {
                droneId: testDroneId
            };

            const response = await operatorClient.post('/api/drone-commands/send/emergency', commandData);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.command_type).toBe('EMERGENCY');
            expect(response.data.data.drone_id).toBe(testDroneId);
            expect(response.data.data.priority).toBe('HIGH');
        });

        it('應該驗證指令參數', async () => {
            const invalidCommandData = {
                droneId: 'invalid', // 應該是數字
                altitude: 10
            };

            try {
                await operatorClient.post('/api/drone-commands/send/takeoff', invalidCommandData);
                fail('Expected validation error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('無人機 ID');
            }
        });

        it('應該驗證移動指令的座標參數', async () => {
            const invalidCommandData = {
                droneId: testDroneId,
                latitude: 'invalid', // 應該是數字
                longitude: 121.5654,
                altitude: 50
            };

            try {
                await operatorClient.post('/api/drone-commands/send/flyTo', invalidCommandData);
                fail('Expected validation error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('緯度');
            }
        });

        it('觀察員應該無法發送控制指令', async () => {
            const commandData = {
                droneId: testDroneId,
                altitude: 10
            };

            try {
                await viewerClient.post('/api/drone-commands/send/takeoff', commandData);
                fail('Expected permission denied');
            } catch (error: any) {
                expect(error.response.status).toBe(403);
                expect(error.response.data.message).toContain('權限');
            }
        });
    });

    describe('無人機指令管理 API', () => {
        let testCommandId: number;

        beforeEach(async () => {
            // 創建一個測試指令
            const dronesResponse = await adminClient.get('/api/drones');
            const testDroneId = dronesResponse.data.data[0].id;

            const commandResponse = await adminClient.post('/api/drone-commands/send/hover', {
                droneId: testDroneId,
                duration: 5
            });
            
            testCommandId = commandResponse.data.data.id;
        });

        it('應該能獲取指令列表', async () => {
            const response = await viewerClient.get('/api/drone-commands');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
            
            const command = response.data.data[0];
            expect(command.id).toBeDefined();
            expect(command.drone_id).toBeDefined();
            expect(command.command_type).toBeDefined();
            expect(command.status).toBeDefined();
            expect(command.issued_by).toBeDefined();
            expect(command.created_at).toBeDefined();
        });

        it('應該能根據無人機 ID 篩選指令', async () => {
            const dronesResponse = await viewerClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const response = await viewerClient.get(`/api/drone-commands?droneId=${droneId}`);
            
            TestHelpers.validateApiResponse(response, 200);
            response.data.data.forEach((command: any) => {
                expect(command.drone_id).toBe(droneId);
            });
        });

        it('應該能根據狀態篩選指令', async () => {
            const response = await viewerClient.get('/api/drone-commands?status=PENDING');
            
            TestHelpers.validateApiResponse(response, 200);
            response.data.data.forEach((command: any) => {
                expect(command.status).toBe('PENDING');
            });
        });

        it('應該能執行待處理的指令', async () => {
            const response = await operatorClient.put(`/api/drone-commands/${testCommandId}/execute`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.status).toBe('EXECUTING');
            expect(response.data.data.executed_at).toBeDefined();
        });

        it('應該能完成執行中的指令', async () => {
            // 先執行指令
            await operatorClient.put(`/api/drone-commands/${testCommandId}/execute`);
            
            // 然後完成指令
            const response = await operatorClient.put(`/api/drone-commands/${testCommandId}/complete`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.status).toBe('COMPLETED');
            expect(response.data.data.completed_at).toBeDefined();
        });

        it('應該能標記指令失敗', async () => {
            const reason = '通訊失敗';
            const response = await operatorClient.put(`/api/drone-commands/${testCommandId}/fail`, {
                reason
            });
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.status).toBe('FAILED');
            expect(response.data.data.error_message).toBe(reason);
            expect(response.data.data.failed_at).toBeDefined();
        });

        it('應該能取消待處理的指令', async () => {
            const reason = '用戶取消';
            const response = await operatorClient.put(`/api/drone-commands/${testCommandId}/cancel`, {
                reason
            });
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.status).toBe('CANCELLED');
            expect(response.data.data.cancellation_reason).toBe(reason);
            expect(response.data.data.cancelled_at).toBeDefined();
        });

        it('應該能重試失敗的指令', async () => {
            // 先標記指令失敗
            await operatorClient.put(`/api/drone-commands/${testCommandId}/fail`, {
                reason: '測試失敗'
            });
            
            // 重試指令
            const response = await operatorClient.post(`/api/drone-commands/${testCommandId}/retry`, {
                issuedBy: 1
            });
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.status).toBe('PENDING');
            expect(response.data.data.original_command_id).toBe(testCommandId);
        });
    });

    describe('無人機狀態 API', () => {
        it('應該能獲取無人機實時狀態', async () => {
            const dronesResponse = await viewerClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const response = await viewerClient.get(`/api/drone-status/${droneId}`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.drone_id).toBe(droneId);
            expect(response.data.data.status).toBeDefined();
            expect(response.data.data.battery_level).toBeDefined();
            expect(response.data.data.signal_strength).toBeDefined();
            expect(response.data.data.updated_at).toBeDefined();
        });

        it('應該能獲取無人機歷史狀態', async () => {
            const dronesResponse = await viewerClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const response = await viewerClient.get(`/api/drone-status/${droneId}/history`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            
            if (response.data.data.length > 0) {
                const statusRecord = response.data.data[0];
                expect(statusRecord.drone_id).toBe(droneId);
                expect(statusRecord.status).toBeDefined();
                expect(statusRecord.recorded_at).toBeDefined();
            }
        });

        it('管理員應該能更新無人機狀態', async () => {
            const dronesResponse = await adminClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const updateData = {
                status: 'maintenance',
                battery_level: 85,
                signal_strength: 95,
                temperature: 25.5,
                altitude: 0
            };
            
            const response = await adminClient.post(`/api/drone-status/${droneId}`, updateData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.drone_id).toBe(droneId);
            expect(response.data.data.status).toBe(updateData.status);
            expect(response.data.data.battery_level).toBe(updateData.battery_level);
        });
    });

    describe('無人機位置 API', () => {
        it('應該能獲取無人機當前位置', async () => {
            const dronesResponse = await viewerClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const response = await viewerClient.get(`/api/drone-positions/${droneId}/current`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.drone_id).toBe(droneId);
            expect(response.data.data.latitude).toBeDefined();
            expect(response.data.data.longitude).toBeDefined();
            expect(response.data.data.altitude).toBeDefined();
            expect(response.data.data.recorded_at).toBeDefined();
        });

        it('應該能獲取無人機軌跡歷史', async () => {
            const dronesResponse = await viewerClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const response = await viewerClient.get(`/api/drone-positions/${droneId}/history`);
            
            TestHelpers.validateApiResponse(response, 200);
            expect(Array.isArray(response.data.data)).toBe(true);
            
            if (response.data.data.length > 0) {
                const position = response.data.data[0];
                expect(position.drone_id).toBe(droneId);
                expect(position.latitude).toBeDefined();
                expect(position.longitude).toBeDefined();
                expect(position.altitude).toBeDefined();
                expect(position.recorded_at).toBeDefined();
            }
        });

        it('應該能記錄新的位置資料', async () => {
            const dronesResponse = await adminClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const positionData = {
                latitude: 25.0334 + Math.random() * 0.001, // 稍微改變位置以避免重複
                longitude: 121.5654 + Math.random() * 0.001,
                altitude: 100 + Math.random() * 10,
                speed: 5.5,
                heading: 90
            };
            
            const response = await adminClient.post(`/api/drone-positions/${droneId}`, positionData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.drone_id).toBe(droneId);
            expect(response.data.data.latitude).toBeCloseTo(positionData.latitude, 5);
            expect(response.data.data.longitude).toBeCloseTo(positionData.longitude, 5);
            expect(response.data.data.altitude).toBeCloseTo(positionData.altitude, 1);
        });

        it('應該驗證位置資料的有效性', async () => {
            const dronesResponse = await adminClient.get('/api/drones');
            const droneId = dronesResponse.data.data[0].id;
            
            const invalidPositionData = {
                latitude: 999, // 超出有效範圍
                longitude: 'invalid', // 無效格式
                altitude: -1000 // 無效高度
            };
            
            try {
                await adminClient.post(`/api/drone-positions/${droneId}`, invalidPositionData);
                fail('Expected validation error');
            } catch (error: any) {
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toContain('座標');
            }
        });
    });

    describe('批量操作 API', () => {
        it('應該能批量創建指令', async () => {
            const dronesResponse = await adminClient.get('/api/drones');
            const droneIds = dronesResponse.data.data.slice(0, 2).map((drone: any) => drone.id);
            
            const batchCommandData = droneIds.map((droneId: number) => ({
                drone_id: droneId,
                command_type: 'TAKEOFF',
                issued_by: 1,
                parameters: JSON.stringify({ altitude: 10 })
            }));
            
            const response = await adminClient.post('/api/drone-commands/data/batch', batchCommandData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.data.length).toBe(batchCommandData.length);
            
            response.data.data.forEach((command: any, index: number) => {
                expect(command.drone_id).toBe(droneIds[index]);
                expect(command.command_type).toBe('TAKEOFF');
            });
        });

        it('應該能處理批量操作中的部分失敗', async () => {
            const batchCommandData = [
                {
                    drone_id: 1,
                    command_type: 'TAKEOFF',
                    issued_by: 1
                },
                {
                    drone_id: 999999, // 不存在的無人機
                    command_type: 'TAKEOFF',
                    issued_by: 1
                }
            ];
            
            const response = await adminClient.post('/api/drone-commands/data/batch', batchCommandData);
            
            TestHelpers.validateApiResponse(response, 201);
            expect(response.data.successCount).toBeGreaterThan(0);
            expect(response.data.failedCount).toBeGreaterThan(0);
            expect(Array.isArray(response.data.successful)).toBe(true);
            expect(Array.isArray(response.data.failed)).toBe(true);
        });
    });

    describe('無人機統計 API', () => {
        it('應該能獲取無人機指令統計', async () => {
            const response = await viewerClient.get('/api/drone-commands/statistics');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.totalCommands).toBeDefined();
            expect(response.data.data.pendingCommands).toBeDefined();
            expect(response.data.data.executingCommands).toBeDefined();
            expect(response.data.data.completedCommands).toBeDefined();
            expect(response.data.data.failedCommands).toBeDefined();
            expect(response.data.data.commandsByType).toBeDefined();
        });

        it('應該能獲取特定時間範圍的統計', async () => {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 小時前
            
            const response = await viewerClient.get('/api/drone-commands/statistics', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            });
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.totalCommands).toBeGreaterThanOrEqual(0);
            expect(response.data.data.timeRange).toBeDefined();
            expect(response.data.data.timeRange.startDate).toBe(startDate.toISOString());
            expect(response.data.data.timeRange.endDate).toBe(endDate.toISOString());
        });

        it('應該能獲取無人機狀態分佈統計', async () => {
            const response = await viewerClient.get('/api/drones/statistics/status-distribution');
            
            TestHelpers.validateApiResponse(response, 200);
            expect(response.data.data.idle).toBeDefined();
            expect(response.data.data.flying).toBeDefined();
            expect(response.data.data.maintenance).toBeDefined();
            expect(response.data.data.offline).toBeDefined();
            expect(response.data.data.total).toBeDefined();
        });
    });
});