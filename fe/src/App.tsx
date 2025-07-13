import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Homepage } from "./pages/Homepage";
import { TableViewer } from "./components/HomeContent/TableViewer";
import { HomeContent } from "./components/HomeContent/HomeContent";
import SwaggerDocPage from "./pages/SwaggerDocPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Homepage />}>
                    <Route index element={<HomeContent />} />
                    <Route path="tableviewer" element={<TableViewer />} />
                    <Route path="api-docs" element={<SwaggerDocPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
