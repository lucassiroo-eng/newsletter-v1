import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AgentsPage } from "./pages/AgentsPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { AnnualPlanPage } from "./pages/AnnualPlanPage";
import { PuzzlePage } from "./pages/PuzzlePage";
import { ImportPage } from "./pages/ImportPage";
import { ExportPage } from "./pages/ExportPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/plan-anual" replace />} />
          <Route path="/agentes" element={<AgentsPage />} />
          <Route path="/campanas" element={<CampaignsPage />} />
          <Route path="/plan-anual" element={<AnnualPlanPage />} />
          <Route path="/puzzle" element={<PuzzlePage />} />
          <Route path="/importar" element={<ImportPage />} />
          <Route path="/exportar" element={<ExportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
