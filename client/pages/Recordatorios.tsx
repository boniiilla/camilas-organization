import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, BellOff, CalendarDays, ClipboardList, Eye, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LinkedReminder = {
  id: string;
  type: "examen" | "tarea";
  reference_id: string;
  title: string;
  due_date: string;
  mode: string;
  remind_from: string | null;
  remind_until: string | null;
};

type ManualReminder = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

const api = (path: string, opts?: RequestInit) =>
  fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...opts?.headers,
    },
  });

const toDate = (s: string) => new Date(s + "T00:00:00");

function getLinkedStatus(r: LinkedReminder) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = r.remind_from ? toDate(r.remind_from) : null;
  const until = r.remind_until ? toDate(r.remind_until) : null;
  const due = toDate(r.due_date);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (from && until) {
    if (today >= from && today <= until) return { label: "Activo hoy", variant: "default" as const, daysUntilDue };
    if (today < from) {
      const d = Math.ceil((from.getTime() - today.getTime()) / 86400000);
      return { label: `Empieza en ${d} ${d === 1 ? "día" : "días"}`, variant: "secondary" as const, daysUntilDue };
    }
  }
  if (due < today) return { label: "Vencido", variant: "outline" as const, daysUntilDue };
  return { label: "Proximo", variant: "secondary" as const, daysUntilDue };
}

function getModeLabel(mode: string) {
  if (mode === "dia_antes") return "1 dia antes";
  if (mode === "semana_antes") return "1 semana antes";
  return "Rango personalizado";
}

// ── iOS-style notification preview ───────────────────────────────────────────
function NotificationPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 shadow-lg p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <img src="/icon-192.png" alt="" className="w-8 h-8 rounded-lg object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Camila's Organization
            </span>
            <span className="text-xs text-zinc-400 shrink-0">ahora</span>
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">{title}</p>
          {body && <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2">{body}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Preview dialog ────────────────────────────────────────────────────────────
function PreviewDialog({
  open,
  onClose,
  title,
  body,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api("/api/push/send", {
        method: "POST",
        body: JSON.stringify({ title, body }),
      }).then((r) => r.json());
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Notificacion enviada" });
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vista previa de notificacion</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <p className="text-xs text-muted-foreground">
            Asi se vera la notificacion en tu iPhone:
          </p>
          <NotificationPreview title={title} body={body} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Enviando..." : "Enviar ahora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Manual reminder card ──────────────────────────────────────────────────────
function ManualCard({
  reminder,
  onDelete,
  onPreview,
}: {
  reminder: ManualReminder;
  onDelete: (id: string) => void;
  onPreview: (title: string, body: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-full p-1.5 bg-primary/15 shrink-0">
            <Bell className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="font-medium leading-snug">{reminder.title}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 -mt-1 -mr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver notificacion"
            onClick={() => onPreview(reminder.title, reminder.description ?? "")}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(reminder.id)} title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {reminder.description && (
        <p className="text-sm text-muted-foreground mt-2 pl-7 leading-relaxed">
          {reminder.description}
        </p>
      )}
    </div>
  );
}

// ── Linked reminder card (read-only) ─────────────────────────────────────────
function LinkedCard({
  reminder,
  onDelete,
  onPreview,
}: {
  reminder: LinkedReminder;
  onDelete: (id: string) => void;
  onPreview: (title: string, body: string) => void;
}) {
  const status = getLinkedStatus(reminder);
  const due = toDate(reminder.due_date);
  const isActive = status.variant === "default";

  const notifTitle = reminder.title;
  const notifBody =
    `Tu ${reminder.type === "examen" ? "examen" : "tarea"} es el ` +
    due.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={`rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40 ${isActive ? "border-primary/30" : ""}`}>
      {/* Top row: badges + actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className={`rounded-full p-1 shrink-0 ${isActive ? "bg-primary/15" : "bg-muted"}`}>
            {reminder.type === "examen" ? (
              <CalendarDays className={`h-3 w-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            ) : (
              <ClipboardList className={`h-3 w-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            )}
          </div>
          <Badge variant={reminder.type === "examen" ? "default" : "secondary"} className="text-xs">
            {reminder.type === "examen" ? "Examen" : "Tarea"}
          </Badge>
          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 -mt-1 -mr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver notificacion"
            onClick={() => onPreview(notifTitle, notifBody)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(reminder.id)} title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <p className="font-medium leading-snug mb-1.5">{reminder.title}</p>

      {/* Date + countdown */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {due.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
        </span>
        {status.daysUntilDue > 0 && (
          <span className="text-sm font-medium text-foreground">
            — {status.daysUntilDue === 1 ? "mañana" : `en ${status.daysUntilDue} días`}
          </span>
        )}
        {status.daysUntilDue === 0 && (
          <span className="text-sm font-medium text-foreground">— hoy</span>
        )}
      </div>

      {/* Mode */}
      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
        <Bell className="h-3 w-3" />
        {getModeLabel(reminder.mode)}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RecordatoriosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newUntil, setNewUntil] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const [preview, setPreview] = useState<{ title: string; body: string } | null>(null);

  const { data: linked = [], isLoading: loadingLinked } = useQuery<LinkedReminder[]>({
    queryKey: ["reminders"],
    queryFn: () => api("/api/reminders").then((r) => r.json()),
  });

  const { data: manual = [], isLoading: loadingManual } = useQuery<ManualReminder[]>({
    queryKey: ["manual-reminders"],
    queryFn: () => api("/api/manual-reminders").then((r) => r.json()),
  });

  const createManual = useMutation({
    mutationFn: () =>
      api("/api/manual-reminders", {
        method: "POST",
        body: JSON.stringify({ title: newTitle, description: newDesc, remind_from: newFrom || null, remind_until: newUntil || null, remind_time: newTime }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      qc.invalidateQueries({ queryKey: ["manual-reminders"] });
      setNewTitle(""); setNewDesc(""); setNewFrom(""); setNewUntil(""); setNewTime("09:00");
      setCreateOpen(false);
    },
  });

  const deleteManual = useMutation({
    mutationFn: (id: string) => api(`/api/manual-reminders/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manual-reminders"] }),
  });

  const deleteLinked = useMutation({
    mutationFn: (id: string) => api(`/api/reminders/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLinked = linked.filter((r) => {
    const from = r.remind_from ? toDate(r.remind_from) : null;
    const until = r.remind_until ? toDate(r.remind_until) : null;
    return from && until && today >= from && today <= until;
  });

  const upcomingLinked = linked.filter((r) => {
    const from = r.remind_from ? toDate(r.remind_from) : null;
    return !activeLinked.includes(r) && from && today < from && toDate(r.due_date) >= today;
  });

  const expiredLinked = linked.filter((r) => toDate(r.due_date) < today);

  const isLoading = loadingLinked || loadingManual;
  const isEmpty = manual.length === 0 && linked.length === 0;

  return (
    <AppLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-foreground">Recordatorios</h1>
          <p className="mt-2 text-muted-foreground">
            Crea recordatorios o activa los de tus examenes y tareas.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo recordatorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Estudiar para el parcial"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Añade mas detalles..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Rango de fechas <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Desde</span>
                  <Input type="date" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} className="w-full" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Hasta</span>
                  <Input type="date" value={newUntil} onChange={(e) => setNewUntil(e.target.value)} min={newFrom} className="w-full" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hora de notificacion</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createManual.mutate()}
              disabled={!newTitle.trim() || createManual.isPending}
            >
              {createManual.isPending ? "Guardando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      {preview && (
        <PreviewDialog
          open
          onClose={() => setPreview(null)}
          title={preview.title}
          body={preview.body}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground py-12 text-center">Cargando...</p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <BellOff className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-normal mb-2">Sin recordatorios</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Crea un recordatorio con el boton "Nuevo" o activa recordatorios desde Examenes y Tareas con el icono de campana.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Manual reminders */}
          {manual.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-sm">Mis recordatorios</h2>
                <Badge variant="secondary" className="text-xs">{manual.length}</Badge>
              </div>
              <div className="space-y-2">
                {manual.map((r) => (
                  <ManualCard
                    key={r.id}
                    reminder={r}
                    onDelete={(id) => deleteManual.mutate(id)}
                    onPreview={(t, b) => setPreview({ title: t, body: b })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Active linked */}
          {activeLinked.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-sm">Activos hoy</h2>
                <Badge className="text-xs">{activeLinked.length}</Badge>
              </div>
              <div className="space-y-2">
                {activeLinked.map((r) => (
                  <LinkedCard
                    key={r.id}
                    reminder={r}
                    onDelete={(id) => deleteLinked.mutate(id)}
                    onPreview={(t, b) => setPreview({ title: t, body: b })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming linked */}
          {upcomingLinked.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium text-sm text-muted-foreground">Proximos</h2>
                <Badge variant="secondary" className="text-xs">{upcomingLinked.length}</Badge>
              </div>
              <div className="space-y-2">
                {upcomingLinked.map((r) => (
                  <LinkedCard
                    key={r.id}
                    reminder={r}
                    onDelete={(id) => deleteLinked.mutate(id)}
                    onPreview={(t, b) => setPreview({ title: t, body: b })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Expired linked */}
          {expiredLinked.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-medium text-sm text-muted-foreground">Vencidos</h2>
                <Badge variant="outline" className="text-xs">{expiredLinked.length}</Badge>
              </div>
              <div className="space-y-2 opacity-60">
                {expiredLinked.map((r) => (
                  <LinkedCard
                    key={r.id}
                    reminder={r}
                    onDelete={(id) => deleteLinked.mutate(id)}
                    onPreview={(t, b) => setPreview({ title: t, body: b })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppLayout>
  );
}
