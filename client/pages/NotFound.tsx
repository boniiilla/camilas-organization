import { useLocation } from "react-router-dom";
import { useEffect } from "react";

import AppLayout from "@/components/AppLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="py-24 text-center">
        <h1 className="text-5xl font-normal mb-2 text-foreground">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Página no encontrada</p>
        <a href="/" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground shadow transition-colors hover:bg-primary/90">
          Volver al inicio
        </a>
      </div>
    </AppLayout>
  );
};

export default NotFound;
