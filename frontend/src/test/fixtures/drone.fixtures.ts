/**
 * @fileoverview 無人機相關測試數據固定裝置
 * @description 為無人機功能測試提供標準化的測試數據
 * @author AIOT Development Team
 * @version 1.0.0
 */

export const droneFixtures = {
  // 無人機狀態列表
  statusList: [
    {
      id: 'drone_001',
      name: 'AIOT-Drone-01',
      status: 'active',
      battery_level: 85,
      signal_strength: 95,
      altitude: 120.5,
      speed: 15.3,
      temperature: 25.2,
      humidity: 60,
      last_seen: new Date().toISOString(),
      created_at: '2024-08-01T00:00:00.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'drone_002',
      name: 'AIOT-Drone-02',
      status: 'charging',
      battery_level: 35,
      signal_strength: 88,
      altitude: 0,
      speed: 0,
      temperature: 23.8,
      humidity: 55,
      last_seen: new Date(Date.now() - 300000).toISOString(), // 5分鐘前
      created_at: '2024-08-01T00:00:00.000Z',
      updated_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'drone_003',
      name: 'AIOT-Drone-03',
      status: 'maintenance',
      battery_level: 0,
      signal_strength: 0,
      altitude: 0,
      speed: 0,
      temperature: 20.1,
      humidity: 50,
      last_seen: new Date(Date.now() - 3600000).toISOString(), // 1小時前
      created_at: '2024-08-01T00:00:00.000Z',
      updated_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],

  // 無人機位置列表
  positionList: [
    {
      id: 'pos_001',
      drone_id: 'drone_001',
      latitude: 25.0330,
      longitude: 121.5654,
      altitude: 120.5,
      heading: 45,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'pos_002',
      drone_id: 'drone_002',
      latitude: 25.0340,
      longitude: 121.5664,
      altitude: 0,
      heading: 0,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'pos_003',
      drone_id: 'drone_001',
      latitude: 25.0335,
      longitude: 121.5659,
      altitude: 115.2,
      heading: 90,
      timestamp: new Date(Date.now() - 60000).toISOString(), // 1分鐘前
      created_at: new Date(Date.now() - 60000).toISOString()
    }
  ],

  // 無人機命令列表
  commandList: [
    {
      id: 'cmd_001',
      drone_id: 'drone_001',
      command_type: 'takeoff',
      parameters: {},
      status: 'completed',
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30分鐘前
      updated_at: new Date(Date.now() - 1740000).toISOString(), // 29分鐘前
      executed_at: new Date(Date.now() - 1740000).toISOString()
    },
    {
      id: 'cmd_002',
      drone_id: 'drone_001',
      command_type: 'move_to',
      parameters: {
        latitude: 25.0330,
        longitude: 121.5654,
        altitude: 120
      },
      status: 'executing',
      created_at: new Date(Date.now() - 300000).toISOString(),
      updated_at: new Date().toISOString(),
      executed_at: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'cmd_003',
      drone_id: 'drone_002',
      command_type: 'land',
      parameters: {},
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      executed_at: null
    }
  ],

  // 新命令範本
  newCommandTemplate: {
    drone_id: 'drone_001',
    command_type: 'hover',
    parameters: {
      duration: 60
    }
  },

  // WebSocket 即時數據
  websocketData: {
    type: 'drone_update',
    data: {
      drone_id: 'drone_001',
      position: {
        latitude: 25.0331,
        longitude: 121.5655,
        altitude: 121.0
      },
      status: {
        battery_level: 84,
        signal_strength: 94,
        speed: 16.1
      },
      timestamp: new Date().toISOString()
    }
  }
};