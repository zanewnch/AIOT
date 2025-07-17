/**
 * Express 型別擴展
 * 擴展 Express User 介面，添加使用者資訊
 */
declare global {
    namespace Express {
        interface User {
            id: number;
            username: string;
        }
    }
}

export {};