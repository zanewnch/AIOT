import amqp from 'amqplib';

export interface RabbitMQConfig {
  url: string;
  exchanges: {
    DEVICE_EVENTS: string;
    DEVICE_DATA: string;
  };
  queues: {
    DEVICE_COMMANDS: string;
    DEVICE_EVENTS: string;
    DEVICE_DATA: string;
  };
  routingKeys: {
    DEVICE_OFFLINE: string;
    THRESHOLD_EXCEEDED: string;
    DEVICE_STATUS: string;
    SENSOR_DATA: string;
  };
}

export const getRabbitMQConfig = (): RabbitMQConfig => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchanges: {
    DEVICE_EVENTS: 'device.events',
    DEVICE_DATA: 'device.data',
  },
  queues: {
    DEVICE_COMMANDS: 'device.commands',
    DEVICE_EVENTS: 'device.events.queue',
    DEVICE_DATA: 'device.data.queue',
  },
  routingKeys: {
    DEVICE_OFFLINE: 'device.offline',
    THRESHOLD_EXCEEDED: 'threshold.exceeded',
    DEVICE_STATUS: 'device.status',
    SENSOR_DATA: 'sensor.data',
  }
});

export class RabbitMQManager {
  private connection: any = null;
  private channel: any = null;
  private config: RabbitMQConfig;

  constructor() {
    this.config = getRabbitMQConfig();
  }

  async connect(): Promise<any> {
    try {
      if (!this.connection) {
        this.connection = await amqp.connect(this.config.url);
        
        this.connection.on('error', (err: Error) => {
          console.error('❌ RabbitMQ connection error:', err);
          this.connection = null;
          this.channel = null;
        });
        
        this.connection.on('close', () => {
          console.log('🔌 RabbitMQ connection closed');
          this.connection = null;
          this.channel = null;
        });
      }
      
      if (!this.channel) {
        this.channel = await this.connection.createChannel();
        await this.setupTopology();
      }

      return this.channel;
    } catch (error) {
      console.error('❌ Failed to create RabbitMQ channel:', error);
      throw error;
    }
  }

  private async setupTopology(): Promise<void> {
    try {
      const { exchanges, queues } = this.config;

      await this.channel.assertExchange(exchanges.DEVICE_EVENTS, 'topic', { durable: true });
      await this.channel.assertExchange(exchanges.DEVICE_DATA, 'topic', { durable: true });
      
      await this.channel.assertQueue(queues.DEVICE_COMMANDS, { durable: true });
      await this.channel.assertQueue(queues.DEVICE_EVENTS, { durable: true });
      await this.channel.assertQueue(queues.DEVICE_DATA, { durable: true });
      
      await this.channel.bindQueue(queues.DEVICE_EVENTS, exchanges.DEVICE_EVENTS, '#');
      await this.channel.bindQueue(queues.DEVICE_DATA, exchanges.DEVICE_DATA, '#');
      
      console.log('✅ RabbitMQ topology setup completed');
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ topology:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  getChannel() {
    return this.channel;
  }
}