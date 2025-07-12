import { RabbitMQService } from './RabbitMQService.js';
import { Command } from '../models/Command.js';

export class DeviceCommandService {
  private rabbitMQService: RabbitMQService;

  constructor(rabbitMQService: RabbitMQService) {
    this.rabbitMQService = rabbitMQService;
  }

  static async create(): Promise<DeviceCommandService> {
    const rabbitMQService = await RabbitMQService.create();
    return new DeviceCommandService(rabbitMQService);
  }

  async sendTurnOnCommand(deviceId: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    const command: Command = {
      id: this.generateCommandId(),
      deviceId,
      commandType: 'turn_on',
      parameters: {},
      status: 'pending',
      issuedAt: new Date(),
      priority,
      timeout: 30000, // 30秒超時
    };

    await this.rabbitMQService.sendDeviceCommand(command);
  }

  async sendTurnOffCommand(deviceId: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    const command: Command = {
      id: this.generateCommandId(),
      deviceId,
      commandType: 'turn_off',
      parameters: {},
      status: 'pending',
      issuedAt: new Date(),
      priority,
      timeout: 30000,
    };

    await this.rabbitMQService.sendDeviceCommand(command);
  }

  async sendSetParameterCommand(
    deviceId: string,
    key: string,
    value: number | string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> {
    const command: Command = {
      id: this.generateCommandId(),
      deviceId,
      commandType: 'set_param',
      parameters: { key, value },
      status: 'pending',
      issuedAt: new Date(),
      priority,
      timeout: 30000,
    };

    await this.rabbitMQService.sendDeviceCommand(command);
  }

  async startCommandProcessor(
    onCommandReceived: (command: Command) => Promise<void>
  ): Promise<void> {
    await this.rabbitMQService.consumeDeviceCommands(async (command: Command) => {
      console.log(`🔧 Processing command: ${command.commandType} for device ${command.deviceId}`);
      
      try {
        await onCommandReceived(command);
        console.log(`✅ Command processed successfully: ${command.id}`);
      } catch (error) {
        console.error(`❌ Failed to process command ${command.id}:`, error);
        throw error;
      }
    });
  }

  /**
   * 生成唯一的指令識別碼
   * 
   * 產生一個由時間戳和隨機字串組成的唯一識別碼，用於追蹤和識別裝置指令。
   * 格式為 'cmd_[時間戳]_[隨機字串]'，確保每個指令都有獨特的識別碼。
   * 
   * @private
   * @returns {string} 唯一的指令識別碼
   * 
   * @example
   * ```typescript
   * const commandId = this.generateCommandId();
   * // 回傳類似 'cmd_1634567890123_abc123def' 的字串
   * ```
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}