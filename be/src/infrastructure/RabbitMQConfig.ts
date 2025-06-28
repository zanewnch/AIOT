import amqplib, { Channel } from 'amqplib';
import 'dotenv/config';

const url = process.env.RABBITMQ_URL;
if (!url) throw new Error('RABBITMQ_URL is not defined');

export async function createRabbitChannel(): Promise<Channel> {
  const conn = await amqplib.connect(url);
  const channel = await conn.createChannel();
  return channel;
}
