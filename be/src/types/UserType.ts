/**
 * 使用者類型定義
 * 
 * 定義使用者資料的基本結構和屬性，用於類型安全的使用者資料處理。
 * 包含使用者的基本資訊和時間戳記欄位。
 * 
 * @module Types
 */

export type UserType = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}