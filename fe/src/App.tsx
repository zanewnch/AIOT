import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Homepage } from "./pages/Homepage";
import { TableViewer } from "./components/HomeContent/TableViewer";
import { HomeContent } from "./components/HomeContent/HomeContent";
import SwaggerDocPage from "./pages/SwaggerDocPage";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationContainer } from "./components/Notification/NotificationContainer";

function App() {
    return (
        <NotificationProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Homepage />}>
                        <Route index element={<HomeContent />} />
                        <Route path="tableviewer" element={<TableViewer />} />
                        <Route path="api-docs" element={<SwaggerDocPage />} />
                    </Route>
                </Routes>
                <NotificationContainer />
            </BrowserRouter>
        </NotificationProvider>
    );
}

export default App;
