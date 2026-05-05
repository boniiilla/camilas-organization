import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Bell, BellOff, Lock, User } from "lucide-react";

const API = (path: string, opts?: RequestInit) => {
  const token = localStorage.getItem("token");
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts?.headers },
  });
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function Perfil() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => API("/api/profile").then((r) => r.json()),
  });

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [notifState, setNotifState] = useState<"idle" | "loading" | "active">("idle");

  const displayUsername = username || profile?.username || "";
  const displayEmail = email || profile?.email || "";
  const displayAvatar = avatarPreview ?? profile?.avatar_url ?? null;

  const initial = (profile?.username ?? "U")[0].toUpperCase();

  const saveProfile = useMutation({
    mutationFn: () =>
      API("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          username: username || undefined,
          email: email || undefined,
          ...(avatarPreview !== null && { avatar_url: avatarPreview }),
        }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      qc.setQueryData(["profile"], data);
      setUsername("");
      setEmail("");
      setAvatarPreview(null);
      toast({ title: "Perfil actualizado" });
    },
  });

  const savePassword = useMutation({
    mutationFn: () =>
      API("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      toast({ title: "Contrasena actualizada" });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        setAvatarPreview(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = () => {
    if (newPwd !== confirmPwd) {
      toast({ title: "Error", description: "Las contrasenas no coinciden", variant: "destructive" });
      return;
    }
    savePassword.mutate();
  };

  const handleEnableNotifications = async () => {
    setNotifState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Permiso denegado", description: "Activa las notificaciones en ajustes del navegador", variant: "destructive" });
        setNotifState("idle");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await API("/api/push/vapid-public-key").then((r) => r.json());

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      await API("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setNotifState("active");
      toast({ title: "Notificaciones activadas" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron activar las notificaciones", variant: "destructive" });
      setNotifState("idle");
    }
  };

  const handleTestNotification = async () => {
    const res = await API("/api/push/test", { method: "POST" }).then((r) => r.json());
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Notificacion enviada" });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-8">
        <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-foreground">Mi perfil</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group"
            aria-label="Cambiar foto"
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-3xl font-semibold text-primary-foreground border-2 border-primary">
                {initial}
              </div>
            )}
            <span className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="text-sm text-muted-foreground">Toca para cambiar foto</p>
        </div>

        {/* Info */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
            <User className="w-4 h-4" /> Informacion de cuenta
          </div>
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Input
              value={displayUsername}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={profile?.username}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={displayEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <Button
            onClick={() => saveProfile.mutate()}
            disabled={saveProfile.isPending}
            className="w-full"
          >
            {saveProfile.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>

        {/* Password */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
            <Lock className="w-4 h-4" /> Cambiar contrasena
          </div>
          <div className="space-y-2">
            <Label>Contrasena actual</Label>
            <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nueva contrasena</Label>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirmar contrasena</Label>
            <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
          </div>
          <Button
            onClick={handlePasswordSubmit}
            disabled={savePassword.isPending || !currentPwd || !newPwd || !confirmPwd}
            className="w-full"
          >
            {savePassword.isPending ? "Guardando..." : "Cambiar contrasena"}
          </Button>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
            <Bell className="w-4 h-4" /> Notificaciones
          </div>
          <p className="text-sm text-muted-foreground">
            Activa las notificaciones push para recibir alertas en tu dispositivo.
            En iPhone debes tener la app instalada desde Safari (Anadir a pantalla de inicio).
          </p>
          {"Notification" in window ? (
            <div className="space-y-3">
              {Notification.permission === "granted" || notifState === "active" ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Bell className="w-4 h-4" />
                  Notificaciones activadas
                </div>
              ) : (
                <Button
                  onClick={handleEnableNotifications}
                  disabled={notifState === "loading"}
                  variant="outline"
                  className="w-full"
                >
                  {notifState === "loading" ? "Activando..." : "Activar notificaciones"}
                </Button>
              )}
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="w-full"
              >
                Enviar notificacion de prueba
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellOff className="w-4 h-4" />
              Tu navegador no soporta notificaciones push
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
