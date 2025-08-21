/**
 * @fileoverview DroneRealTimeStatusQueriesSvc 單元測試
 * 
 * 測試 drone-websocket-service 的即時狀態查詢服務功能，包含：
 * - 狀態查詢功能
 * - 在線狀態監控
 * - 健康狀態評估
 * - 輸入驗證和錯誤處理
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { DroneRealTimeStatusQueriesSvc } from '../../../../../drone-websocket-service/src/services/queries/DroneRealTimeStatusQueriesSvc.js';
import { DroneRealTimeStatusQueriesRepo } from '../../../../../drone-websocket-service/src/repo/index.js';
import { DroneRealTimeStatus } from '../../../../../drone-websocket-service/src/models/DroneRealTimeStatusModel.js';
import type { DroneRealTimeStatusAttributes } from '../../../../../drone-websocket-service/src/models/DroneRealTimeStatusModel.js';

// Mock repository
jest.mock('../../../../../drone-websocket-service/src/repo/index.js');

const MockDroneRealTimeStatusQueriesRepo = DroneRealTimeStatusQueriesRepo as jest.MockedClass<typeof DroneRealTimeStatusQueriesRepo>;

describe('DroneRealTimeStatusQueriesSvc', () => {
    let service: DroneRealTimeStatusQueriesSvc;
    let mockRepository: jest.Mocked<DroneRealTimeStatusQueriesRepo>;

    const createMockStatusData = (overrides?: Partial<DroneRealTimeStatusAttributes>): DroneRealTimeStatusAttributes => ({
        id: 1,
        drone_id: 1,
        current_status: DroneRealTimeStatus.FLYING,
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
        updatedAt: new Date('2025-01-01T10:00:00Z'),
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockRepository = new MockDroneRealTimeStatusQueriesRepo() as jest.Mocked<DroneRealTimeStatusQueriesRepo>;
        service = new DroneRealTimeStatusQueriesSvc(mockRepository);
    });

    describe('getRealTimeStatusByDroneId', () => {
        it('應該成功獲取無人機即時狀態', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData();

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getRealTimeStatusByDroneId(droneId);

            expect(mockRepository.getRealTimeStatusByDroneId).toHaveBeenCalledWith(droneId);
            expect(result).toEqual(mockStatusData);
        });

        it('應該在無人機不存在時返回 null', async () => {
            const droneId = 999;

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(null);

            const result = await service.getRealTimeStatusByDroneId(droneId);

            expect(result).toBeNull();
        });

        it('應該正確處理不同狀態的無人機', async () => {
            const statusTypes = [
                DroneRealTimeStatus.IDLE,
                DroneRealTimeStatus.FLYING,
                DroneRealTimeStatus.LANDING,
                DroneRealTimeStatus.OFFLINE,
                DroneRealTimeStatus.ERROR
            ];

            for (const status of statusTypes) {
                const mockData = createMockStatusData({ current_status: status, drone_id: statusTypes.indexOf(status) + 1 });
                mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockData);

                const result = await service.getRealTimeStatusByDroneId(statusTypes.indexOf(status) + 1);

                expect(result?.current_status).toBe(status);
            }
        });

        describe('輸入驗證', () => {
            it('應該拒絕無效的無人機 ID', async () => {
                await expect(service.getRealTimeStatusByDroneId(0))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.getRealTimeStatusByDroneId(-1))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.getRealTimeStatusByDroneId(null as any))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.getRealTimeStatusByDroneId(undefined as any))
                    .rejects.toThrow('無效的無人機 ID');
            });

            it('應該接受正有效的無人機 ID', async () => {
                mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(createMockStatusData());

                await expect(service.getRealTimeStatusByDroneId(1))
                    .resolves.not.toThrow();

                await expect(service.getRealTimeStatusByDroneId(999999))
                    .resolves.not.toThrow();
            });
        });
    });

    describe('getOnlineDroneStatuses', () => {
        it('應該獲取所有在線無人機狀態', async () => {
            const mockOnlineDrones = [
                createMockStatusData({ drone_id: 1, current_status: DroneRealTimeStatus.FLYING }),
                createMockStatusData({ drone_id: 2, current_status: DroneRealTimeStatus.IDLE }),
                createMockStatusData({ drone_id: 3, current_status: DroneRealTimeStatus.LANDING })
            ];

            mockRepository.getOnlineDroneStatuses.mockResolvedValue(mockOnlineDrones);

            const result = await service.getOnlineDroneStatuses();

            expect(mockRepository.getOnlineDroneStatuses).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockOnlineDrones);
            expect(result).toHaveLength(3);
        });

        it('應該在沒有在線無人機時返回空陣列', async () => {
            mockRepository.getOnlineDroneStatuses.mockResolvedValue([]);

            const result = await service.getOnlineDroneStatuses();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('應該正確過濾在線狀態', async () => {
            const mockAllDrones = [
                createMockStatusData({ drone_id: 1, current_status: DroneRealTimeStatus.FLYING }),
                createMockStatusData({ drone_id: 2, current_status: DroneRealTimeStatus.IDLE }),
                createMockStatusData({ drone_id: 3, current_status: DroneRealTimeStatus.OFFLINE }),
                createMockStatusData({ drone_id: 4, current_status: DroneRealTimeStatus.ERROR })
            ];

            // 模擬 repository 已經過濾出在線狀態
            const onlineDrones = mockAllDrones.filter(drone => 
                drone.current_status !== DroneRealTimeStatus.OFFLINE && 
                drone.current_status !== DroneRealTimeStatus.ERROR
            );

            mockRepository.getOnlineDroneStatuses.mockResolvedValue(onlineDrones);

            const result = await service.getOnlineDroneStatuses();

            expect(result).toHaveLength(2);
            expect(result.every(drone => 
                drone.current_status !== DroneRealTimeStatus.OFFLINE && 
                drone.current_status !== DroneRealTimeStatus.ERROR
            )).toBe(true);
        });
    });

    describe('getDroneHealthSummary', () => {
        it('應該為健康無人機返回正確的健康摘要', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 85,
                signal_strength: 90,
                updatedAt: new Date('2025-01-01T10:00:00Z')
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result).toEqual({
                droneId: 1,
                isOnline: true,
                batteryLevel: 85,
                signalStrength: 90,
                lastUpdate: '2025-01-01T10:00:00.000Z',
                healthStatus: 'healthy'
            });
        });

        it('應該為低電量無人機返回警告狀態', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 15, // 低電量但未達臨界值
                signal_strength: 80
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result!.healthStatus).toBe('warning');
            expect(result!.batteryLevel).toBe(15);
        });

        it('應該為極低電量無人機返回臨界狀態', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 5, // 極低電量
                signal_strength: 80
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result!.healthStatus).toBe('critical');
            expect(result!.batteryLevel).toBe(5);
        });

        it('應該為低信號無人機返回警告狀態', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 80,
                signal_strength: 30 // 低信號
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result!.healthStatus).toBe('warning');
            expect(result!.signalStrength).toBe(30);
        });

        it('應該為離線無人機返回離線狀態', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.OFFLINE,
                current_battery_level: 80,
                signal_strength: 90
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result!.healthStatus).toBe('offline');
            expect(result!.isOnline).toBe(false);
        });

        it('應該為錯誤狀態無人機返回離線狀態', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.ERROR,
                current_battery_level: 80,
                signal_strength: 90
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result!.healthStatus).toBe('offline');
            expect(result!.isOnline).toBe(false);
        });

        it('應該處理 null 信號強度', async () => {
            const droneId = 1;
            const mockStatusData = createMockStatusData({
                drone_id: droneId,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 80,
                signal_strength: null // null 信號強度
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result!.signalStrength).toBe(0);
            expect(result!.healthStatus).toBe('healthy'); // 不應該因為 null 信號影響健康狀態
        });

        it('應該為不存在的無人機返回 null', async () => {
            const droneId = 999;

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(null);

            const result = await service.getDroneHealthSummary(droneId);

            expect(result).toBeNull();
        });

        it('應該正確處理邊界電量值', async () => {
            // 測試 10% 電量（臨界值）
            let mockStatusData = createMockStatusData({
                drone_id: 1,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 10,
                signal_strength: 80
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            let result = await service.getDroneHealthSummary(1);
            expect(result!.healthStatus).toBe('critical');

            // 測試 20% 電量（警告值）
            mockStatusData = createMockStatusData({
                drone_id: 1,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 20,
                signal_strength: 80
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            result = await service.getDroneHealthSummary(1);
            expect(result!.healthStatus).toBe('warning');

            // 測試 21% 電量（正常）
            mockStatusData = createMockStatusData({
                drone_id: 1,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 21,
                signal_strength: 80
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            result = await service.getDroneHealthSummary(1);
            expect(result!.healthStatus).toBe('healthy');
        });

        it('應該正確處理複合條件', async () => {
            // 低電量 + 低信號 = 警告（電量優先級更高）
            const mockStatusData = createMockStatusData({
                drone_id: 1,
                current_status: DroneRealTimeStatus.FLYING,
                current_battery_level: 15, // 警告級別
                signal_strength: 30 // 也是警告級別
            });

            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(1);

            expect(result!.healthStatus).toBe('warning');
        });

        describe('輸入驗證', () => {
            it('應該拒絕無效的無人機 ID', async () => {
                await expect(service.getDroneHealthSummary(0))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.getDroneHealthSummary(-1))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.getDroneHealthSummary(null as any))
                    .rejects.toThrow('無效的無人機 ID');

                await expect(service.getDroneHealthSummary(undefined as any))
                    .rejects.toThrow('無效的無人機 ID');
            });
        });
    });

    describe('錯誤處理', () => {
        it('應該傳播資料庫查詢錯誤', async () => {
            const dbError = new Error('資料庫連接失敗');
            mockRepository.getRealTimeStatusByDroneId.mockRejectedValue(dbError);

            await expect(service.getRealTimeStatusByDroneId(1))
                .rejects.toThrow('資料庫連接失敗');
        });

        it('應該處理 getOnlineDroneStatuses 查詢異常', async () => {
            const dbError = new Error('查詢在線狀態失敗');
            mockRepository.getOnlineDroneStatuses.mockRejectedValue(dbError);

            await expect(service.getOnlineDroneStatuses())
                .rejects.toThrow('查詢在線狀態失敗');
        });

        it('應該處理健康摘要查詢異常', async () => {
            const dbError = new Error('健康摘要查詢失敗');
            mockRepository.getRealTimeStatusByDroneId.mockRejectedValue(dbError);

            await expect(service.getDroneHealthSummary(1))
                .rejects.toThrow('健康摘要查詢失敗');
        });
    });

    describe('邊界條件', () => {
        it('應該處理極值無人機 ID', async () => {
            const maxSafeInteger = Number.MAX_SAFE_INTEGER;
            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(null);

            const result = await service.getRealTimeStatusByDroneId(maxSafeInteger);

            expect(mockRepository.getRealTimeStatusByDroneId).toHaveBeenCalledWith(maxSafeInteger);
            expect(result).toBeNull();
        });

        it('應該處理空的在線無人機列表', async () => {
            mockRepository.getOnlineDroneStatuses.mockResolvedValue([]);

            const result = await service.getOnlineDroneStatuses();

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('服務方法特性', () => {
        it('所有方法都應該是 arrow functions', () => {
            expect(typeof service.getRealTimeStatusByDroneId).toBe('function');
            expect(typeof service.getOnlineDroneStatuses).toBe('function');
            expect(typeof service.getDroneHealthSummary).toBe('function');
        });

        it('應該正確注入依賴', () => {
            expect(service['repository']).toBe(mockRepository);
        });
    });

    describe('性能考慮', () => {
        it('應該高效處理健康狀態計算', async () => {
            const mockStatusData = createMockStatusData();
            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const startTime = Date.now();
            await service.getDroneHealthSummary(1);
            const endTime = Date.now();

            // 健康狀態計算應該在很短時間內完成
            expect(endTime - startTime).toBeLessThan(50);
        });

        it('應該在批量查詢時保持效率', async () => {
            const mockDrones = Array.from({ length: 100 }, (_, i) => 
                createMockStatusData({ drone_id: i + 1 })
            );

            mockRepository.getOnlineDroneStatuses.mockResolvedValue(mockDrones);

            const startTime = Date.now();
            const result = await service.getOnlineDroneStatuses();
            const endTime = Date.now();

            expect(result).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('資料類型驗證', () => {
        it('應該返回正確的健康摘要資料類型', async () => {
            const mockStatusData = createMockStatusData();
            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(1);

            expect(typeof result!.droneId).toBe('number');
            expect(typeof result!.isOnline).toBe('boolean');
            expect(typeof result!.batteryLevel).toBe('number');
            expect(typeof result!.signalStrength).toBe('number');
            expect(typeof result!.lastUpdate).toBe('string');
            expect(['healthy', 'warning', 'critical', 'offline'].includes(result!.healthStatus)).toBe(true);
        });

        it('應該生成有效的 ISO 時間戳', async () => {
            const mockStatusData = createMockStatusData({
                updatedAt: new Date('2025-01-01T12:30:45.678Z')
            });
            mockRepository.getRealTimeStatusByDroneId.mockResolvedValue(mockStatusData);

            const result = await service.getDroneHealthSummary(1);

            expect(result!.lastUpdate).toBe('2025-01-01T12:30:45.678Z');
            expect(new Date(result!.lastUpdate)).toBeInstanceOf(Date);
        });
    });
});