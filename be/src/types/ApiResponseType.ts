// API response type definitions

export type ApiResponseType<T = any> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}