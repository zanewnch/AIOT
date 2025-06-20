import { Device, DeviceType, DeviceStatus } from '../src/models/Device';

describe('Device Type Definitions', () => {
  test('DeviceType should have correct allowed values', () => {
    const validTypes: DeviceType[] = ['sensor', 'controller', 'actuator'];
    const invalidType: any = 'invalid';

    validTypes.forEach(type => {
      expect(type).toMatch(/^(sensor|controller|actuator)$/);
    });

    expect(() => invalidType as DeviceType).toThrowError(); // 類型檢查測試
  });
});

describe('Device Interface Validation', () => {
  const mockDevice: Device = {
    id: 'd-123',
    name: '溫度感測器',
    type: 'sensor',
    status: 'online',
    location: '會議室A',
    metadata: { unit: '°C' },
    lastSeen: new Date()
  };

  test('should require mandatory fields', () => {
    expect(mockDevice).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
      status: expect.any(String)
    });
  });

  test('should validate optional fields when present', () => {
    expect(mockDevice.location).toBe('會議室A');
    expect(mockDevice.metadata).toHaveProperty('unit');
    expect(mockDevice.lastSeen).toBeInstanceOf(Date);
  });

  test('should reject invalid status values', () => {
    const invalidStatus: any = 'disconnected';
    expect(() => invalidStatus as DeviceStatus).toThrowError();
  });
});

// 邊界條件測試
describe('Edge Cases', () => {
  test('should handle minimum valid device data', () => {
    const minimalDevice: Device = {
      id: 'd-124',
      name: '簡易控制器',
      type: 'controller',
      status: 'offline'
    };

    expect(minimalDevice).toBeDefined();
  });
});