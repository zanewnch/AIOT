import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomeView } from "./views/HomeView";
import { TableViewer } from "./components/TableViewer";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomeView />}>
                    <Route index element={<div>歡迎來到 IOT 系統</div>} />
                    <Route path="tableviewer" element={<TableViewer />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
