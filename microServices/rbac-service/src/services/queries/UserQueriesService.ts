/**
 * @fileoverview 用戶查詢 Service 實現
 *
 * 此文件實作了用戶查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module UserQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { UserQueriesRepository } from '../../repositories/queries/UserQueriesRepository.js';
import { TYPES } from '../../container/types.js';
import { UserModel } from '../../models/UserModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { LoggerDecorator } from 'aiot-shared-packages';
import { PaginationRequestDto, PaginatedResult } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import {
    UserResponseDto,
    UserListResponseDto,
    UserStatisticsResponseDto
} from '../../dto/index.js';

const logger = createLogger('UserQueriesService');


/**
 * 用戶查詢 Service 實現類別
 *
 * 專門處理用戶相關的查詢請求，包含取得用戶資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class UserQueriesService
 * @since 1.0.0
 */
@injectable()
export class UserQueriesService {
    private userRepositorysitory: UserQueriesRepositorysitory;

    constructor(
        @inject(TYPES.UserQueriesRepositorysitory) userRepositorysitory: UserQueriesRepositorysitory
    ) {
        this.userRepositorysitory = userRepositorysitory;
    }

    /**
     * 分頁查詢所有用戶（新增統一方法）
     */
    getAllUsersPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有用戶', { pagination });

            const result = await this.userRepositorysitory.getAllUsersPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個用戶，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢用戶失敗', { error });
            throw error;
        }
    };

    /**
     * 根據角色分頁查詢用戶（新增統一方法）
     */
    getUsersByRolePaginated = async (
        roleId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據角色分頁查詢用戶', { roleId, pagination });

            const result = await this.userRepositorysitory.getUsersByRolePaginated(roleId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserResponse(result);

            logger.info(`成功獲取角色 ${roleId} 的用戶 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據角色分頁查詢用戶失敗', { error, roleId });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢用戶（新增統一方法）
     */
    getUsersByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢用戶', { status, pagination });

            const result = await this.userRepositorysitory.getUsersByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserResponse(result);

            logger.info(`成功獲取狀態為 ${status} 的用戶 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢用戶失敗', { error, status });
            throw error;
        }
    };

    /**
     * 根據權限分頁查詢用戶（新增統一方法）
     */
    getUsersByPermissionPaginated = async (
        permissionId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據權限分頁查詢用戶', { permissionId, pagination });

            const result = await this.userRepositorysitory.getUsersByPermissionPaginated(permissionId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserResponse(result);

            logger.info(`成功獲取權限 ${permissionId} 的用戶 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據權限分頁查詢用戶失敗', { error, permissionId });
            throw error;
        }
    };

    /**
     * 根據電子郵件驗證狀態分頁查詢用戶（新增統一方法）
     */
    getUsersByVerificationPaginated = async (
        isVerified: boolean,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據電子郵件驗證狀態分頁查詢用戶', { isVerified, pagination });

            const result = await this.userRepositorysitory.getUsersByVerificationPaginated(isVerified, pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserResponse(result);

            logger.info(`成功獲取驗證狀態為 ${isVerified} 的用戶 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據電子郵件驗證狀態分頁查詢用戶失敗', { error, isVerified });
            throw error;
        }
    };

    /**
     * 獲取所有使用者
     */
    getUsers = async (): Promise<UserResponseDto[]> => {
        try {
            const users = await this.userQueriesRepositorysitory.findAll();
            return DtoMapper.toUserResponseDtoArray(users);
        } catch (error) {
            logger.error('獲取所有使用者失敗', { error });
            throw error;
        }
    };

    /**
     * 根據ID獲取使用者
     */
    getUserById = async (id: string): Promise<UserResponseDto | null> => {
        try {
            const user = await this.userQueriesRepositorysitory.findById(id);
            if (!user) {
                return null;
            }
            return DtoMapper.toUserResponseDto(user);
        } catch (error) {
            logger.error('根據ID獲取使用者失敗', { error, id });
            throw error;
        }
    };
}