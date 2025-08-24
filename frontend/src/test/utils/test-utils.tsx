/**
 * @fileoverview 測試工具函數
 * @description 提供包裝器和工具函數用於測試
 * @author AIOT Development Team
 * @version 1.0.0
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// 創建測試專用的 Redux store
const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      // 這裡添加你的 reducer
      // 如果沒有使用 Redux，可以提供一個簡單的 reducer
      test: (state = {}, action) => state
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// 創建測試專用的 QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 測試中不重試
        gcTime: 0, // 不緩存
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// 測試包裝器組件
interface AllTheProvidersProps {
  children: React.ReactNode;
  initialState?: any;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ children, initialState, queryClient }: AllTheProvidersProps) => {
  const store = createTestStore(initialState);
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  );
};

// 自定義渲染函數
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  queryClient?: QueryClient;
}

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialState, queryClient, ...renderOptions } = options || {};
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders initialState={initialState} queryClient={queryClient}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// 等待元素的工具函數
export const waitForElementToBeRemoved = async (callback: () => Element | null) => {
  return new Promise((resolve) => {
    const checkElement = () => {
      if (!callback()) {
        resolve(true);
      } else {
        setTimeout(checkElement, 10);
      }
    };
    checkElement();
  });
};

// 模擬用戶事件的工具函數
export const mockUserEvent = {
  click: (element: Element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },
  type: (element: HTMLInputElement, text: string) => {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  },
  submit: (form: HTMLFormElement) => {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
  },
};

// 模擬 localStorage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// 模擬 API 回應延遲
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 導出自定義渲染函數作為預設導出
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient, createTestStore };