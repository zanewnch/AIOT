/**
 * @fileoverview 無人機指令命令控制器
 *
 * 此文件實作了無人機指令命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除、發送指令等寫入邏輯。
 *
 * @module DroneCommandCommandsCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneCommandCommandsSvc} from '../../services/commands/DroneCommandCommandsSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult.js';
import {TYPES} from '../../container/types.js';
import type {DroneCommandCreationAttributes} from '../../models/DroneCommandModel.js';

const logger = createLogger('DroneCommandCommandsCtrl');

/**
 * 無人機指令命令控制器類別
 *
 * 專門處理無人機指令相關的命令請求，包含創建、更新、刪除、發送指令等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneCommandCommandsCtrl
 * @since 1.0.0
 */
@injectable()
export class DroneCommandCommandsCtrl {
    constructor(
        @inject(TYPES.DroneCommandCommandsSvc) private readonly commandService: DroneCommandCommandsSvc
    ) {
    }

    /**
     * 創建新的無人機指令
     * 
     * 接收 HTTP POST 請求並創建新的無人機指令記錄
     * 包含完整的輸入驗證和錯誤處理機制
     * 
     * @param req - Express 請求物件，包含指令數據
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令創建失敗或輸入驗證失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 請求體範例
     * const requestBody = {
     *   drone_id: 1,
     *   command_type: 'takeoff',
     *   parameters: { altitude: 10 },
     *   issued_by: 1
     * };
     * 
     * // 成功回應
     * {
     *   "status": 201,
     *   "message": "無人機指令創建成功",
     *   "data": { "id": 123, "drone_id": 1, "command_type": "takeoff" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/data
     */
    createCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandData: DroneCommandCreationAttributes = req.body;

            // 基本驗證
            if (!commandData.drone_id || typeof commandData.drone_id !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!commandData.command_type || typeof commandData.command_type !== 'string') {
                const result = ResResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.createCommand(commandData);

            if (result.success) {
                const response = ResResult.created('無人機指令創建成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '指令創建失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 批量創建指令
     * 
     * 接收指令數據陣列並批量創建無人機指令
     * 支援部分成功的情況，會返回成功和失敗的詳細信息
     * 
     * @param req - Express 請求物件，包含指令數據陣列
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當批量創建失敗或輸入驗證失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 批量請求體範例
     * const requestBody = [
     *   { drone_id: 1, command_type: 'takeoff', issued_by: 1 },
     *   { drone_id: 2, command_type: 'land', issued_by: 1 }
     * ];
     * 
     * // 成功回應
     * {
     *   "status": 201,
     *   "message": "批量無人機指令創建成功",
     *   "data": {
     *     "successful": [],  // 成功的指令
     *     "failed": [],      // 失敗的指令
     *     "successCount": 2,
     *     "failCount": 0
     *   }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/data/batch
     */
    createCommandsCtrlBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandsData: DroneCommandCreationAttributes[] = req.body;

            // 驗證批量資料
            if (!Array.isArray(commandsData) || commandsData.length === 0) {
                const result = ResResult.badRequest('請提供有效的指令資料陣列');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每筆資料
            for (let i = 0; i < commandsData.length; i++) {
                const data = commandsData[i];
                if (!data.drone_id || typeof data.drone_id !== 'number') {
                    const result = ResResult.badRequest(`第 ${i + 1} 筆資料的無人機 ID 無效`);
                    res.status(result.status).json(result);
                    return;
                }
                if (!data.command_type || typeof data.command_type !== 'string') {
                    const result = ResResult.badRequest(`第 ${i + 1} 筆資料的指令類型無效`);
                    res.status(result.status).json(result);
                    return;
                }
            }

            const result = await this.commandService.createBatchCommands(commandsData);

            if (result.successCount > 0) {
                const response = ResResult.created('批量無人機指令創建成功', result.successful);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest('所有批量指令創建失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 更新指令
     * 
     * 根據指令 ID 更新現有無人機指令的部分屬性
     * 只允許更新特定欄位，不能更改核心識別信息
     * 
     * @param req - Express 請求物件，包含指令 ID 和更新數據
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令不存在或更新失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 更新請求範例
     * // PUT /api/drone-commands/data/123
     * {
     *   "parameters": { "altitude": 15 },
     *   "notes": "更新飛行高度"
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "無人機指令更新成功",
     *   "data": {}  // 更新後的指令數據
     * }
     * ```
     * 
     * @route PUT /api/drone-commands/data/:id
     */
    updateCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.updateCommand(id, updateData);

            if (result) {
                const response = ResResult.success('無人機指令更新成功', result);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.notFound('找不到指定的無人機指令');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 刪除指令
     * 
     * 根據指令 ID 刪除現有的無人機指令記錄
     * 只能刪除未執行的指令，已執行的指令不能被刪除
     * 
     * @param req - Express 請求物件，包含指令 ID
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令不存在或無法刪除時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 刪除請求範例
     * // DELETE /api/drone-commands/data/123
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "無人機指令刪除成功",
     *   "data": null
     * }
     * 
     * // 錯誤回應
     * {
     *   "status": 404,
     *   "message": "找不到指定的無人機指令",
     *   "data": null
     * }
     * ```
     * 
     * @route DELETE /api/drone-commands/data/:id
     */
    deleteCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.deleteCommand(id);

            if (result) {
                const response = ResResult.success('無人機指令刪除成功');
                res.status(response.status).json(response);
            } else {
                const response = ResResult.notFound('找不到指定的無人機指令');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    // ==================== 指令發送相關方法 ====================

    /**
     * 發送起飛指令
     * 
     * 向指定無人機發送起飛指令，包含高度和速度參數
     * 會自動檢查無人機狀態和安全性
     * 
     * @param req - Express 請求物件，包含 droneId 和起飛參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當無人機不存在或不能執行起飛時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 起飛請求範例
     * {
     *   "droneId": 1,
     *   "altitude": 10,
     *   "parameters": { "speed": 5 }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "起飛指令發送成功",
     *   "data": { "commandId": 456, "status": "sent" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/takeoff
     */
    sendTakeoffCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, altitude = 10, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendTakeoffCommand(droneId, 1, {
                altitude,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('起飛指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '起飛指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送降落指令
     * 
     * 向指定無人機發送降落指令，無人機將安全降落到地面
     * 會自動選擇最佳降落地點和降落程序
     * 
     * @param req - Express 請求物件，包含 droneId 和降落參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當無人機不存在或不能執行降落時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 降落請求範例
     * {
     *   "droneId": 1,
     *   "parameters": { "emergency": false }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "降落指令發送成功",
     *   "data": { "commandId": 457, "estimatedLandingTime": "2025-08-18T10:45:00Z" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/land
     */
    sendLandCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendLandCommand(droneId, 1, parameters);

            if (result.success) {
                const response = ResResult.success('降落指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '降落指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送懸停指令
     * 
     * 向指定無人機發送懸停指令，無人機將在當前位置保持懸停
     * 可指定懸停持續時間，適用於穩定性測試和等待任務
     * 
     * @param req - Express 請求物件，包含 droneId 和懸停時間
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當無人機不存在或不能執行懸停時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 懸停請求範例
     * {
     *   "droneId": 1,
     *   "duration": 30000  // 30秒
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "懸停指令發送成功",
     *   "data": { "commandId": 458, "duration": 30000 }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/hover
     */
    sendHoverCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, duration} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendHoverCommand(droneId, 1, {duration});

            if (result.success) {
                const response = ResResult.success('懸停指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '懸停指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送飛行到指定位置指令
     * 
     * 向指定無人機發送飛行到特定坐標的指令
     * 支援 3D 定位，包含緯度、經度和高度
     * 
     * @param req - Express 請求物件，包含目標坐標和飛行參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當坐標無效或無人機無法到達目標位置時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 飛行請求範例
     * {
     *   "droneId": 1,
     *   "latitude": 25.0330,
     *   "longitude": 121.5654,
     *   "altitude": 50,
     *   "parameters": { "speed": 10 }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "飛行指令發送成功",
     *   "data": { "commandId": 459, "estimatedArrivalTime": "2025-08-18T10:50:00Z" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/flyTo
     */
    sendFlyToCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, latitude, longitude, altitude, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                const result = ResResult.badRequest('緯度和經度為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendMoveCommand(droneId, 1, {
                latitude,
                longitude,
                altitude,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('飛行指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '飛行指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送返航指令
     * 
     * 向指定無人機發送返回起飛位置的指令
     * 無人機將自動計算最佳返航路徑並安全返回起飛點
     * 
     * @param req - Express 請求物件，包含 droneId 和返航參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當無人機無法執行返航或起飛點坐標遺失時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 返航請求範例
     * {
     *   "droneId": 1,
     *   "parameters": { "speed": 8, "safetyMode": true }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "返航指令發送成功",
     *   "data": { "commandId": 460, "homePosition": { "lat": 25.0330, "lng": 121.5654 } }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/return
     */
    sendReturnCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendReturnCommand(droneId, 1, parameters);

            if (result.success) {
                const response = ResResult.success('返航指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '返航指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送前進指令
     * 
     * 向指定無人機發送向前移動指定距離的指令
     * 移動方向基於無人機當前的朝向
     * 
     * @param req - Express 請求物件，包含 droneId、距離和移動參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當移動距離無效或前方有障礙物時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 前進請求範例
     * {
     *   "droneId": 1,
     *   "distance": 5,  // 5公尺
     *   "parameters": { "speed": 3 }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "前進指令發送成功",
     *   "data": { "commandId": 461, "distance": 5, "direction": "forward" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/moveForward
     */
    sendMoveForwardCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, distance = 1, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendMoveForwardCommand(droneId, 1, {
                distance,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('前進指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '前進指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送後退指令
     * 
     * 向指定無人機發送向後移動指定距離的指令
     * 移動方向與當前朝向相反
     * 
     * @param req - Express 請求物件，包含 droneId、距離和移動參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當移動距離無效或後方有障礙物時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 後退請求範例
     * {
     *   "droneId": 1,
     *   "distance": 3,  // 3公尺
     *   "parameters": { "speed": 2 }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "後退指令發送成功",
     *   "data": { "commandId": 462, "distance": 3, "direction": "backward" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/moveBackward
     */
    sendMoveBackwardCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, distance = 1, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendMoveBackwardCommand(droneId, 1, {
                distance,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('後退指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '後退指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送左移指令
     * 
     * 向指定無人機發送向左側移動指定距離的指令
     * 移動方向垂直於當前朝向的左側
     * 
     * @param req - Express 請求物件，包含 droneId、距離和移動參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當移動距離無效或左側有障礙物時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 左移請求範例
     * {
     *   "droneId": 1,
     *   "distance": 2,  // 2公尺
     *   "parameters": { "speed": 1.5 }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "左移指令發送成功",
     *   "data": { "commandId": 463, "distance": 2, "direction": "left" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/moveLeft
     */
    sendMoveLeftCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, distance = 1, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendMoveLeftCommand(droneId, 1, {
                distance,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('左移指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '左移指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送右移指令
     * 
     * 向指定無人機發送向右側移動指定距離的指令
     * 移動方向垂直於當前朝向的右側
     * 
     * @param req - Express 請求物件，包含 droneId、距離和移動參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當移動距離無效或右側有障礙物時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 右移請求範例
     * {
     *   "droneId": 1,
     *   "distance": 4,  // 4公尺
     *   "parameters": { "speed": 2.5 }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "右移指令發送成功",
     *   "data": { "commandId": 464, "distance": 4, "direction": "right" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/moveRight
     */
    sendMoveRightCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, distance = 1, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendMoveRightCommand(droneId, 1, {
                distance,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('右移指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '右移指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送左轉指令
     * 
     * 向指定無人機發送逆時針旋轉指定角度的指令
     * 無人機將保持當前位置並旋轉機身朝向
     * 
     * @param req - Express 請求物件，包含 droneId、旋轉角度和旋轉參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當旋轉角度無效或無人機無法旋轉時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 左轉請求範例
     * {
     *   "droneId": 1,
     *   "degrees": 45,  // 45度
     *   "parameters": { "speed": 30 }  // 30度/秒
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "左轉指令發送成功",
     *   "data": { "commandId": 465, "degrees": 45, "direction": "left" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/rotateLeft
     */
    sendRotateLeftCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, degrees = 90, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendRotateLeftCommand(droneId, 1, {
                degrees,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('左轉指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '左轉指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送右轉指令
     * 
     * 向指定無人機發送順時針旋轉指定角度的指令
     * 無人機將保持當前位置並旋轉機身朝向
     * 
     * @param req - Express 請求物件，包含 droneId、旋轉角度和旋轉參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當旋轉角度無效或無人機無法旋轉時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 右轉請求範例
     * {
     *   "droneId": 1,
     *   "degrees": 90,  // 90度
     *   "parameters": { "speed": 25 }  // 25度/秒
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "右轉指令發送成功",
     *   "data": { "commandId": 466, "degrees": 90, "direction": "right" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/rotateRight
     */
    sendRotateRightCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, degrees = 90, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendRotateRightCommand(droneId, 1, {
                degrees,
                speed: parameters?.speed
            });

            if (result.success) {
                const response = ResResult.success('右轉指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '右轉指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送緊急停止指令
     * 
     * 向指定無人機發送緊急停止指令，立即中止所有飛行動作
     * 無人機將停止所有馬達運轉並保持位置或緊急降落
     * 
     * @param req - Express 請求物件，包含 droneId 和緊急情況參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當緊急停止執行失敗或系統異常時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 緊急停止請求範例
     * {
     *   "droneId": 1,
     *   "parameters": { 
     *     "emergencyType": "user_stop",
     *     "forceShutdown": true 
     *   }
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "緊急停止指令發送成功",
     *   "data": { "commandId": 467, "emergencyStop": true, "shutdownTime": "2025-08-18T10:30:00Z" }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/emergency
     */
    sendEmergencyCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, parameters} = req.body;

            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendEmergencyCommand(droneId, 1, parameters);

            if (result.success) {
                const response = ResResult.success('緊急停止指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '緊急停止指令發送失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    // ==================== 指令狀態管理相關方法 ====================

    /**
     * 執行指令
     * 
     * 根據指令 ID 執行指定的無人機指令
     * 將指令狀態從 'pending' 轉換為 'executing'
     * 
     * @param req - Express 請求物件，包含指令 ID
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令不存在或已經執行時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 執行請求範例
     * // PUT /api/drone-commands/123/execute
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "指令執行成功",
     *   "data": { "id": 123, "status": "executing", "executedAt": "2025-08-18T10:30:00Z" }
     * }
     * ```
     * 
     * @route PUT /api/drone-commands/:id/execute
     */
    executeCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.executeCommand(id);

            if (result.success) {
                const response = ResResult.success('指令執行成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '指令執行失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 完成指令
     * 
     * 根據指令 ID 標記指定的無人機指令為完成狀態
     * 將指令狀態從 'executing' 轉換為 'completed'
     * 
     * @param req - Express 請求物件，包含指令 ID
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令不存在或不能完成時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 完成請求範例
     * // PUT /api/drone-commands/123/complete
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "指令完成成功",
     *   "data": { "id": 123, "status": "completed", "completedAt": "2025-08-18T10:35:00Z" }
     * }
     * ```
     * 
     * @route PUT /api/drone-commands/:id/complete
     */
    completeCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.completeCommand(id);

            if (result.success) {
                const response = ResResult.success('指令完成成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '指令完成失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 標記指令失敗
     * 
     * 根據指令 ID 標記指定的無人機指令為失敗狀態
     * 將指令狀態轉換為 'failed' 並記錄失敗原因
     * 
     * @param req - Express 請求物件，包含指令 ID 和失敗原因
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令不存在或不能標記失敗時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 失敗標記請求範例
     * // PUT /api/drone-commands/123/fail
     * {
     *   "reason": "無人機電池不足，無法完成指令"
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "指令標記失敗成功",
     *   "data": { "id": 123, "status": "failed", "failReason": "無人機電池不足" }
     * }
     * ```
     * 
     * @route PUT /api/drone-commands/:id/fail
     */
    failCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const {reason} = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.failCommand(id, reason);

            if (result.success) {
                const response = ResResult.success('指令標記失敗成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '指令標記失敗失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取消指令
     * 
     * 根據指令 ID 取消指定的無人機指令
     * 將指令狀態轉換為 'cancelled' 並記錄取消原因
     * 
     * @param req - Express 請求物件，包含指令 ID 和取消原因
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當指令不存在或不能取消時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 取消請求範例
     * // PUT /api/drone-commands/123/cancel
     * {
     *   "reason": "使用者手動取消任務"
     * }
     * 
     * // 成功回應
     * {
     *   "status": 200,
     *   "message": "指令取消成功",
     *   "data": { "id": 123, "status": "cancelled", "cancelReason": "使用者手動取消" }
     * }
     * ```
     * 
     * @route PUT /api/drone-commands/:id/cancel
     */
    cancelCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const {reason} = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.cancelCommand(id, reason);

            if (result.success) {
                const response = ResResult.success('指令取消成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message || '指令取消失敗');
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 發送移動指令
     * 
     * 向指定無人機發送移動到特定 3D 坐標的指令
     * 支援精確的緯度、經度和高度定位
     * 
     * @param req - Express 請求物件，包含目標坐標和飛行參數
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當坐標參數無效或無人機無法到達目標時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 移動請求範例
     * {
     *   "droneId": 1,
     *   "issuedBy": 2,
     *   "latitude": 25.0330,
     *   "longitude": 121.5654,
     *   "altitude": 100,
     *   "speed": 15
     * }
     * 
     * // 成功回應
     * {
     *   "status": 201,
     *   "message": "移動指令發送成功",
     *   "data": { "commandId": 468, "targetCoordinates": { "lat": 25.0330, "lng": 121.5654, "alt": 100 } }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/send/move
     */
    sendMoveCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, issuedBy, latitude, longitude, altitude, speed} = req.body;

            // 基本驗證
            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!issuedBy || typeof issuedBy !== 'number') {
                const result = ResResult.badRequest('發送者 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof altitude !== 'number') {
                const result = ResResult.badRequest('緯度、經度和高度為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.sendFlyToCommand(droneId, issuedBy, {
                latitude,
                longitude,
                altitude,
                speed
            });

            if (result.success && result.command) {
                const response = ResResult.created('移動指令發送成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message);
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * 重試失敗的指令
     * 
     * 根據失敗的指令 ID 重新發送該指令
     * 將原失敗指令的參數複製到新的指令中
     * 
     * @param req - Express 請求物件，包含原指令 ID 和發送者 ID
     * @param res - Express 回應物件，用於返回結果
     * @param next - Express 下一個中間件函數
     * @returns Promise<void> 無直接返回值，通過 res 返回結果
     * 
     * @throws {Error} 當原指令不存在或不是失敗狀態時拋出錯誤
     * 
     * @example
     * ```typescript
     * // 重試請求範例
     * // POST /api/drone-commands/123/retry
     * {
     *   "issuedBy": 2
     * }
     * 
     * // 成功回應
     * {
     *   "status": 201,
     *   "message": "指令重試成功",
     *   "data": { "newCommandId": 469, "originalCommandId": 123, "retryAttempt": 1 }
     * }
     * ```
     * 
     * @route POST /api/drone-commands/:id/retry
     */
    retryFailedCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandId = parseInt(req.params.id);
            const {issuedBy} = req.body;

            // 驗證 ID
            if (isNaN(commandId)) {
                const result = ResResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!issuedBy || typeof issuedBy !== 'number') {
                const result = ResResult.badRequest('發送者 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            const result = await this.commandService.retryFailedCommand(commandId, issuedBy);

            if (result.success && result.command) {
                const response = ResResult.created('指令重試成功', result.command);
                res.status(response.status).json(response);
            } else {
                const response = ResResult.badRequest(result.message);
                res.status(response.status).json(response);
            }
        } catch (error) {
            next(error);
        }
    }
}