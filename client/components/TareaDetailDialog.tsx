import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tarea, Asignatura, SubTarea } from "@/hooks/use-db";
import { Plus, Trash2, Pencil, FileText, X } from "lucide-react";

const api = (path: string, opts?: RequestInit) =>
  fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...opts?.headers,
    },
  });

interface Props {
  tarea: Tarea | null;
  asignaturas: Asignatura[];
  open: boolean;
  onClose: () => void;
  onEdit: (tarea: Tarea) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function TareaDetailDialog({
  tarea,
  asignaturas,
  open,
  onClose,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const qc = useQueryClient();
  const [newSubtarea, setNewSubtarea] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [enlaces, setEnlaces] = useState<Array<{ nombre: string; url: string }>>([]);
  const [nuevoEnlaceUrl, setNuevoEnlaceUrl] = useState("");
  const [nuevoEnlaceNombre, setNuevoEnlaceNombre] = useState("");

  const asig = tarea ? asignaturas.find((a) => a.id === tarea.asignatura_id) : null;

  useEffect(() => {
    if (!tarea || !open) return;
    if (tarea.archivos) {
      try {
        const parsed = JSON.parse(
          typeof tarea.archivos === "string" ? tarea.archivos : JSON.stringify(tarea.archivos)
        );
        setEnlaces(parsed.filter((e: any) => e.url && !e.contenido));
      } catch {
        setEnlaces([]);
      }
    } else {
      setEnlaces([]);
    }
    setNuevoEnlaceUrl("");
    setNuevoEnlaceNombre("");
  }, [tarea?.id, open]);

  const { data: subtareas = [] } = useQuery<SubTarea[]>({
    queryKey: ["subtareas", tarea?.id],
    queryFn: () =>
      api(`/api/tareas/${tarea!.id}/subtareas`).then((r) => r.json()),
    enabled: !!tarea && open,
  });

  const addSub = useMutation({
    mutationFn: (titulo: string) =>
      api(`/api/tareas/${tarea!.id}/subtareas`, {
        method: "POST",
        body: JSON.stringify({ titulo }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtareas", tarea?.id] });
      setNewSubtarea("");
    },
  });

  const toggleSub = useMutation({
    mutationFn: ({ id, hecha }: { id: string; hecha: boolean }) =>
      api(`/api/tareas/${tarea!.id}/subtareas/${id}`, {
        method: "PUT",
        body: JSON.stringify({ hecha }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtareas", tarea?.id] }),
  });

  const deleteSub = useMutation({
    mutationFn: (id: string) =>
      api(`/api/tareas/${tarea!.id}/subtareas/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subtareas", tarea?.id] }),
  });

  const saveEnlaces = useMutation({
    mutationFn: (updated: Array<{ nombre: string; url: string }>) =>
      api(`/api/tareas/${tarea!.id}`, {
        method: "PUT",
        body: JSON.stringify({ archivos: updated.length > 0 ? JSON.stringify(updated) : null }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tareas"] }),
  });

  const añadirEnlace = () => {
    const url = nuevoEnlaceUrl.trim();
    if (!url) return;
    const nombre = nuevoEnlaceNombre.trim() || url;
    const updated = [...enlaces, { nombre, url }];
    setEnlaces(updated);
    saveEnlaces.mutate(updated);
    setNuevoEnlaceUrl("");
    setNuevoEnlaceNombre("");
  };

  const eliminarEnlace = (index: number) => {
    const updated = enlaces.filter((_, i) => i !== index);
    setEnlaces(updated);
    saveEnlaces.mutate(updated);
  };

  const handleAddSub = () => {
    const titulo = newSubtarea.trim();
    if (!titulo) return;
    addSub.mutate(titulo);
  };

  const handleDelete = () => {
    if (!tarea) return;
    onDelete(tarea.id);
    setConfirmDelete(false);
    onClose();
  };

  const handleEdit = () => {
    if (!tarea) return;
    onEdit(tarea);
    onClose();
  };

  if (!tarea) return null;

  const fechaObj = new Date(tarea.fecha + "T00:00:00");
  const completadas = subtareas.filter((s) => s.hecha).length;
  const total = subtareas.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmDelete(false); onClose(); } }}>
      <DialogContent className="max-w-lg w-full rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with asig color accent */}
        <div
          className="px-6 pt-6 pb-4"
          style={asig ? { borderTop: `4px solid ${asig.color}` } : {}}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-medium leading-snug pr-8">
              {tarea.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant={tarea.hecha ? "secondary" : "default"} className="rounded-full">
              {tarea.hecha ? "Hecha" : "Pendiente"}
            </Badge>
            {asig && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: asig.color }} />
                {asig.nombre}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Vence {fechaObj.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
            </span>
          </div>

          {tarea.descripcion && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{tarea.descripcion}</p>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

        {/* Subtasks */}
        <div className="px-6 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Subtareas
              {total > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {completadas}/{total}
                </span>
              )}
            </h3>
            {total > 0 && (
              <div className="h-1.5 flex-1 mx-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(completadas / total) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {subtareas.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 group rounded-xl px-2 py-1.5 hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={sub.hecha}
                  onCheckedChange={(checked) =>
                    toggleSub.mutate({ id: sub.id, hecha: !!checked })
                  }
                  className="flex-shrink-0"
                />
                <span className={`flex-1 text-sm ${sub.hecha ? "line-through text-muted-foreground" : ""}`}>
                  {sub.titulo}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
                  onClick={() => deleteSub.mutate(sub.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add subtask input */}
          <div className="flex items-center gap-2">
            <Input
              value={newSubtarea}
              onChange={(e) => setNewSubtarea(e.target.value)}
              placeholder="Nueva subtarea..."
              className="rounded-full h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
              maxLength={100}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full flex-shrink-0"
              onClick={handleAddSub}
              disabled={!newSubtarea.trim() || addSub.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Links / Apuntes */}
        <div className="px-6 pb-4 space-y-2 border-t pt-4">
          <h3 className="text-sm font-medium">Archivos / Apuntes</h3>
          <div className="space-y-1.5">
            {enlaces.map((enlace, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border px-3 py-2 gap-2">
                <a
                  href={enlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline min-w-0 flex-1"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{enlace.nombre}</span>
                </a>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => eliminarEnlace(index)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Input
              value={nuevoEnlaceNombre}
              onChange={(e) => setNuevoEnlaceNombre(e.target.value)}
              placeholder="Nombre del enlace (opcional)"
              className="rounded-full h-8 text-sm"
            />
            <div className="flex gap-2">
              <Input
                value={nuevoEnlaceUrl}
                onChange={(e) => setNuevoEnlaceUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-full h-8 text-sm flex-1"
                onKeyDown={(e) => e.key === "Enter" && añadirEnlace()}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full flex-shrink-0"
                onClick={añadirEnlace}
                disabled={!nuevoEnlaceUrl.trim() || saveEnlaces.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        </div>{/* end scrollable body */}

        {/* Footer actions */}
        {confirmDelete ? (
          <div className="px-6 py-4 border-t bg-destructive/5 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">¿Eliminar esta tarea permanentemente?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vas a eliminar <span className="font-medium text-foreground">"{tarea.titulo}"</span> junto con todas sus subtareas. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Sí, eliminar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground disabled:opacity-40"
              onClick={() => { onToggle(tarea.id); onClose(); }}
              disabled={!tarea.hecha && subtareas.some((s) => !s.hecha)}
              title={!tarea.hecha && subtareas.some((s) => !s.hecha) ? "Completa todas las subtareas primero" : undefined}
            >
              {tarea.hecha ? "Marcar pendiente" : "Marcar hecha"}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
