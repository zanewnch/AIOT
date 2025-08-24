/**
 * @fileoverview React Query 配置
 * 
 * 配置 React Query 的全局設置，包括查詢客戶端配置、
 * 錯誤處理、重試策略和開發工具。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * React Query 客戶端配置
 * 
 * 設置全局的查詢行為，包括默認的重試策略、
 * 緩存時間和錯誤處理。
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5分鐘內數據保持新鮮，不會重新獲取
      staleTime: 5 * 60 * 1000,
      // 數據在內存中緩存10分鐘
      gcTime: 10 * 60 * 1000,
      // 失敗時重試次數
      retry: (failureCount, error) => {
        // 對於 4xx 錯誤不重試（客戶端錯誤）
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // 最多重試3次
        return failureCount < 3;
      },
      // 重試延遲策略（指數退避）
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口重新聚焦時不自動重新獲取
      refetchOnWindowFocus: false,
      // 網絡重連時重新獲取
      refetchOnReconnect: true,
      // 組件重新掛載時不自動重新獲取
      refetchOnMount: true,
    },
    mutations: {
      // Mutation 失敗時重試次數
      retry: 1,
      // Mutation 重試延遲
      retryDelay: 1000,
    },
  },
});

/**
 * Query Provider 組件屬性
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider 組件
 * 
 * 為整個應用提供 React Query 功能，包括數據獲取、
 * 緩存管理和開發工具支持。
 * 
 * @param props - 組件屬性
 * @returns JSX 元素
 * 
 * @example
 * ```tsx
 * import { QueryProvider } from './configs/queryConfig';
 * 
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <Router>
 *         <Routes>
 *           <Route path="/" element={<Home />} />
 *         </Routes>
 *       </Router>
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 開發環境下顯示 React Query DevTools */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

/**
 * 導出查詢客戶端實例
 * 用於在組件外部直接操作查詢緩存
 */
export { queryClient };