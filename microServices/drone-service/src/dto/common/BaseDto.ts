/**
 * @fileoverview 基礎 DTO 類別
 * 
 * 提供所有 DTO 的基礎功能，包含驗證、轉換等通用邏輯。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Transform } from 'class-transformer';
import { IsOptional, IsDateString, IsString, IsNumber } from 'class-validator';

/**
 * 基礎 DTO 抽象類別
 * 
 * 提供所有 DTO 的共同屬性和方法
 */
export abstract class BaseDto {
    /**
     * 建立時間戳記轉換器
     * 確保日期格式正確
     */
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    protected transformDate(value: any): string | Date {
        return value;
    }
}

/**
 * 基礎請求 DTO
 * 
 * 用於所有請求相關的 DTO
 */
export abstract class BaseRequestDto extends BaseDto {
    // 可以添加通用的請求驗證邏輯
}

/**
 * 基礎回應 DTO
 * 
 * 用於所有回應相關的 DTO
 */
export abstract class BaseResponseDto extends BaseDto {
    @IsString()
    readonly id: string;

    @IsDateString()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    readonly createdAt: string;

    @IsOptional()
    @IsDateString()
    @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
    readonly updatedAt?: string;

    constructor(id: string, createdAt: Date, updatedAt?: Date) {
        super();
        this.id = id;
        this.createdAt = createdAt.toISOString();
        this.updatedAt = updatedAt?.toISOString();
    }
}