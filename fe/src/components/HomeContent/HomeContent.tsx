/**
 * @fileoverview 首頁主要內容組件
 * 
 * 此組件提供了應用程式的主要功能入口點，包括：
 * - RBAC 權限管理系統示例初始化
 * - Redux Toolkit 示例數據初始化
 * - 管理員用戶創建功能
 * - 壓力測試數據生成（附帶進度追蹤）
 * - API 文檔連結
 * 
 * 組件使用了自定義 Hook 來管理進度追蹤和 SSE 連接，
 * 並通過 InitService 與後端 API 進行交互。
 * 
 * @author AI-IOT Development Team
 * @version 1.0.0
 */

import { useState } from 'react' // React 狀態管理 Hook
import { Button } from '../Button' // 自定義按鈕組件
import { Link } from 'react-router-dom'; // React Router 路由連結組件
import { InitService } from '../../services/InitService'; // 初始化服務類
import { useProgressTracking } from '../../hooks/useProgressTracking'; // 進度追蹤自定義 Hook
import { ProgressTracker } from '../ProgressTracker/ProgressTracker'; // 進度追蹤組件

/**
 * 載入狀態介面定義
 * 用於管理各個功能按鈕的載入狀態
 */
interface LoadingStates {
  /** RBAC 示例初始化載入狀態 */
  rbac: boolean;
  /** RTK 示例初始化載入狀態 */
  rtk: boolean;
  /** 管理員用戶創建載入狀態 */
  admin: boolean;
  /** 壓力測試數據生成載入狀態 */
  stress: boolean;
}

/**
 * 首頁主要內容組件
 * 
 * 這是應用程式的核心功能面板，提供了多個系統初始化和管理功能。
 * 每個功能都具有獨立的載入狀態管理和錯誤處理機制。
 * 
 * @returns {JSX.Element} 首頁內容組件
 * 
 * @example
 * ```tsx
 * import { HomeContent } from './HomeContent';
 * 
 * function App() {
 *   return (
 *     <div className="app">
 *       <HomeContent />
 *     </div>
 *   );
 * }
 * ```
 */
export const HomeContent = () => {
    // 狀態管理：各個功能按鈕的載入狀態
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
        rbac: false,   // RBAC 示例初始化載入狀態
        rtk: false,    // RTK 示例初始化載入狀態
        admin: false,  // 管理員用戶創建載入狀態
        stress: false  // 壓力測試數據生成載入狀態
    });
    
    // 狀態管理：各個功能的消息顯示
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    
    // 使用自定義 Hook 進行進度追蹤（用於 SSE 連接）
    const { progress, isTracking, error, startTracking, stopTracking } = useProgressTracking();

    /**
     * 更新載入狀態的輔助函數
     * 
     * @param key - 載入狀態的鍵名
     * @param loading - 是否正在載入
     */
    const updateLoadingState = (key: string, loading: boolean) => {
        setLoadingStates(prev => ({ ...prev, [key]: loading }));
    };

    /**
     * 更新消息顯示的輔助函數
     * 
     * @param key - 消息的鍵名
     * @param message - 要顯示的消息內容
     */
    const updateMessage = (key: string, message: string) => {
        setMessages(prev => ({ ...prev, [key]: message }));
    };

    /**
     * 處理 RBAC 示例初始化
     * 
     * 此函數負責初始化 RBAC（Role-Based Access Control）權限管理系統的示例數據，
     * 包括創建角色、權限和用戶關聯等基礎數據。
     * 
     * @async
     * @function
     * @returns {Promise<void>} 無返回值的異步函數
     */
    const handleRbacDemo = async () => {
        updateLoadingState('rbac', true);  // 設置載入狀態為 true
        updateMessage('rbac', '');         // 清空之前的消息

        try {
            // 調用初始化服務進行 RBAC 示例數據初始化
            const result = await InitService.initRbacDemo();
            
            if (result.ok) {
                // 初始化成功，顯示成功消息
                updateMessage('rbac', '✅ RBAC demo data initialized successfully!');
            } else {
                // 初始化失敗，顯示警告消息
                updateMessage('rbac', '⚠️ RBAC initialization failed. Check console for details.');
            }
        } catch (error) {
            // 捕獲異常，記錄錯誤並顯示錯誤消息
            console.error('RBAC initialization error:', error);
            updateMessage('rbac', `❌ RBAC initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // 無論成功失敗，都要重置載入狀態
            updateLoadingState('rbac', false);
        }
    };

    /**
     * 處理 Redux Toolkit 示例初始化
     * 
     * 此函數負責初始化 Redux Toolkit 的示例數據，
     * 包括創建 store、actions、reducers 等相關的演示數據。
     * 
     * @async
     * @function
     * @returns {Promise<void>} 無返回值的異步函數
     */
    const handleRtkDemo = async () => {
        updateLoadingState('rtk', true);  // 設置載入狀態為 true
        updateMessage('rtk', '');         // 清空之前的消息

        try {
            // 調用初始化服務進行 RTK 示例數據初始化
            const result = await InitService.initRtkDemo();
            
            if (result.ok) {
                // 初始化成功，顯示成功消息
                updateMessage('rtk', '✅ RTK demo data initialized successfully!');
            } else {
                // 初始化失敗，顯示警告消息
                updateMessage('rtk', '⚠️ RTK initialization failed. Check console for details.');
            }
        } catch (error) {
            // 捕獲異常，記錄錯誤並顯示錯誤消息
            console.error('RTK initialization error:', error);
            updateMessage('rtk', `❌ RTK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // 無論成功失敗，都要重置載入狀態
            updateLoadingState('rtk', false);
        }
    };

    /**
     * 處理管理員用戶創建
     * 
     * 此函數負責創建系統管理員用戶，包括設定管理員權限和初始配置。
     * 這是系統初始化的重要步驟之一。
     * 
     * @async
     * @function
     * @returns {Promise<void>} 無返回值的異步函數
     */
    const handleCreateAdminUser = async () => {
        updateLoadingState('admin', true);  // 設置載入狀態為 true
        updateMessage('admin', '');         // 清空之前的消息

        try {
            // 調用初始化服務創建管理員用戶
            const result = await InitService.createAdminUser();
            
            if (result.ok) {
                // 創建成功，顯示成功消息
                updateMessage('admin', '✅ Admin user created successfully!');
            } else {
                // 創建失敗，顯示警告消息
                updateMessage('admin', '⚠️ Admin user creation failed. Check console for details.');
            }
        } catch (error) {
            // 捕獲異常，記錄錯誤並顯示錯誤消息
            console.error('Admin user creation error:', error);
            updateMessage('admin', `❌ Admin user creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // 無論成功失敗，都要重置載入狀態
            updateLoadingState('admin', false);
        }
    };

    /**
     * 處理壓力測試數據創建
     * 
     * 此函數負責創建大量測試數據以進行系統壓力測試。
     * 由於此操作可能耗時較長，因此使用了 SSE（Server-Sent Events）
     * 來實時追蹤進度。
     * 
     * @async
     * @function
     * @returns {Promise<void>} 無返回值的異步函數
     */
    const handleStressTestData = async () => {
        updateLoadingState('stress', true);  // 設置載入狀態為 true
        updateMessage('stress', '');         // 清空之前的消息

        try {
            // 調用初始化服務創建壓力測試數據
            const result = await InitService.createStressTestData();
            
            if (result.ok) {
                // 創建任務成功，顯示任務 ID 並開始進度追蹤
                updateMessage('stress', `✅ Stress test data creation started! Task ID: ${result.taskId}`);
                // 開始 SSE 進度追蹤
                startTracking(result.taskId);
            } else {
                // 創建任務失敗，顯示警告消息
                updateMessage('stress', '⚠️ Stress test data creation failed. Check console for details.');
            }
        } catch (error) {
            // 捕獲異常，記錄錯誤並顯示錯誤消息
            console.error('Stress test data creation error:', error);
            updateMessage('stress', `❌ Stress test data creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // 無論成功失敗，都要重置載入狀態
            updateLoadingState('stress', false);
        }
    };

    /**
     * 渲染消息組件
     * 
     * 根據消息內容的類型（成功、警告、錯誤）來渲染不同樣式的消息框。
     * 使用 emoji 圖標來區分消息類型。
     * 
     * @param key - 消息的鍵名
     * @returns {JSX.Element | null} 消息組件或 null
     */
    const renderMessage = (key: string) => {
        const message = messages[key];  // 獲取對應鍵名的消息
        if (!message) return null;      // 如果沒有消息則返回 null

        // 根據消息內容判斷消息類型並返回相應的樣式
        return (
            <div className={`text-sm p-2 rounded mt-2 ${
                message.includes('✅') ? 'text-green-700 bg-green-100' :  // 成功消息：綠色
                message.includes('⚠️') ? 'text-yellow-700 bg-yellow-100' : // 警告消息：黃色
                'text-red-700 bg-red-100'                                   // 錯誤消息：紅色
            }`}>
                {message}
            </div>
        );
    };

    // 主要的 JSX 渲染邏輯
    return (
        <div className="p-6 space-y-6">
            {/* 功能按鈕網格佈局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RBAC 示例初始化按鈕區域 */}
                <div className="space-y-2">
                    <Button
                        onClick={handleRbacDemo}           // 點擊時執行 RBAC 初始化
                        disabled={loadingStates.rbac}     // 載入時禁用按鈕
                        className="w-full"                // 全寬度樣式
                    >
                        {loadingStates.rbac ? 'Initializing...' : 'Initialize RBAC Demo'}
                    </Button>
                    {renderMessage('rbac')}              {/* 渲染 RBAC 相關消息 */}
                </div>

                {/* RTK 示例初始化按鈕區域 */}
                <div className="space-y-2">
                    <Button
                        onClick={handleRtkDemo}            // 點擊時執行 RTK 初始化
                        disabled={loadingStates.rtk}      // 載入時禁用按鈕
                        className="w-full"                // 全寬度樣式
                    >
                        {loadingStates.rtk ? 'Initializing...' : 'Initialize RTK Demo'}
                    </Button>
                    {renderMessage('rtk')}               {/* 渲染 RTK 相關消息 */}
                </div>

                {/* 管理員用戶創建按鈕區域 */}
                <div className="space-y-2">
                    <Button
                        onClick={handleCreateAdminUser}    // 點擊時創建管理員用戶
                        disabled={loadingStates.admin}    // 載入時禁用按鈕
                        className="w-full"                // 全寬度樣式
                    >
                        {loadingStates.admin ? 'Creating...' : 'Create Admin User'}
                    </Button>
                    {renderMessage('admin')}             {/* 渲染管理員創建相關消息 */}
                </div>

                {/* 壓力測試數據生成按鈕區域 */}
                <div className="space-y-2">
                    <Button
                        onClick={handleStressTestData}     // 點擊時創建壓力測試數據
                        disabled={loadingStates.stress || isTracking}  // 載入或進度追蹤時禁用
                        className="w-full"                 // 全寬度樣式
                    >
                        {loadingStates.stress ? 'Starting...' : 
                         isTracking ? 'Tracking Progress...' : 
                         'Create Stress Test Data'}
                    </Button>
                    {renderMessage('stress')}            {/* 渲染壓力測試相關消息 */}
                </div>
            </div>

            {/* SSE 進度追蹤組件 */}
            <ProgressTracker
                progress={progress}        // 進度數據
                isTracking={isTracking}    // 是否正在追蹤
                error={error}              // 錯誤信息
                onCancel={stopTracking}    // 取消追蹤的回調函數
            />

            {/* API 文檔連結 */}
            <div>
                <Link
                    to="/api-docs"
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    📚 View API Documentation
                </Link>
            </div>
        </div>
    );
}