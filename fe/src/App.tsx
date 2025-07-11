import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomeView } from "./views/HomeView";
import { TableViewer } from "./components/TableViewer";
import { HomeContent } from "components/HomeContent";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomeView />}>
                    <Route index element={<HomeContent />} />
                    <Route path="tableviewer" element={<TableViewer />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
