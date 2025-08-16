/**
 * @fileoverview 服務資訊控制器
 */

import type { Request, Response } from 'express';
import { config, availableServices, endpoints } from '../config/index.js';
import type { ServiceInfoResponse, ServicesListResponse } from '../types/index.js';

export class ServiceController {
  public static getInfo = (_req: Request, res: Response): void => {
    const serviceInfo: ServiceInfoResponse = {
      service: config.service.name,
      version: config.service.version,
      description: config.service.description,
      availableServices: Object.fromEntries(
        availableServices.map(service => [
          service.name.toLowerCase().replace(/\s+/g, '').replace('service', ''),
          service.path
        ])
      ),
      endpoints,
      timestamp: new Date().toISOString()
    };
    
    res.json(serviceInfo);
  };

  public static getServicesList = (_req: Request, res: Response): void => {
    const servicesResponse: ServicesListResponse = {
      services: availableServices,
      total: availableServices.length,
      timestamp: new Date().toISOString()
    };
    
    res.json(servicesResponse);
  };
}