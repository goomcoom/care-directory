import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { FindPage } from "./pages/FindPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { ProviderPage } from "./pages/ProviderPage";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/find" element={<FindPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/directory/:providerId" element={<ProviderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
