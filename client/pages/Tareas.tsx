import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReminderButton from "@/components/ReminderButton";
import TareaDetailDialog from "@/components/TareaDetailDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, CheckCircle2, Circle, Plus, Trash2, List } from "lucide-react";
import { useDB, Asignatura, Tarea } from "@/hooks/use-db";
import { useToast } from "@/hooks/use-toast";

const apiGet = (path: string) =>
  fetch(path, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then((r) => r.json());

export default function TareasPage() {
  const db = useDB();
  const { toast } = useToast();

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => apiGet("/api/reminders"),
  });
  const reminderMap = Object.fromEntries((reminders as any[]).map((r: any) => [r.reference_id, r]));
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({ asignaturaId: "", titulo: "", descripcion: "", fecha: "" });
  const [tareaEditando, setTareaEditando] = useState<string | null>(null);
  const [filtroAsignatura, setFiltroAsignatura] = useState<string>("todas");
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (db.isReady) {
        const [asigs, tars] = await Promise.all([db.getAsignaturas(), db.getTareas()]);
        setAsignaturas(asigs);
        setTareas(tars);
        setLoading(false);
      }
    };
    loadData();
  }, [db.isReady]);

  const addTarea = async () => {
    if (!nuevaTarea.asignaturaId || !nuevaTarea.titulo.trim() || !nuevaTarea.fecha) return;

    const descripcion = nuevaTarea.descripcion.trim() || undefined;
    if (tareaEditando) {
      await db.updateTarea(tareaEditando, {
        asignatura_id: nuevaTarea.asignaturaId,
        titulo: nuevaTarea.titulo.trim(),
        descripcion,
        fecha: nuevaTarea.fecha,
      });
      setTareas((s) => s.map(t => t.id === tareaEditando ? {
        ...t,
        asignatura_id: nuevaTarea.asignaturaId,
        titulo: nuevaTarea.titulo.trim(),
        descripcion,
        fecha: nuevaTarea.fecha
      } : t));
      setTareaEditando(null);
    } else {
      const newTarea = await db.addTarea({
        asignatura_id: nuevaTarea.asignaturaId,
        titulo: nuevaTarea.titulo.trim(),
        descripcion,
        fecha: nuevaTarea.fecha,
        hecha: false,
      });
      setTareas((s) => [...s, newTarea]);
    }

    setNuevaTarea({ asignaturaId: "", titulo: "", descripcion: "", fecha: "" });
    setOpenDialog(false);
  };

  const toggleTarea = async (id: string) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;
    const newHecha = !tarea.hecha;
    try {
      await db.updateTarea(id, { hecha: newHecha });
      setTareas((s) => s.map((t) => (t.id === id ? { ...t, hecha: newHecha } : t)));
    } catch (e: any) {
      toast({ title: "No se puede marcar como hecha", description: e.message, variant: "destructive" });
    }
  };

  const eliminarTarea = async (id: string) => {
    await db.deleteTarea(id);
    setTareas((s) => s.filter((t) => t.id !== id));
  };

  const abrirParaEditar = (tarea: Tarea) => {
    setTareaEditando(tarea.id);
    setNuevaTarea({
      asignaturaId: tarea.asignatura_id || "",
      titulo: tarea.titulo,
      descripcion: tarea.descripcion ?? "",
      fecha: tarea.fecha
    });
    setOpenDialog(true);
  };

  const tareasFiltradas = useMemo(() => {
    if (filtroAsignatura === "todas") return tareas;
    return tareas.filter((t) => t.asignatura_id === filtroAsignatura);
  }, [tareas, filtroAsignatura]);

  const tareasPorFecha = useMemo(() => {
    const grouped: Record<string, Tarea[]> = {};
    tareasFiltradas.forEach((tarea) => {
      if (!grouped[tarea.fecha]) {
        grouped[tarea.fecha] = [];
      }
      grouped[tarea.fecha].push(tarea);
    });
    return grouped;
  }, [tareasFiltradas]);

  const fechasOrdenadas = useMemo(
    () => Object.keys(tareasPorFecha).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [tareasPorFecha]
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando tareas...</p>
        </div>
      </AppLayout>
    );
  }

  const pendientes = tareas.filter((t) => !t.hecha).length;
  const completadas = tareas.filter((t) => t.hecha).length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-foreground md:text-4xl">Tareas</h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona tus tareas pendientes y organizalas por fecha y asignatura.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Circle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <List className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tareas.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro" className="text-sm">
            Filtrar por:
          </Label>
          <Select value={filtroAsignatura} onValueChange={setFiltroAsignatura}>
            <SelectTrigger className="h-9 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las asignaturas</SelectItem>
              {asignaturas.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setTareaEditando(null);
            setNuevaTarea({ asignaturaId: "", titulo: "", descripcion: "", fecha: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nueva tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tareaEditando ? 'Editar tarea' : 'Crear nueva tarea'}</DialogTitle>
              <DialogDescription>{tareaEditando ? 'Modifica los datos de la tarea.' : 'Añade una tarea y asígnala a una asignatura.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="asignatura">Asignatura</Label>
                <Select value={nuevaTarea.asignaturaId} onValueChange={(v) => setNuevaTarea((s) => ({ ...s, asignaturaId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título de la tarea</Label>
                <Input
                  id="titulo"
                  value={nuevaTarea.titulo}
                  onChange={(e) => setNuevaTarea((s) => ({ ...s, titulo: e.target.value }))}
                  placeholder="Ej. Ejercicios páginas 45-50"
                  maxLength={75}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  id="descripcion"
                  value={nuevaTarea.descripcion}
                  onChange={(e) => setNuevaTarea((s) => ({ ...s, descripcion: e.target.value }))}
                  placeholder="Añade más detalles..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha de entrega</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={nuevaTarea.fecha}
                  onChange={(e) => setNuevaTarea((s) => ({ ...s, fecha: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={addTarea}>{tareaEditando ? 'Guardar cambios' : 'Crear tarea'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendario">
            <Calendar className="mr-2 h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="lista">
            <List className="mr-2 h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="space-y-4">
          {fechasOrdenadas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-normal">No hay tareas</h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  Crea tu primera tarea para empezar a organizar tu tiempo.
                </p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4" /> Crear tarea
                </Button>
              </CardContent>
            </Card>
          ) : (
            fechasOrdenadas.map((fecha) => {
              const tareasDelDia = tareasPorFecha[fecha];
              const fechaObj = new Date(fecha + "T00:00:00");
              const esHoy = fechaObj.toDateString() === new Date().toDateString();
              const esPasado = fechaObj < new Date() && !esHoy;

              return (
                <Card key={fecha} className={esPasado ? "opacity-60" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                      {fechaObj.toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {esHoy && <Badge className="ml-2">Hoy</Badge>}
                      {esPasado && <Badge variant="secondary">Pasado</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tareasDelDia.map((tarea) => {
                      const asig = asignaturas.find((a) => a.id === tarea.asignatura_id);
                      return (
                        <div
                          key={tarea.id}
                          className="flex flex-col gap-2 rounded-2xl border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                          onClick={() => { setSelectedTarea(tarea); setOpenDetailDialog(true); }}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={!!tarea.hecha}
                              onChange={(e) => { e.stopPropagation(); toggleTarea(tarea.id); }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 h-5 w-5 cursor-pointer flex-shrink-0 rounded-full accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium leading-snug ${tarea.hecha ? "line-through text-muted-foreground" : ""}`}>
                                {tarea.titulo}
                              </p>
                              {tarea.descripcion && (
                                <p className="text-xs text-muted-foreground mt-0.5">{tarea.descripcion}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant={tarea.hecha ? "secondary" : "default"} className="rounded-full text-xs">
                              {tarea.hecha ? "Hecha" : "Pendiente"}
                            </Badge>
                            <div onClick={(e) => e.stopPropagation()}>
                              <ReminderButton
                                referenceId={tarea.id}
                                type="tarea"
                                title={tarea.titulo}
                                dueDate={tarea.fecha}
                                reminder={reminderMap[tarea.id]}
                              />
                            </div>
                          </div>
                          {asig && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: asig.color }} />
                              <span>{asig.nombre}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="lista" className="space-y-3">
          {tareasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <List className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-normal">No hay tareas</h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  No se encontraron tareas con el filtro seleccionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            tareasFiltradas
              .slice()
              .sort((a, b) => (a.hecha === b.hecha ? a.fecha.localeCompare(b.fecha) : a.hecha ? 1 : -1))
              .map((tarea) => {
                const asig = asignaturas.find((a) => a.id === tarea.asignatura_id);
                return (
                  <Card
                    key={tarea.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => { setSelectedTarea(tarea); setOpenDetailDialog(true); }}
                  >
                    <CardContent className="py-4 flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!tarea.hecha}
                          onChange={(e) => { e.stopPropagation(); toggleTarea(tarea.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 h-5 w-5 cursor-pointer flex-shrink-0 rounded-full accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium leading-snug ${tarea.hecha ? "line-through text-muted-foreground" : ""}`}>
                            {tarea.titulo}
                          </p>
                          {tarea.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5">{tarea.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={tarea.hecha ? "secondary" : "default"}>
                          {tarea.hecha ? "Completada" : "Pendiente"}
                        </Badge>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ReminderButton
                            referenceId={tarea.id}
                            type="tarea"
                            title={tarea.titulo}
                            dueDate={tarea.fecha}
                            reminder={reminderMap[tarea.id]}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {asig && <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: asig.color }} />}
                        {asig && <span>{asig.nombre}</span>}
                        {asig && <span>•</span>}
                        <span>vence {new Date(tarea.fecha + "T00:00:00").toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </TabsContent>
      </Tabs>

      <TareaDetailDialog
        tarea={selectedTarea}
        asignaturas={asignaturas}
        open={openDetailDialog}
        onClose={() => { setOpenDetailDialog(false); setSelectedTarea(null); }}
        onEdit={(t) => abrirParaEditar(t)}
        onDelete={eliminarTarea}
        onToggle={toggleTarea}
      />
    </AppLayout>
  );
}
