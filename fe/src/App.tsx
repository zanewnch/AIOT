import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Homepage } from "./pages/Homepage";
import { TableViewer } from "./components/HomeContent/TableViewer";
import { HomeContent } from "./components/HomeContent/HomeContent";
import SwaggerDocPage from "./pages/SwaggerDocPage";
import LoginPage from "./pages/LoginPage";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationContainer } from "./components/Notification/NotificationContainer";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <BrowserRouter>
                    <Routes>
                        {/* 公開路由 */}
                        <Route path="/login" element={<LoginPage />} />
                        
                        {/* 受保護的路由 */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Homepage />
                            </ProtectedRoute>
                        }>
                            <Route index element={<HomeContent />} />
                            <Route path="tableviewer" element={<TableViewer />} />
                            <Route path="api-docs" element={<SwaggerDocPage />} />
                        </Route>
                    </Routes>
                    <NotificationContainer />
                </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;
