/**
 * @fileoverview 無人機指令命令服務單元測試
 * 
 * 測試 DroneCommandCommandsSvc 類別的所有功能，包含：
 * - 指令創建和批量創建測試
 * - 指令更新和刪除測試
 * - 各種飛行指令發送測試
 * - 指令狀態管理測試
 * - 業務邏輯驗證測試
 * - 錯誤處理測試
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { DroneCommandCommandsSvc } from '../../../src/services/commands/DroneCommandCommandsSvc.js';
import { DroneCommandQueriesSvc } from '../../../src/services/queries/DroneCommandQueriesSvc.js';
import { DroneCommandCommandsRepository } from '../../../src/repo/commands/DroneCommandCommandsRepo.js';
import { DroneCommandQueriesRepo } from '../../../src/repo/queries/DroneCommandQueriesRepo.js';
import { DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../../src/models/DroneCommandModel.js';
import type { CommandExecutionResult, BatchCommandResult } from '../../../src/types/services/IDroneCommandService.js';

// Mock logger
jest.mock('@aiot/shared-packages/loggerConfig.js', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }))
}));

// Mock decorators
jest.mock('../../../src/decorators/LoggerDecorator.js', () => ({
    Logger: () => () => {},
    LogService: () => () => {},
}));

// Mock repositories
jest.mock('../../../src/repo/commands/DroneCommandCommandsRepo.js');
jest.mock('../../../src/repo/queries/DroneCommandQueriesRepo.js');

describe('DroneCommandCommandsSvc', () => {
    let service: DroneCommandCommandsSvc;
    let mockQueryService: jest.Mocked<DroneCommandQueriesSvc>;
    let mockCommandsRepository: jest.Mocked<DroneCommandCommandsRepository>;
    let mockQueriesRepo: jest.Mocked<DroneCommandQueriesRepo>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock query service
        mockQueryService = {
            getCommandById: jest.fn(),
            getCommandsByDroneId: jest.fn(),
            getCommandsByStatus: jest.fn(),
            getCommandsByType: jest.fn(),
            searchCommands: jest.fn(),
            getCommandStatistics: jest.fn(),
        } as any;

        // Mock repositories
        mockCommandsRepository = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            bulkCreate: jest.fn(),
        } as any;

        mockQueriesRepo = {
            findById: jest.fn(),
            findByDroneId: jest.fn(),
            findByStatus: jest.fn(),
            findMany: jest.fn(),
        } as any;

        // Create service instance
        service = new DroneCommandCommandsSvc(mockQueryService);
        
        // Manually set private properties for testing
        (service as any).commandsRepository = mockCommandsRepository;
        (service as any).queriesRepository = mockQueriesRepo;
    });

    describe('createCommand', () => {
        it('應該成功創建單一指令', async () => {
            const commandData: DroneCommandCreationAttributes = {
                drone_id: 1,
                command_type: DroneCommandType.TAKEOFF,
                issued_by: 1,
                parameters: JSON.stringify({ altitude: 10 })
            };

            const expectedCommand = {
                id: 1,
                ...commandData,
                status: DroneCommandStatus.PENDING,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockCommandsRepository.create.mockResolvedValue(expectedCommand);

            const result = await service.createCommand(commandData);

            expect(result.success).toBe(true);
            expect(result.command).toEqual(expectedCommand);
            expect(mockCommandsRepository.create).toHaveBeenCalledWith({
                ...commandData,
                status: DroneCommandStatus.PENDING
            });
        });

        it('應該在創建失敗時返回錯誤', async () => {
            const commandData: DroneCommandCreationAttributes = {
                drone_id: 1,
                command_type: DroneCommandType.TAKEOFF,
                issued_by: 1
            };

            mockCommandsRepository.create.mockRejectedValue(new Error('Database error'));

            const result = await service.createCommand(commandData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('指令創建失敗');
        });
    });

    describe('createBatchCommands', () => {
        it('應該成功創建批量指令', async () => {
            const commandsData: DroneCommandCreationAttributes[] = [
                { drone_id: 1, command_type: DroneCommandType.TAKEOFF, issued_by: 1 },
                { drone_id: 2, command_type: DroneCommandType.LAND, issued_by: 1 }
            ];

            const expectedCommands = commandsData.map((data, index) => ({
                id: index + 1,
                ...data,
                status: DroneCommandStatus.PENDING,
                created_at: new Date(),
                updated_at: new Date()
            }));

            mockCommandsRepository.bulkCreate.mockResolvedValue({
                successful: expectedCommands,
                failed: [],
                successCount: 2,
                failedCount: 0
            });

            const result = await service.createBatchCommands(commandsData);

            expect(result.successCount).toBe(2);
            expect(result.failedCount).toBe(0);
            expect(result.successful).toEqual(expectedCommands);
            expect(result.failed).toEqual([]);
        });

        it('應該處理部分成功的批量創建', async () => {
            const commandsData: DroneCommandCreationAttributes[] = [
                { drone_id: 1, command_type: DroneCommandType.TAKEOFF, issued_by: 1 },
                { drone_id: 999, command_type: DroneCommandType.LAND, issued_by: 1 } // 假設這個會失敗
            ];

            const successfulCommand = {
                id: 1,
                ...commandsData[0],
                status: DroneCommandStatus.PENDING,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockCommandsRepository.bulkCreate.mockResolvedValue({
                successful: [successfulCommand],
                failed: [{ data: commandsData[1], error: 'Invalid drone_id' }],
                successCount: 1,
                failedCount: 1
            });

            const result = await service.createBatchCommands(commandsData);

            expect(result.successCount).toBe(1);
            expect(result.failedCount).toBe(1);
            expect(result.successful.length).toBe(1);
            expect(result.failed.length).toBe(1);
        });
    });

    describe('updateCommand', () => {
        it('應該成功更新指令', async () => {
            const commandId = 1;
            const updateData = { parameters: JSON.stringify({ speed: 5 }) };
            const updatedCommand = {
                id: commandId,
                drone_id: 1,
                command_type: DroneCommandType.TAKEOFF,
                status: DroneCommandStatus.PENDING,
                ...updateData,
                updated_at: new Date()
            };

            mockCommandsRepository.update.mockResolvedValue(updatedCommand);

            const result = await service.updateCommand(commandId, updateData);

            expect(result).toEqual(updatedCommand);
            expect(mockCommandsRepository.update).toHaveBeenCalledWith(commandId, updateData);
        });

        it('應該在找不到指令時返回 null', async () => {
            const commandId = 999;
            const updateData = { parameters: JSON.stringify({ speed: 5 }) };

            mockCommandsRepository.update.mockResolvedValue(null);

            const result = await service.updateCommand(commandId, updateData);

            expect(result).toBeNull();
        });
    });

    describe('deleteCommand', () => {
        it('應該成功刪除指令', async () => {
            const commandId = 1;
            mockCommandsRepository.delete.mockResolvedValue(true);

            const result = await service.deleteCommand(commandId);

            expect(result).toBe(true);
            expect(mockCommandsRepository.delete).toHaveBeenCalledWith(commandId);
        });

        it('應該在找不到指令時返回 false', async () => {
            const commandId = 999;
            mockCommandsRepository.delete.mockResolvedValue(false);

            const result = await service.deleteCommand(commandId);

            expect(result).toBe(false);
        });
    });

    describe('飛行指令發送測試', () => {
        describe('sendTakeoffCommand', () => {
            it('應該成功發送起飛指令', async () => {
                const droneId = 1;
                const issuedBy = 1;
                const parameters = { altitude: 10, speed: 2 };
                
                const expectedCommand = {
                    id: 1,
                    drone_id: droneId,
                    command_type: DroneCommandType.TAKEOFF,
                    issued_by: issuedBy,
                    parameters: JSON.stringify(parameters),
                    status: DroneCommandStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                mockCommandsRepository.create.mockResolvedValue(expectedCommand);

                const result = await service.sendTakeoffCommand(droneId, issuedBy, parameters);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(expectedCommand);
                expect(mockCommandsRepository.create).toHaveBeenCalledWith({
                    drone_id: droneId,
                    command_type: DroneCommandType.TAKEOFF,
                    issued_by: issuedBy,
                    parameters: JSON.stringify(parameters),
                    status: DroneCommandStatus.PENDING
                });
            });

            it('應該在發送起飛指令失敗時返回錯誤', async () => {
                const droneId = 1;
                const issuedBy = 1;
                const parameters = { altitude: 10 };

                mockCommandsRepository.create.mockRejectedValue(new Error('Database error'));

                const result = await service.sendTakeoffCommand(droneId, issuedBy, parameters);

                expect(result.success).toBe(false);
                expect(result.message).toContain('起飛指令發送失敗');
            });
        });

        describe('sendLandCommand', () => {
            it('應該成功發送降落指令', async () => {
                const droneId = 1;
                const issuedBy = 1;
                const parameters = { speed: 1 };

                const expectedCommand = {
                    id: 1,
                    drone_id: droneId,
                    command_type: DroneCommandType.LAND,
                    issued_by: issuedBy,
                    parameters: JSON.stringify(parameters),
                    status: DroneCommandStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                mockCommandsRepository.create.mockResolvedValue(expectedCommand);

                const result = await service.sendLandCommand(droneId, issuedBy, parameters);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(expectedCommand);
            });
        });

        describe('sendMoveCommand', () => {
            it('應該成功發送移動指令', async () => {
                const droneId = 1;
                const issuedBy = 1;
                const parameters = { 
                    latitude: 25.0334, 
                    longitude: 121.5654, 
                    altitude: 100, 
                    speed: 3 
                };

                const expectedCommand = {
                    id: 1,
                    drone_id: droneId,
                    command_type: DroneCommandType.MOVE,
                    issued_by: issuedBy,
                    parameters: JSON.stringify(parameters),
                    status: DroneCommandStatus.PENDING,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                mockCommandsRepository.create.mockResolvedValue(expectedCommand);

                const result = await service.sendMoveCommand(droneId, issuedBy, parameters);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(expectedCommand);
            });

            it('應該驗證移動參數', async () => {
                const droneId = 1;
                const issuedBy = 1;
                const invalidParameters = { 
                    latitude: 'invalid', 
                    longitude: 121.5654, 
                    altitude: 100 
                };

                const result = await service.sendMoveCommand(droneId, issuedBy, invalidParameters as any);

                expect(result.success).toBe(false);
                expect(result.message).toContain('無效的座標參數');
                expect(mockCommandsRepository.create).not.toHaveBeenCalled();
            });
        });

        describe('sendEmergencyCommand', () => {
            it('應該成功發送緊急停止指令', async () => {
                const droneId = 1;
                const issuedBy = 1;

                const expectedCommand = {
                    id: 1,
                    drone_id: droneId,
                    command_type: DroneCommandType.EMERGENCY,
                    issued_by: issuedBy,
                    status: DroneCommandStatus.PENDING,
                    priority: 'HIGH',
                    created_at: new Date(),
                    updated_at: new Date()
                };

                mockCommandsRepository.create.mockResolvedValue(expectedCommand);

                const result = await service.sendEmergencyCommand(droneId, issuedBy);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(expectedCommand);
                expect(mockCommandsRepository.create).toHaveBeenCalledWith({
                    drone_id: droneId,
                    command_type: DroneCommandType.EMERGENCY,
                    issued_by: issuedBy,
                    status: DroneCommandStatus.PENDING,
                    priority: 'HIGH'
                });
            });
        });
    });

    describe('指令狀態管理測試', () => {
        describe('executeCommand', () => {
            it('應該成功執行指令', async () => {
                const commandId = 1;
                const existingCommand = {
                    id: commandId,
                    status: DroneCommandStatus.PENDING
                };

                const updatedCommand = {
                    ...existingCommand,
                    status: DroneCommandStatus.EXECUTING,
                    executed_at: new Date()
                };

                mockQueriesRepo.findById.mockResolvedValue(existingCommand);
                mockCommandsRepository.update.mockResolvedValue(updatedCommand);

                const result = await service.executeCommand(commandId);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(updatedCommand);
                expect(mockCommandsRepository.update).toHaveBeenCalledWith(commandId, {
                    status: DroneCommandStatus.EXECUTING,
                    executed_at: expect.any(Date)
                });
            });

            it('應該拒絕執行已完成的指令', async () => {
                const commandId = 1;
                const existingCommand = {
                    id: commandId,
                    status: DroneCommandStatus.COMPLETED
                };

                mockQueriesRepo.findById.mockResolvedValue(existingCommand);

                const result = await service.executeCommand(commandId);

                expect(result.success).toBe(false);
                expect(result.message).toContain('指令狀態不允許執行');
                expect(mockCommandsRepository.update).not.toHaveBeenCalled();
            });

            it('應該在找不到指令時返回錯誤', async () => {
                const commandId = 999;
                mockQueriesRepo.findById.mockResolvedValue(null);

                const result = await service.executeCommand(commandId);

                expect(result.success).toBe(false);
                expect(result.message).toContain('找不到指定的指令');
            });
        });

        describe('completeCommand', () => {
            it('應該成功完成指令', async () => {
                const commandId = 1;
                const existingCommand = {
                    id: commandId,
                    status: DroneCommandStatus.EXECUTING
                };

                const completedCommand = {
                    ...existingCommand,
                    status: DroneCommandStatus.COMPLETED,
                    completed_at: new Date()
                };

                mockQueriesRepo.findById.mockResolvedValue(existingCommand);
                mockCommandsRepository.update.mockResolvedValue(completedCommand);

                const result = await service.completeCommand(commandId);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(completedCommand);
            });
        });

        describe('failCommand', () => {
            it('應該成功標記指令失敗', async () => {
                const commandId = 1;
                const reason = '通訊失敗';
                const existingCommand = {
                    id: commandId,
                    status: DroneCommandStatus.EXECUTING
                };

                const failedCommand = {
                    ...existingCommand,
                    status: DroneCommandStatus.FAILED,
                    error_message: reason,
                    failed_at: new Date()
                };

                mockQueriesRepo.findById.mockResolvedValue(existingCommand);
                mockCommandsRepository.update.mockResolvedValue(failedCommand);

                const result = await service.failCommand(commandId, reason);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(failedCommand);
                expect(mockCommandsRepository.update).toHaveBeenCalledWith(commandId, {
                    status: DroneCommandStatus.FAILED,
                    error_message: reason,
                    failed_at: expect.any(Date)
                });
            });
        });

        describe('cancelCommand', () => {
            it('應該成功取消指令', async () => {
                const commandId = 1;
                const reason = '用戶取消';
                const existingCommand = {
                    id: commandId,
                    status: DroneCommandStatus.PENDING
                };

                const cancelledCommand = {
                    ...existingCommand,
                    status: DroneCommandStatus.CANCELLED,
                    cancellation_reason: reason,
                    cancelled_at: new Date()
                };

                mockQueriesRepo.findById.mockResolvedValue(existingCommand);
                mockCommandsRepository.update.mockResolvedValue(cancelledCommand);

                const result = await service.cancelCommand(commandId, reason);

                expect(result.success).toBe(true);
                expect(result.command).toEqual(cancelledCommand);
            });

            it('應該拒絕取消已執行的指令', async () => {
                const commandId = 1;
                const existingCommand = {
                    id: commandId,
                    status: DroneCommandStatus.COMPLETED
                };

                mockQueriesRepo.findById.mockResolvedValue(existingCommand);

                const result = await service.cancelCommand(commandId, '用戶取消');

                expect(result.success).toBe(false);
                expect(result.message).toContain('已完成的指令無法取消');
            });
        });
    });

    describe('retryFailedCommand', () => {
        it('應該成功重試失敗的指令', async () => {
            const originalCommandId = 1;
            const issuedBy = 1;
            const originalCommand = {
                id: originalCommandId,
                drone_id: 1,
                command_type: DroneCommandType.TAKEOFF,
                parameters: JSON.stringify({ altitude: 10 }),
                status: DroneCommandStatus.FAILED,
                issued_by: 2
            };

            const newCommand = {
                id: 2,
                drone_id: originalCommand.drone_id,
                command_type: originalCommand.command_type,
                parameters: originalCommand.parameters,
                issued_by: issuedBy,
                status: DroneCommandStatus.PENDING,
                original_command_id: originalCommandId,
                created_at: new Date(),
                updated_at: new Date()
            };

            mockQueriesRepo.findById.mockResolvedValue(originalCommand);
            mockCommandsRepository.create.mockResolvedValue(newCommand);

            const result = await service.retryFailedCommand(originalCommandId, issuedBy);

            expect(result.success).toBe(true);
            expect(result.command).toEqual(newCommand);
            expect(mockCommandsRepository.create).toHaveBeenCalledWith({
                drone_id: originalCommand.drone_id,
                command_type: originalCommand.command_type,
                parameters: originalCommand.parameters,
                issued_by: issuedBy,
                status: DroneCommandStatus.PENDING,
                original_command_id: originalCommandId
            });
        });

        it('應該拒絕重試未失敗的指令', async () => {
            const commandId = 1;
            const issuedBy = 1;
            const existingCommand = {
                id: commandId,
                status: DroneCommandStatus.COMPLETED
            };

            mockQueriesRepo.findById.mockResolvedValue(existingCommand);

            const result = await service.retryFailedCommand(commandId, issuedBy);

            expect(result.success).toBe(false);
            expect(result.message).toContain('只能重試失敗的指令');
            expect(mockCommandsRepository.create).not.toHaveBeenCalled();
        });
    });
});