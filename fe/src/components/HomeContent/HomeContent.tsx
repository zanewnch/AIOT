/**
 * @fileoverview 首頁主要內容組件
 * 
 * 此組件提供了應用程式的主要功能入口點，包括：
 * - API 文檔連結
 * - 其他主要功能導航
 * 
 * @author AI-IOT Development Team
 * @version 1.0.0
 */

import { Link } from 'react-router-dom'; // React Router 路由連結組件


/**
 * 首頁主要內容組件
 * 
 * 提供應用程式的主要導航和功能入口點
 * 
 * @returns {JSX.Element} 首頁內容組件
 */
export const HomeContent = () => {

    return (
        <div className="p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">歡迎使用 AI-IOT 系統</h1>
                <p className="text-lg text-gray-600 mb-8">選擇下方功能進行系統管理和配置</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">系統初始化</h2>
                    <p className="text-gray-600 mb-4">初始化系統組件、創建管理員用戶等</p>
                    <Link
                        to="/init"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        前往初始化頁面
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">API 文檔</h2>
                    <p className="text-gray-600 mb-4">查看完整的 API 文檔和使用說明</p>
                    <Link
                        to="/api-docs"
                        className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                        📚 查看 API 文檔
                    </Link>
                </div>
            </div>
        </div>
    );
}