/**
 * @fileoverview 分頁相關 DTO
 * 
 * 統一管理所有分頁相關的資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { IsNumber, IsOptional, IsString, IsIn, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 分頁請求 DTO
 * 
 * 用於處理分頁查詢請求參數
 */
export class PaginationRequestDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Page must be a number' })
    @Min(1, { message: 'Page must be at least 1' })
    readonly page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'PageSize must be a number' })
    @Min(1, { message: 'PageSize must be at least 1' })
    @Max(100, { message: 'PageSize cannot exceed 100' })
    readonly pageSize?: number = 20;

    @IsOptional()
    @IsString()
    readonly sortBy?: string = 'last_seen';

    @IsOptional()
    @IsIn(['ASC', 'DESC'], { message: 'SortOrder must be ASC or DESC' })
    readonly sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @IsOptional()
    @IsString()
    readonly search?: string;

    /**
     * 計算偏移量
     */
    get offset(): number {
        return ((this.page || 1) - 1) * (this.pageSize || 20);
    }
}

/**
 * 分頁回應 DTO
 * 
 * 用於統一分頁回應格式
 */
export class PaginationResponseDto {
    @IsNumber()
    readonly currentPage: number;

    @IsNumber()
    readonly pageSize: number;

    @IsNumber()
    readonly totalCount: number;

    @IsNumber()
    readonly totalPages: number;

    readonly hasNext: boolean;

    readonly hasPrevious: boolean;

    constructor(
        currentPage: number,
        pageSize: number,
        totalCount: number
    ) {
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalCount = totalCount;
        this.totalPages = Math.ceil(totalCount / pageSize);
        this.hasNext = currentPage < this.totalPages;
        this.hasPrevious = currentPage > 1;
    }
}

/**
 * 分頁列表回應 DTO
 * 
 * 泛型類別，用於包裝分頁列表回應
 */
export class PaginatedListResponseDto<T> {
    readonly data: T[];
    readonly pagination: PaginationResponseDto;

    constructor(data: T[], pagination: PaginationResponseDto) {
        this.data = data;
        this.pagination = pagination;
    }

    /**
     * 從分頁資料創建回應 DTO
     */
    static create<T>(
        data: T[],
        currentPage: number,
        pageSize: number,
        totalCount: number
    ): PaginatedListResponseDto<T> {
        const pagination = new PaginationResponseDto(currentPage, pageSize, totalCount);
        return new PaginatedListResponseDto(data, pagination);
    }
}