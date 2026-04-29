import { ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpenText, CalendarDays, ClipboardList, Home, Menu, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-20 items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Camila's Organization"
              className="h-14 w-auto object-contain"
            />
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={navLinkClass}>
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline">Inicio</span>
            </NavLink>
            <NavLink to="/asignaturas" className={navLinkClass}>
              <BookOpenText className="h-4 w-4" />
              <span className="hidden lg:inline">Asignaturas</span>
            </NavLink>
            <NavLink to="/examenes" className={navLinkClass}>
              <CalendarDays className="h-4 w-4" />
              <span className="hidden lg:inline">Exámenes</span>
            </NavLink>
            <NavLink to="/tareas" className={navLinkClass}>
              <ClipboardList className="h-4 w-4" />
              <span className="hidden lg:inline">Tareas</span>
            </NavLink>
            <NavLink to="/cosas-que-hacer" className={navLinkClass}>
              <CheckSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Cosas</span>
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t bg-background/95 backdrop-blur md:hidden">
            <nav className="container flex flex-col gap-1 py-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                Inicio
              </NavLink>
              <NavLink
                to="/asignaturas"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpenText className="h-5 w-5" />
                Asignaturas
              </NavLink>
              <NavLink
                to="/examenes"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <CalendarDays className="h-5 w-5" />
                Exámenes
              </NavLink>
              <NavLink
                to="/tareas"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <ClipboardList className="h-5 w-5" />
                Tareas
              </NavLink>
              <NavLink
                to="/cosas-que-hacer"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <CheckSquare className="h-5 w-5" />
                Cosas Que Hacer
              </NavLink>
            </nav>
          </div>
        )}
      </header>
      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}
