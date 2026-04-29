import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Asignaturas from "./pages/Asignaturas";
import Examenes from "./pages/Examenes";
import Tareas from "./pages/Tareas";
import Calendario from "./pages/Calendario";
import CosasQuHacer from "./pages/CosasQuHacer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/asignaturas" element={<Asignaturas />} />
          <Route path="/examenes" element={<Examenes />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/cosas-que-hacer" element={<CosasQuHacer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
