import { Request, Response, Router } from 'express';
import { DeviceCommandService, DeviceEventService, DeviceDataService } from '../service/index.js';

export class DeviceController {
  public router: Router;
  private commandService: DeviceCommandService;
  private eventService: DeviceEventService;
  private dataService: DeviceDataService;

  constructor(
    commandService: DeviceCommandService,
    eventService: DeviceEventService,
    dataService: DeviceDataService
  ) {
    this.router = Router();
    this.commandService = commandService;
    this.eventService = eventService;
    this.dataService = dataService;
    this.setupRoutes();
  }

  static async create(): Promise<DeviceController> {
    const commandService = await DeviceCommandService.create();
    const eventService = await DeviceEventService.create();
    const dataService = await DeviceDataService.create();
    
    return new DeviceController(commandService, eventService, dataService);
  }

  private setupRoutes(): void {
    // 設備控制指令路由
    this.router.post('/devices/:deviceId/commands/turn-on', this.turnOnDevice.bind(this));
    this.router.post('/devices/:deviceId/commands/turn-off', this.turnOffDevice.bind(this));
    this.router.post('/devices/:deviceId/commands/set-parameter', this.setParameter.bind(this));
    
    // 設備事件路由
    this.router.post('/devices/:deviceId/events/offline', this.reportDeviceOffline.bind(this));
    this.router.post('/devices/:deviceId/events/threshold-exceeded', this.reportThresholdExceeded.bind(this));
    
    // 設備數據路由
    this.router.post('/devices/:deviceId/data', this.submitDeviceData.bind(this));
    this.router.post('/devices/:deviceId/data/temperature', this.submitTemperatureData.bind(this));
    this.router.post('/devices/:deviceId/data/motion', this.submitMotionData.bind(this));
    this.router.post('/devices/:deviceId/data/energy', this.submitEnergyData.bind(this));
  }

  // 設備控制指令端點
  private async turnOnDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { priority = 'normal' } = req.body;
      
      await this.commandService.sendTurnOnCommand(deviceId, priority);
      
      res.status(200).json({
        success: true,
        message: `Turn on command sent to device ${deviceId}`,
        data: { deviceId, command: 'turn_on', priority }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send turn on command',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async turnOffDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { priority = 'normal' } = req.body;
      
      await this.commandService.sendTurnOffCommand(deviceId, priority);
      
      res.status(200).json({
        success: true,
        message: `Turn off command sent to device ${deviceId}`,
        data: { deviceId, command: 'turn_off', priority }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send turn off command',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async setParameter(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { key, value, priority = 'normal' } = req.body;
      
      if (!key || value === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters: key and value'
        });
        return;
      }
      
      await this.commandService.sendSetParameterCommand(deviceId, key, value, priority);
      
      res.status(200).json({
        success: true,
        message: `Set parameter command sent to device ${deviceId}`,
        data: { deviceId, command: 'set_param', key, value, priority }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send set parameter command',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 設備事件端點
  private async reportDeviceOffline(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { lastSeen } = req.body;
      
      const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date();
      
      await this.eventService.publishDeviceOfflineEvent(deviceId, lastSeenDate);
      
      res.status(200).json({
        success: true,
        message: `Device offline event published for device ${deviceId}`,
        data: { deviceId, lastSeen: lastSeenDate }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish device offline event',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async reportThresholdExceeded(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { metric, value, threshold, severity = 'warning' } = req.body;
      
      if (!metric || value === undefined || threshold === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters: metric, value, and threshold'
        });
        return;
      }
      
      await this.eventService.publishThresholdExceededEvent(deviceId, metric, value, threshold, severity);
      
      res.status(200).json({
        success: true,
        message: `Threshold exceeded event published for device ${deviceId}`,
        data: { deviceId, metric, value, threshold, severity }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish threshold exceeded event',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 設備數據端點
  private async submitDeviceData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { data, source = 'hardware' } = req.body;
      
      if (!data || typeof data !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Invalid data format'
        });
        return;
      }
      
      await this.dataService.publishSensorData(deviceId, data, source);
      
      res.status(200).json({
        success: true,
        message: `Device data published for device ${deviceId}`,
        data: { deviceId, data, source }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish device data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async submitTemperatureData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { temperature, humidity, source = 'hardware' } = req.body;
      
      if (temperature === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: temperature'
        });
        return;
      }
      
      await this.dataService.publishTemperatureData(deviceId, temperature, humidity, source);
      
      res.status(200).json({
        success: true,
        message: `Temperature data published for device ${deviceId}`,
        data: { deviceId, temperature, humidity, source }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish temperature data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async submitMotionData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { motion, source = 'hardware' } = req.body;
      
      if (motion === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: motion'
        });
        return;
      }
      
      await this.dataService.publishMotionData(deviceId, motion, source);
      
      res.status(200).json({
        success: true,
        message: `Motion data published for device ${deviceId}`,
        data: { deviceId, motion, source }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish motion data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async submitEnergyData(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { power, voltage, current, source = 'hardware' } = req.body;
      
      if (power === undefined) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: power'
        });
        return;
      }
      
      await this.dataService.publishEnergyData(deviceId, power, voltage, current, source);
      
      res.status(200).json({
        success: true,
        message: `Energy data published for device ${deviceId}`,
        data: { deviceId, power, voltage, current, source }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish energy data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}