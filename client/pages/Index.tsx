import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Plus, BookOpenText } from "lucide-react";
import { useDB, Asignatura, Tarea, Examen } from "@/hooks/use-db";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TareaDetailDialog from "@/components/TareaDetailDialog";

export default function Index() {
  const db = useDB();
  const { toast } = useToast();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (db.isReady) {
        try {
          const [asigs, tars, exams] = await Promise.all([
            db.getAsignaturas(),
            db.getTareas(),
            db.getExamenes(),
          ]);
          setAsignaturas(asigs);
          setTareas(tars);
          setExamenes(exams);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [db.isReady]);

  const pendientes = useMemo(() => tareas.filter((t) => !t.hecha).length, [tareas]);
  const proximosExamenes = useMemo(() => {
    const hoy = new Date();
    return examenes.filter((e) => new Date(e.fecha) >= hoy).length;
  }, [examenes]);

  const [nuevaAsig, setNuevaAsig] = useState({ nombre: "", color: "#F9C2FC", profesor: "" });
  const [asignaturaEditando, setAsignaturaEditando] = useState<string | null>(null);
  const [nuevaTarea, setNuevaTarea] = useState({ asignaturaId: "", titulo: "", descripcion: "", fecha: "" });
  const [tareaEditando, setTareaEditando] = useState<string | null>(null);
  const [nuevoExamen, setNuevoExamen] = useState({ asignaturaId: "", titulo: "", fecha: "" });
  const [examenEditando, setExamenEditando] = useState<string | null>(null);
  const [openAsigDialog, setOpenAsigDialog] = useState(false);
  const [openTareaDialog, setOpenTareaDialog] = useState(false);
  const [openExamenDialog, setOpenExamenDialog] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const addAsignatura = async () => {
    const nombre = nuevaAsig.nombre.trim();
    if (!nombre) return;

    const profesor = nuevaAsig.profesor.trim() || undefined;
    if (asignaturaEditando) {
      await db.updateAsignatura(asignaturaEditando, { nombre, color: nuevaAsig.color, profesor });
      setAsignaturas((s) => s.map(a => a.id === asignaturaEditando ? { ...a, nombre, color: nuevaAsig.color, profesor } : a));
      setAsignaturaEditando(null);
    } else {
      const newAsig = await db.addAsignatura({ nombre, color: nuevaAsig.color, profesor });
      setAsignaturas((s) => [...s, newAsig]);
    }

    setNuevaAsig({ nombre: "", color: "#F9C2FC", profesor: "" });
    setOpenAsigDialog(false);
  };

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
        hecha: false
      });
      setTareas((s) => [...s, newTarea]);
    }

    setNuevaTarea({ asignaturaId: "", titulo: "", descripcion: "", fecha: "" });
    setOpenTareaDialog(false);
  };

  const addExamen = async () => {
    if (!nuevoExamen.asignaturaId || !nuevoExamen.titulo.trim() || !nuevoExamen.fecha) return;

    if (examenEditando) {
      await db.updateExamen(examenEditando, {
        asignatura_id: nuevoExamen.asignaturaId,
        titulo: nuevoExamen.titulo.trim(),
        fecha: nuevoExamen.fecha,
      });
      setExamenes((s) => s.map(e => e.id === examenEditando ? {
        ...e,
        asignatura_id: nuevoExamen.asignaturaId,
        titulo: nuevoExamen.titulo.trim(),
        fecha: nuevoExamen.fecha
      } : e));
      setExamenEditando(null);
    } else {
      const newExamen = await db.addExamen({
        asignatura_id: nuevoExamen.asignaturaId,
        titulo: nuevoExamen.titulo.trim(),
        fecha: nuevoExamen.fecha
      });
      setExamenes((s) => [...s, newExamen]);
    }

    setNuevoExamen({ asignaturaId: "", titulo: "", fecha: "" });
    setOpenExamenDialog(false);
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

  const eliminarExamen = async (id: string) => {
    await db.deleteExamen(id);
    setExamenes((s) => s.filter((e) => e.id !== id));
  };

  const eliminarAsignatura = async (id: string) => {
    await db.deleteAsignatura(id);
    setAsignaturas((s) => s.filter((a) => a.id !== id));
    setTareas((s) => s.filter((t) => t.asignatura_id !== id));
    setExamenes((s) => s.filter((e) => e.asignatura_id !== id));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <Link to="/calendario" className="md:hidden">
            <Button variant="outline" className="flex items-center gap-2 w-full">
              <CalendarDays className="h-4 w-4" />
              Ver Calendario
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-foreground">
                Camila's Organization
              </h1>
              <p className="mt-2 text-muted-foreground">
                Organiza todo en un solo lugar. Añade asignaturas, crea tareas y planifica exámenes.
              </p>
            </div>
            <Link to="/calendario" className="hidden md:block">
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Ver Calendario
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaturas</CardTitle>
            <BookOpenText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{asignaturas.length}</div>
            <p className="text-xs text-muted-foreground">Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas pendientes</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendientes}</div>
            <p className="text-xs text-muted-foreground">Por hacer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos exámenes</CardTitle>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{proximosExamenes}</div>
            <p className="text-xs text-muted-foreground">En calendario</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="examenes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="examenes">Exámenes</TabsTrigger>
          <TabsTrigger value="asignaturas">Asignaturas</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="asignaturas">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-normal">Listado</h2>
            <Dialog open={openAsigDialog} onOpenChange={(open) => {
              setOpenAsigDialog(open);
              if (!open) {
                setAsignaturaEditando(null);
                setNuevaAsig({ nombre: "", color: "#F9C2FC" });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" /> Añadir asignatura
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>{asignaturaEditando ? 'Editar asignatura' : 'Nueva asignatura'}</DialogTitle>
                  <DialogDescription>{asignaturaEditando ? 'Modifica el nombre y color de la asignatura.' : 'Introduce el nombre y color.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      autoFocus
                      className="rounded-full"
                      value={nuevaAsig.nombre}
                      onChange={(e) => setNuevaAsig((s) => ({ ...s, nombre: e.target.value }))}
                      placeholder="Ej. Matemáticas"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profesor">Profesor <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                    <Input
                      id="profesor"
                      className="rounded-full"
                      value={nuevaAsig.profesor}
                      onChange={(e) => setNuevaAsig((s) => ({ ...s, profesor: e.target.value }))}
                      placeholder="Ej. Juan García"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="color">Color</Label>
                    <input
                      id="color"
                      type="color"
                      className="h-10 w-16 cursor-pointer rounded-md"
                      value={nuevaAsig.color}
                      onChange={(e) => setNuevaAsig((s) => ({ ...s, color: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpenAsigDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addAsignatura}>{asignaturaEditando ? 'Guardar cambios' : 'Guardar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {asignaturas.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                Aún no tienes asignaturas. Añade la primera para empezar.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {asignaturas.map((a) => (
                <Card key={a.id} className="overflow-hidden border-l-4 rounded-3xl" style={{ borderLeftColor: a.color }}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="break-words block">{a.nombre}</span>
                        {a.profesor && <span className="text-xs font-normal text-muted-foreground">Prof. {a.profesor}</span>}
                      </div>
                      <span className="h-3 w-3 flex-shrink-0 rounded-full ml-2" style={{ backgroundColor: a.color }} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="rounded-full">
                    {tareas.filter((t) => t.asignatura_id === a.id && !t.hecha).length} tareas
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setAsignaturaEditando(a.id);
                        setNuevaAsig({ nombre: a.nombre, color: a.color, profesor: a.profesor ?? "" });
                        setOpenAsigDialog(true);
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => eliminarAsignatura(a.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tareas">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-normal">Tareas</h2>
            <Dialog open={openTareaDialog} onOpenChange={(open) => {
              setOpenTareaDialog(open);
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
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>{tareaEditando ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
                  <DialogDescription>{tareaEditando ? 'Modifica los datos de la tarea.' : 'Asigna la tarea a una asignatura.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Asignatura</Label>
                    <Select value={nuevaTarea.asignaturaId} onValueChange={(v) => setNuevaTarea((s) => ({ ...s, asignaturaId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {asignaturas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input
                      className="rounded-full"
                      value={nuevaTarea.titulo}
                      onChange={(e) => setNuevaTarea((s) => ({ ...s, titulo: e.target.value }))}
                      placeholder="Ej. Resumen del tema 2"
                      maxLength={75}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                    <Input
                      className="rounded-full"
                      value={nuevaTarea.descripcion}
                      onChange={(e) => setNuevaTarea((s) => ({ ...s, descripcion: e.target.value }))}
                      placeholder="Añade más detalles..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha límite</Label>
                    <Input
                      type="date"
                      className="rounded-full"
                      value={nuevaTarea.fecha}
                      onChange={(e) => setNuevaTarea((s) => ({ ...s, fecha: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpenTareaDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addTarea}>{tareaEditando ? 'Guardar cambios' : 'Guardar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {tareas.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas. Crea la primera.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {tareas
                .slice()
                .sort((a, b) => (a.hecha === b.hecha ? a.fecha.localeCompare(b.fecha) : a.hecha ? 1 : -1))
                .map((t) => {
                  const asig = asignaturas.find((a) => a.id === t.asignatura_id);
                  return (
                    <Card
                      key={t.id}
                      className="rounded-3xl cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => { setSelectedTarea(t); setOpenDetailDialog(true); }}
                    >
                      <CardContent className="py-4 flex flex-col gap-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!t.hecha}
                            onChange={(e) => { e.stopPropagation(); toggleTarea(t.id); }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium leading-snug ${t.hecha ? "line-through text-muted-foreground" : ""}`}>
                              {t.titulo}
                            </p>
                            {t.descripcion && (
                              <p className="text-xs text-muted-foreground mt-0.5">{t.descripcion}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={t.hecha ? "secondary" : "default"} className="rounded-full">
                            {t.hecha ? "Hecha" : "Pendiente"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {asig && <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: asig.color }} />}
                          {asig && <span>{asig.nombre}</span>}
                          {asig && <span>•</span>}
                          <span>vence {new Date(t.fecha + "T00:00:00").toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="examenes">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-normal">Exámenes</h2>
            <Dialog open={openExamenDialog} onOpenChange={(open) => {
              setOpenExamenDialog(open);
              if (!open) {
                setExamenEditando(null);
                setNuevoExamen({ asignaturaId: "", titulo: "", fecha: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" /> Nuevo examen
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>{examenEditando ? 'Editar examen' : 'Nuevo examen'}</DialogTitle>
                  <DialogDescription>{examenEditando ? 'Modifica los datos del examen.' : 'Guarda la fecha y asignatura.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Asignatura</Label>
                    <Select value={nuevoExamen.asignaturaId} onValueChange={(v) => setNuevoExamen((s) => ({ ...s, asignaturaId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {asignaturas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input
                      className="rounded-full"
                      value={nuevoExamen.titulo}
                      onChange={(e) => setNuevoExamen((s) => ({ ...s, titulo: e.target.value }))}
                      placeholder="Ej. Tema 3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      className="rounded-full"
                      value={nuevoExamen.fecha}
                      onChange={(e) => setNuevoExamen((s) => ({ ...s, fecha: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpenExamenDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addExamen}>{examenEditando ? 'Guardar cambios' : 'Guardar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {examenes.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                Sin exámenes por ahora.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {examenes
                .slice()
                .sort((a, b) => a.fecha.localeCompare(b.fecha))
                .map((e) => {
                  const asig = asignaturas.find((a) => a.id === e.asignatura_id);
                  const fechaObj = new Date(e.fecha + "T00:00:00");
                  const esPasado = fechaObj < new Date();
                  return (
                    <Card key={e.id} className={`rounded-3xl ${esPasado ? "opacity-60" : ""}`}>
                      <CardContent className="py-4 flex flex-col gap-1">
                        <div className="font-medium leading-snug">{e.titulo}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {asig && <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: asig.color }} />}
                          {asig && <span>{asig.nombre}</span>}
                          {asig && <span>•</span>}
                          <span>{fechaObj.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TareaDetailDialog
        tarea={selectedTarea}
        asignaturas={asignaturas}
        open={openDetailDialog}
        onClose={() => { setOpenDetailDialog(false); setSelectedTarea(null); }}
        onEdit={(t) => {
          setTareaEditando(t.id);
          setNuevaTarea({ asignaturaId: t.asignatura_id || "", titulo: t.titulo, descripcion: t.descripcion ?? "", fecha: t.fecha });
          setOpenTareaDialog(true);
        }}
        onDelete={eliminarTarea}
        onToggle={toggleTarea}
      />
    </AppLayout>
  );
}
