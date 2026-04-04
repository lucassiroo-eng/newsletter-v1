import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import AnnualPlanPage from "@/pages/AnnualPlanPage";
import AgentsPage from "@/pages/AgentsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import SkillsPage from "@/pages/SkillsPage";
import ImportPage from "@/pages/ImportPage";
import PlanningPage from "@/pages/PlanningPage";
import ExportPage from "@/pages/ExportPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<AnnualPlanPage />} />
              <Route path="/agentes" element={<AgentsPage />} />
              <Route path="/campanas" element={<CampaignsPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/importar" element={<ImportPage />} />
              <Route path="/puzzle" element={<PlanningPage />} />
              <Route path="/exportar" element={<ExportPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
