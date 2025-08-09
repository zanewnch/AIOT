/**
 * @fileoverview Redis 配置模組
 * 
 * 提供 Redis 連線配置和管理功能
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { createClient, RedisClientType } from 'redis';

/**
 * Redis 配置管理類別
 */
class RedisConfig {
    private client: RedisClientType | null = null;

    /**
     * 建立 Redis 連線
     */
    async connect(): Promise<void> {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        this.client = createClient({
            url: redisUrl
        });

        this.client.on('error', (err) => {
            console.error('❌ Redis Client Error', err);
        });

        this.client.on('connect', () => {
            console.log('🔗 Redis connected successfully');
        });

        await this.client.connect();
    }

    /**
     * 斷開 Redis 連線
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }

    /**
     * 獲取 Redis 客戶端實例
     */
    getClient(): RedisClientType | null {
        return this.client;
    }

    /**
     * 檢查連線狀態
     */
    isConnected(): boolean {
        return this.client?.isOpen || false;
    }
}

export const redisConfig = new RedisConfig();