import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Asignaturas from "./pages/Asignaturas";
import Examenes from "./pages/Examenes";
import Tareas from "./pages/Tareas";
import Calendario from "./pages/Calendario";
import CosasQuHacer from "./pages/CosasQuHacer";
import Login from "./pages/Login";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
          <Route path="/asignaturas" element={<PrivateRoute><Asignaturas /></PrivateRoute>} />
          <Route path="/examenes" element={<PrivateRoute><Examenes /></PrivateRoute>} />
          <Route path="/tareas" element={<PrivateRoute><Tareas /></PrivateRoute>} />
          <Route path="/calendario" element={<PrivateRoute><Calendario /></PrivateRoute>} />
          <Route path="/cosas-que-hacer" element={<PrivateRoute><CosasQuHacer /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
