import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BookOpenText, Bell, CalendarDays, ClipboardList, Home, Menu, X, CheckSquare, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function ProfileAvatar({
  avatarUrl,
  initial,
  onProfile,
  onLogout,
}: {
  avatarUrl?: string | null;
  initial: string;
  onProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full overflow-hidden w-9 h-9 border-2 border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menu de perfil"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
              {initial}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onProfile} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      fetch("/api/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then((r) => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: () =>
      fetch("/api/reminders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then((r) => r.json()),
    staleTime: 1000 * 60 * 2,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeReminders = (reminders as any[]).filter((r: any) => {
    const from = r.remind_from ? new Date(r.remind_from + "T00:00:00") : null;
    const until = r.remind_until ? new Date(r.remind_until + "T00:00:00") : null;
    return from && until && today >= from && today <= until;
  }).length;

  const initial = (profile?.username ?? "U")[0].toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-20 items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src="/logo.svg"
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
              <span className="hidden lg:inline">Examenes</span>
            </NavLink>
            <NavLink to="/tareas" className={navLinkClass}>
              <ClipboardList className="h-4 w-4" />
              <span className="hidden lg:inline">Tareas</span>
            </NavLink>
            <NavLink to="/cosas-que-hacer" className={navLinkClass}>
              <CheckSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Actividades</span>
            </NavLink>
            <NavLink to="/recordatorios" className={navLinkClass}>
              <span className="relative">
                <Bell className="h-4 w-4" />
                {activeReminders > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                    {activeReminders}
                  </span>
                )}
              </span>
              <span className="hidden lg:inline">Recordatorios</span>
            </NavLink>
          </nav>

          {/* Profile avatar (desktop) */}
          <div className="hidden md:flex">
            <ProfileAvatar
              avatarUrl={profile?.avatar_url}
              initial={initial}
              onProfile={() => navigate("/perfil")}
              onLogout={handleLogout}
            />
          </div>

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
              {/* User card */}
              <div
                className="flex items-center gap-3 px-4 py-3 mb-1 cursor-pointer rounded-2xl hover:bg-muted transition-colors"
                onClick={() => { navigate("/perfil"); setMobileMenuOpen(false); }}
              >
                <div className="rounded-full overflow-hidden w-11 h-11 border-2 border-primary shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-base font-semibold text-primary-foreground">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">{profile?.username ?? "..."}</span>
                  <span className="text-xs text-muted-foreground truncate">{profile?.email ?? "Mi perfil"}</span>
                </div>
              </div>
              <div className="h-px bg-border mx-4 mb-1" />
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
                Examenes
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
                Actividades
              </NavLink>
              <NavLink
                to="/recordatorios"
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
                <span className="relative">
                  <Bell className="h-5 w-5" />
                  {activeReminders > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                      {activeReminders}
                    </span>
                  )}
                </span>
                Recordatorios
              </NavLink>
              <div className="h-px bg-border mx-4 mt-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-full px-4 py-3 text-base font-medium text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesion
              </button>
            </nav>
          </div>
        )}
      </header>
      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}
