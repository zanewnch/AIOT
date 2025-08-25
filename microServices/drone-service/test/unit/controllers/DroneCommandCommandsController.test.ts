/**
 * @fileoverview 無人機指令命令控制器單元測試
 *
 * 測試 DroneCommandCommandsController 類別的所有功能，包含：
 * - 指令創建測試
 * - 批量指令創建測試
 * - 指令更新和刪除測試
 * - 各種飛行指令發送測試
 * - 指令狀態管理測試
 * - 錯誤處理測試
 *
 * @author AIOT Team
 * @since 1.0.0
 */

import {NextFunction, Request, Response} from 'express';
import {DroneCommandCommands} from '../../../src/controllers/commands/DroneCommandCommandsCtrl.js';
import {DroneCommandCommandsService} from '../../../src/services/commands/DroneCommandCommandsService.js';
import {ControllerResult} from '@aiot/shared-packages/ResResult.js';
import {DroneCommandCreationAttributes} from '../../../src/models/DroneCommandModel.js';

// Mock ResResult
jest.mock('@aiot/shared-packages/ResResult.js', () => ({
    ControllerResult: {
        badRequest: jest.fn((message: string, data?: any) => ({status: 400, message, data})),
        created: jest.fn((message: string, data?: any) => ({status: 201, message, data})),
        success: jest.fn((message: string, data?: any) => ({status: 200, message, data})),
        notFound: jest.fn((message: string, data?: any) => ({status: 404, message, data})),
    }
}));

// Mock logger
jest.mock('@aiot/shared-packages/loggerConfig.js', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }))
}));

describe('DroneCommandCommands', () => {
    let controller: DroneCommandCommands;
    let mockCommandService: jest.Mocked<DroneCommandCommandsService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock DroneCommandCommandsService
        mockCommandService = {
            createCommand: jest.fn(),
            createBatchCommands: jest.fn(),
            updateCommand: jest.fn(),
            deleteCommand: jest.fn(),
            sendTakeoffCommand: jest.fn(),
            sendLandCommand: jest.fn(),
            sendHoverCommand: jest.fn(),
            sendMoveCommand: jest.fn(),
            sendReturnCommand: jest.fn(),
            sendMoveForwardCommand: jest.fn(),
            sendMoveBackwardCommand: jest.fn(),
            sendMoveLeftCommand: jest.fn(),
            sendMoveRightCommand: jest.fn(),
            sendRotateLeftCommand: jest.fn(),
            sendRotateRightCommand: jest.fn(),
            sendEmergencyCommand: jest.fn(),
            executeCommand: jest.fn(),
            completeCommand: jest.fn(),
            failCommand: jest.fn(),
            cancelCommand: jest.fn(),
            sendFlyToCommand: jest.fn(),
            retryFailedCommand: jest.fn(),
        } as any;

        controller = new DroneCommandCommands(mockCommandService);

        // Mock Express objects
        mockRequest = {
            body: {},
            params: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        mockNext = jest.fn();
    });

    describe('createCommand', () => {
        it('應該成功創建指令', async () => {
            const commandData: DroneCommandCreationAttributes = {
                drone_id: 1,
                command_type: 'TAKEOFF',
                issued_by: 1
            };

            mockRequest.body = commandData;
            mockCommandService.createCommand.mockResolvedValue({
                success: true,
                command: {id: 1, ...commandData}
            });

            await controller.createCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockCommandService.createCommand).toHaveBeenCalledWith(commandData);
            expect(ControllerResult.created).toHaveBeenCalledWith(
                '無人機指令創建成功',
                {id: 1, ...commandData}
            );
        });

        it('應該在缺少 drone_id 時返回錯誤', async () => {
            mockRequest.body = {command_type: 'TAKEOFF'};

            await controller.createCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '無人機 ID 為必填項且必須為數字'
            );
            expect(mockCommandService.createCommand).not.toHaveBeenCalled();
        });

        it('應該在缺少 command_type 時返回錯誤', async () => {
            mockRequest.body = {drone_id: 1};

            await controller.createCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '指令類型為必填項'
            );
            expect(mockCommandService.createCommand).not.toHaveBeenCalled();
        });

        it('應該在服務返回失敗時處理錯誤', async () => {
            const commandData = {drone_id: 1, command_type: 'TAKEOFF'};
            mockRequest.body = commandData;
            mockCommandService.createCommand.mockResolvedValue({
                success: false,
                message: '創建失敗'
            });

            await controller.createCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith('創建失敗');
        });

        it('應該處理拋出的異常', async () => {
            mockRequest.body = {drone_id: 1, command_type: 'TAKEOFF'};
            const error = new Error('Service error');
            mockCommandService.createCommand.mockRejectedValue(error);

            await controller.createCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('createCommandsBatch', () => {
        it('應該成功創建批量指令', async () => {
            const commandsData = [
                {drone_id: 1, command_type: 'TAKEOFF', issued_by: 1},
                {drone_id: 2, command_type: 'LAND', issued_by: 1}
            ];
            mockRequest.body = commandsData;
            mockCommandService.createBatchCommands.mockResolvedValue({
                successCount: 2,
                successful: commandsData
            });

            await controller.createCommandsBatch(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockCommandService.createBatchCommands).toHaveBeenCalledWith(commandsData);
            expect(ControllerResult.created).toHaveBeenCalledWith(
                '批量無人機指令創建成功',
                commandsData
            );
        });

        it('應該在非陣列資料時返回錯誤', async () => {
            mockRequest.body = {not: 'array'};

            await controller.createCommandsBatch(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '請提供有效的指令資料陣列'
            );
        });

        it('應該在空陣列時返回錯誤', async () => {
            mockRequest.body = [];

            await controller.createCommandsBatch(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '請提供有效的指令資料陣列'
            );
        });

        it('應該驗證陣列中的每筆資料', async () => {
            mockRequest.body = [
                {drone_id: 1, command_type: 'TAKEOFF'},
                {drone_id: 'invalid', command_type: 'LAND'}
            ];

            await controller.createCommandsBatch(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '第 2 筆資料的無人機 ID 無效'
            );
        });
    });

    describe('updateCommand', () => {
        it('應該成功更新指令', async () => {
            const updateData = {command_type: 'LAND'};
            mockRequest.params = {id: '1'};
            mockRequest.body = updateData;
            mockCommandService.updateCommand.mockResolvedValue({
                id: 1,
                ...updateData
            });

            await controller.updateCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockCommandService.updateCommand).toHaveBeenCalledWith(1, updateData);
            expect(ControllerResult.success).toHaveBeenCalledWith(
                '無人機指令更新成功',
                {id: 1, ...updateData}
            );
        });

        it('應該在無效 ID 時返回錯誤', async () => {
            mockRequest.params = {id: 'invalid'};

            await controller.updateCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '無效的指令 ID 格式'
            );
        });

        it('應該在找不到指令時返回 404', async () => {
            mockRequest.params = {id: '999'};
            mockCommandService.updateCommand.mockResolvedValue(null);

            await controller.updateCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.notFound).toHaveBeenCalledWith(
                '找不到指定的無人機指令'
            );
        });
    });

    describe('deleteCommand', () => {
        it('應該成功刪除指令', async () => {
            mockRequest.params = {id: '1'};
            mockCommandService.deleteCommand.mockResolvedValue(true);

            await controller.deleteCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockCommandService.deleteCommand).toHaveBeenCalledWith(1);
            expect(ControllerResult.success).toHaveBeenCalledWith('無人機指令刪除成功');
        });

        it('應該在找不到指令時返回 404', async () => {
            mockRequest.params = {id: '999'};
            mockCommandService.deleteCommand.mockResolvedValue(false);

            await controller.deleteCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.notFound).toHaveBeenCalledWith(
                '找不到指定的無人機指令'
            );
        });
    });

    describe('飛行指令測試', () => {
        describe('sendTakeoffCommand', () => {
            it('應該成功發送起飛指令', async () => {
                mockRequest.body = {droneId: 1, altitude: 10};
                mockCommandService.sendTakeoffCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, command_type: 'TAKEOFF'}
                });

                await controller.sendTakeoffCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.sendTakeoffCommand).toHaveBeenCalledWith(
                    1, 1, {altitude: 10, speed: undefined}
                );
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '起飛指令發送成功',
                    {id: 1, command_type: 'TAKEOFF'}
                );
            });

            it('應該在缺少 droneId 時返回錯誤', async () => {
                mockRequest.body = {altitude: 10};

                await controller.sendTakeoffCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                    '無人機 ID 為必填項且必須為數字'
                );
            });
        });

        describe('sendLandCommand', () => {
            it('應該成功發送降落指令', async () => {
                mockRequest.body = {droneId: 1};
                mockCommandService.sendLandCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, command_type: 'LAND'}
                });

                await controller.sendLandCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.sendLandCommand).toHaveBeenCalledWith(1, 1, undefined);
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '降落指令發送成功',
                    {id: 1, command_type: 'LAND'}
                );
            });
        });

        describe('sendFlyToCommand', () => {
            it('應該成功發送飛行到指定位置指令', async () => {
                mockRequest.body = {
                    droneId: 1,
                    latitude: 25.0,
                    longitude: 121.0,
                    altitude: 100
                };
                mockCommandService.sendMoveCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, command_type: 'MOVE'}
                });

                await controller.sendFlyToCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.sendMoveCommand).toHaveBeenCalledWith(
                    1, 1, {latitude: 25.0, longitude: 121.0, altitude: 100, speed: undefined}
                );
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '飛行指令發送成功',
                    {id: 1, command_type: 'MOVE'}
                );
            });

            it('應該在缺少座標時返回錯誤', async () => {
                mockRequest.body = {droneId: 1, latitude: 25.0};

                await controller.sendFlyToCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                    '緯度和經度為必填項且必須為數字'
                );
            });
        });

        describe('sendEmergencyCommand', () => {
            it('應該成功發送緊急停止指令', async () => {
                mockRequest.body = {droneId: 1};
                mockCommandService.sendEmergencyCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, command_type: 'EMERGENCY'}
                });

                await controller.sendEmergencyCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.sendEmergencyCommand).toHaveBeenCalledWith(1, 1, undefined);
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '緊急停止指令發送成功',
                    {id: 1, command_type: 'EMERGENCY'}
                );
            });
        });
    });

    describe('指令狀態管理測試', () => {
        describe('executeCommand', () => {
            it('應該成功執行指令', async () => {
                mockRequest.params = {id: '1'};
                mockCommandService.executeCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, status: 'EXECUTING'}
                });

                await controller.executeCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.executeCommand).toHaveBeenCalledWith(1);
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '指令執行成功',
                    {id: 1, status: 'EXECUTING'}
                );
            });
        });

        describe('completeCommand', () => {
            it('應該成功完成指令', async () => {
                mockRequest.params = {id: '1'};
                mockCommandService.completeCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, status: 'COMPLETED'}
                });

                await controller.completeCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.completeCommand).toHaveBeenCalledWith(1);
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '指令完成成功',
                    {id: 1, status: 'COMPLETED'}
                );
            });
        });

        describe('failCommand', () => {
            it('應該成功標記指令失敗', async () => {
                mockRequest.params = {id: '1'};
                mockRequest.body = {reason: '通訊失敗'};
                mockCommandService.failCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, status: 'FAILED'}
                });

                await controller.failCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.failCommand).toHaveBeenCalledWith(1, '通訊失敗');
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '指令標記失敗成功',
                    {id: 1, status: 'FAILED'}
                );
            });
        });

        describe('cancelCommand', () => {
            it('應該成功取消指令', async () => {
                mockRequest.params = {id: '1'};
                mockRequest.body = {reason: '用戶取消'};
                mockCommandService.cancelCommand.mockResolvedValue({
                    success: true,
                    command: {id: 1, status: 'CANCELLED'}
                });

                await controller.cancelCommand(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockCommandService.cancelCommand).toHaveBeenCalledWith(1, '用戶取消');
                expect(ControllerResult.success).toHaveBeenCalledWith(
                    '指令取消成功',
                    {id: 1, status: 'CANCELLED'}
                );
            });
        });
    });

    describe('retryFailedCommand', () => {
        it('應該成功重試失敗的指令', async () => {
            mockRequest.params = {id: '1'};
            mockRequest.body = {issuedBy: 1};
            mockCommandService.retryFailedCommand.mockResolvedValue({
                success: true,
                command: {id: 2, originalCommandId: 1}
            });

            await controller.retryFailedCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockCommandService.retryFailedCommand).toHaveBeenCalledWith(1, 1);
            expect(ControllerResult.created).toHaveBeenCalledWith(
                '指令重試成功',
                {id: 2, originalCommandId: 1}
            );
        });

        it('應該在缺少 issuedBy 時返回錯誤', async () => {
            mockRequest.params = {id: '1'};
            mockRequest.body = {};

            await controller.retryFailedCommand(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(ControllerResult.badRequest).toHaveBeenCalledWith(
                '發送者 ID 為必填項且必須為數字'
            );
        });
    });
});