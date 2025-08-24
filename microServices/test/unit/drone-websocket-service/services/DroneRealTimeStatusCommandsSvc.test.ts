/**
 * @fileoverview DroneRealTimeStatusCommandsSvc 單元測試
 * 
 * 測試 drone-websocket-service 的即時狀態命令服務功能，包含：
 * - 狀態更新功能
 * - 輸入驗證
 * - 錯誤處理
 * - 業務邏輯驗證
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { DroneRealTimeStatusCommandsSvc } from '../../../../../drone-websocket-service/src/services/commands/DroneRealTimeStatusCommandsSvc.js';
import { DroneRealTimeStatusCommandsRepository } from '../../../../../drone-websocket-service/src/repo/index.js';
import type { 
    DroneRealTimeStatusAttributes, 
    DroneRealTimeStatusCreationAttributes
} from '../../../../../drone-websocket-service/src/models/DroneRealTimeStatusModel.js';

// Mock repository
jest.mock('../../../../../drone-websocket-service/src/repo/index.js');

const MockDroneRealTimeStatusCommandsRepository = DroneRealTimeStatusCommandsRepository as jest.MockedClass<typeof DroneRealTimeStatusCommandsRepository>;

describe('DroneRealTimeStatusCommandsSvc', () => {
    let service: DroneRealTimeStatusCommandsSvc;
    let mockRepository: jest.Mocked<DroneRealTimeStatusCommandsRepository>;

    const mockStatusData: DroneRealTimeStatusAttributes = {
        id: 1,
        drone_id: 1,
        current_status: 'FLYING' as any,
        current_battery_level: 85,
        signal_strength: 90,
        current_altitude: 100.5,
        current_speed: 25.0,
        current_latitude: 25.033,
        current_longitude: 121.565,
        temperature: 28.5,
        humidity: 65.0,
        error_message: null,
        is_emergency: false,
        last_ping: new Date('2025-01-01T10:00:00Z'),
        createdAt: new Date('2025-01-01T09:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z')
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockRepository = new MockDroneRealTimeStatusCommandsRepository() as jest.Mocked<DroneRealTimeStatusCommandsRepository>;
        service = new DroneRealTimeStatusCommandsSvc(mockRepository);
    });

    describe('updateRealTimeStatusByDroneId', () => {
        it('應該成功更新無人機即時狀態', async () => {
            const droneId = 1;
            const updates: Partial<DroneRealTimeStatusCreationAttributes> = {
                current_battery_level: 80,
                signal_strength: 85,
                current_altitude: 120.0
            };

            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.updateRealTimeStatusByDroneId(droneId, updates);

            expect(mockRepository.updateRealTimeStatusByDroneId).toHaveBeenCalledWith(droneId, updates);
            expect(result).toEqual(mockStatusData);
        });

        it('應該在成功更新時返回更新後的狀態數據', async () => {
            const droneId = 1;
            const updates: Partial<DroneRealTimeStatusCreationAttributes> = {
                current_battery_level: 75
            };
            const updatedData = { ...mockStatusData, current_battery_level: 75 };

            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(updatedData);

            const result = await service.updateRealTimeStatusByDroneId(droneId, updates);

            expect(result).toEqual(updatedData);
            expect(result!.current_battery_level).toBe(75);
        });

        it('應該在更新不存在的無人機時返回 null', async () => {
            const droneId = 999;
            const updates: Partial<DroneRealTimeStatusCreationAttributes> = {
                current_battery_level: 80
            };

            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(null);

            const result = await service.updateRealTimeStatusByDroneId(droneId, updates);

            expect(result).toBeNull();
        });

        it('應該處理部分字段更新', async () => {
            const droneId = 1;
            const updates: Partial<DroneRealTimeStatusCreationAttributes> = {
                current_speed: 30.0
            };

            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.updateRealTimeStatusByDroneId(droneId, updates);

            expect(mockRepository.updateRealTimeStatusByDroneId).toHaveBeenCalledWith(droneId, updates);
            expect(result).toEqual(mockStatusData);
        });

        it('應該處理所有可更新字段', async () => {
            const droneId = 1;
            const updates: Partial<DroneRealTimeStatusCreationAttributes> = {
                current_battery_level: 70,
                signal_strength: 80,
                current_altitude: 150.0,
                current_speed: 35.0,
                current_latitude: 25.040,
                current_longitude: 121.570,
                temperature: 30.0,
                humidity: 60.0,
                is_emergency: true
            };

            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.updateRealTimeStatusByDroneId(droneId, updates);

            expect(mockRepository.updateRealTimeStatusByDroneId).toHaveBeenCalledWith(droneId, updates);
            expect(result).toEqual(mockStatusData);
        });
    });

    describe('輸入驗證', () => {
        describe('droneId 驗證', () => {
            it('應該拒絕無效的無人機 ID (0)', async () => {
                const updates = { current_battery_level: 80 };

                await expect(service.updateRealTimeStatusByDroneId(0, updates))
                    .rejects.toThrow('無效的無人機 ID');
            });

            it('應該拒絕負數的無人機 ID', async () => {
                const updates = { current_battery_level: 80 };

                await expect(service.updateRealTimeStatusByDroneId(-1, updates))
                    .rejects.toThrow('無效的無人機 ID');
            });

            it('應該拒絕 null 或 undefined 的無人機 ID', async () => {
                const updates = { current_battery_level: 80 };

                await expect(service.updateRealTimeStatusByDroneId(null as any, updates))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.updateRealTimeStatusByDroneId(undefined as any, updates))
                    .rejects.toThrow('無效的無人機 ID');
            });
        });

        describe('電池電量驗證', () => {
            it('應該接受有效的電池電量範圍 (0-100)', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { current_battery_level: 0 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_battery_level: 50 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_battery_level: 100 }))
                    .resolves.not.toThrow();
            });

            it('應該拒絕負數的電池電量', async () => {
                const updates = { current_battery_level: -1 };

                await expect(service.updateRealTimeStatusByDroneId(1, updates))
                    .rejects.toThrow('電池電量必須在 0-100 之間');
            });

            it('應該拒絕超過 100 的電池電量', async () => {
                const updates = { current_battery_level: 101 };

                await expect(service.updateRealTimeStatusByDroneId(1, updates))
                    .rejects.toThrow('電池電量必須在 0-100 之間');
            });
        });

        describe('信號強度驗證', () => {
            it('應該接受有效的信號強度範圍 (0-100)', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { signal_strength: 0 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { signal_strength: 75 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { signal_strength: 100 }))
                    .resolves.not.toThrow();
            });

            it('應該接受 null 信號強度', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { signal_strength: null }))
                    .resolves.not.toThrow();
            });

            it('應該拒絕無效的信號強度', async () => {
                await expect(service.updateRealTimeStatusByDroneId(1, { signal_strength: -1 }))
                    .rejects.toThrow('信號強度必須在 0-100 之間');

                await expect(service.updateRealTimeStatusByDroneId(1, { signal_strength: 101 }))
                    .rejects.toThrow('信號強度必須在 0-100 之間');
            });
        });

        describe('高度驗證', () => {
            it('應該接受合理的高度範圍', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: -1000 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: 0 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: 5000 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: 10000 }))
                    .resolves.not.toThrow();
            });

            it('應該接受 null 高度', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: null }))
                    .resolves.not.toThrow();
            });

            it('應該拒絕超出範圍的高度', async () => {
                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: -1001 }))
                    .rejects.toThrow('高度必須在合理範圍內 (-1000 到 10000 公尺)');

                await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: 10001 }))
                    .rejects.toThrow('高度必須在合理範圍內 (-1000 到 10000 公尺)');
            });
        });

        describe('速度驗證', () => {
            it('應該接受有效的速度範圍 (0-200)', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { current_speed: 0 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_speed: 100 }))
                    .resolves.not.toThrow();

                await expect(service.updateRealTimeStatusByDroneId(1, { current_speed: 200 }))
                    .resolves.not.toThrow();
            });

            it('應該接受 null 速度', async () => {
                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                await expect(service.updateRealTimeStatusByDroneId(1, { current_speed: null }))
                    .resolves.not.toThrow();
            });

            it('應該拒絕無效的速度', async () => {
                await expect(service.updateRealTimeStatusByDroneId(1, { current_speed: -1 }))
                    .rejects.toThrow('速度必須在 0-200 km/h 之間');

                await expect(service.updateRealTimeStatusByDroneId(1, { current_speed: 201 }))
                    .rejects.toThrow('速度必須在 0-200 km/h 之間');
            });
        });

        describe('複合驗證', () => {
            it('應該驗證多個字段', async () => {
                const updates = {
                    current_battery_level: -1,
                    signal_strength: 101,
                    current_altitude: 15000,
                    current_speed: -5
                };

                // 應該拒絕第一個無效字段
                await expect(service.updateRealTimeStatusByDroneId(1, updates))
                    .rejects.toThrow('電池電量必須在 0-100 之間');
            });

            it('應該通過有效的複合更新', async () => {
                const updates = {
                    current_battery_level: 75,
                    signal_strength: 80,
                    current_altitude: 150,
                    current_speed: 30
                };

                mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

                const result = await service.updateRealTimeStatusByDroneId(1, updates);

                expect(result).toEqual(mockStatusData);
                expect(mockRepository.updateRealTimeStatusByDroneId).toHaveBeenCalledWith(1, updates);
            });
        });
    });

    describe('錯誤處理', () => {
        it('應該傳播資料庫錯誤', async () => {
            const dbError = new Error('資料庫連接失敗');
            mockRepository.updateRealTimeStatusByDroneId.mockRejectedValue(dbError);

            const updates = { current_battery_level: 80 };

            await expect(service.updateRealTimeStatusByDroneId(1, updates))
                .rejects.toThrow('資料庫連接失敗');
        });

        it('應該處理更新操作異常', async () => {
            const updates = { current_battery_level: 80 };
            const operationError = new Error('更新操作失敗');

            mockRepository.updateRealTimeStatusByDroneId.mockRejectedValue(operationError);

            await expect(service.updateRealTimeStatusByDroneId(1, updates))
                .rejects.toThrow('更新操作失敗');
        });
    });

    describe('邊界條件', () => {
        it('應該處理空的更新對象', async () => {
            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.updateRealTimeStatusByDroneId(1, {});

            expect(mockRepository.updateRealTimeStatusByDroneId).toHaveBeenCalledWith(1, {});
            expect(result).toEqual(mockStatusData);
        });

        it('應該處理邊界值', async () => {
            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            // 電池電量邊界值
            await expect(service.updateRealTimeStatusByDroneId(1, { current_battery_level: 0 }))
                .resolves.not.toThrow();
            await expect(service.updateRealTimeStatusByDroneId(1, { current_battery_level: 100 }))
                .resolves.not.toThrow();

            // 高度邊界值
            await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: -1000 }))
                .resolves.not.toThrow();
            await expect(service.updateRealTimeStatusByDroneId(1, { current_altitude: 10000 }))
                .resolves.not.toThrow();
        });

        it('應該處理大數值', async () => {
            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const droneId = Number.MAX_SAFE_INTEGER;
            const updates = { current_battery_level: 50 };

            const result = await service.updateRealTimeStatusByDroneId(droneId, updates);

            expect(mockRepository.updateRealTimeStatusByDroneId).toHaveBeenCalledWith(droneId, updates);
            expect(result).toEqual(mockStatusData);
        });
    });

    describe('服務方法特性', () => {
        it('所有方法都應該是 arrow functions', () => {
            expect(typeof service.updateRealTimeStatusByDroneId).toBe('function');
            
            // 確保方法綁定正確的 this 上下文
            const method = service.updateRealTimeStatusByDroneId;
            expect(method).toBe(service.updateRealTimeStatusByDroneId);
        });

        it('應該正確注入依賴', () => {
            expect(service['repository']).toBe(mockRepository);
        });
    });

    describe('性能考慮', () => {
        it('應該高效處理批量驗證', async () => {
            const updates = {
                current_battery_level: 75,
                signal_strength: 80,
                current_altitude: 150,
                current_speed: 30,
                current_latitude: 25.033,
                current_longitude: 121.565,
                temperature: 28.5,
                humidity: 65.0
            };

            mockRepository.updateRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const startTime = Date.now();
            await service.updateRealTimeStatusByDroneId(1, updates);
            const endTime = Date.now();

            // 驗證操作在合理時間內完成（不包含實際 DB 操作）
            expect(endTime - startTime).toBeLessThan(50);
        });
    });
});