import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReminderButton from "@/components/ReminderButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, CalendarDays, Plus, Trash2, List, Clock, FileText, Star, Upload, Download, X, MoreVertical, Pencil } from "lucide-react";
import { useDB, Asignatura, Examen } from "@/hooks/use-db";

const apiGet = (path: string) =>
  fetch(path, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then((r) => r.json());

export default function ExamenesPage() {
  const db = useDB();

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => apiGet("/api/reminders"),
  });
  const reminderMap = Object.fromEntries((reminders as any[]).map((r: any) => [r.reference_id, r]));
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetallesDialog, setOpenDetallesDialog] = useState(false);
  const [examenSeleccionado, setExamenSeleccionado] = useState<Examen | null>(null);
  const [nuevoExamen, setNuevoExamen] = useState({ asignaturaId: "", titulo: "", fecha: "" });
  const [examenEditando, setExamenEditando] = useState<string | null>(null);
  const [filtroAsignatura, setFiltroAsignatura] = useState<string>("todas");
  
  // Detalles form
  const [nota, setNota] = useState<string>("");
  const [detalles, setDetalles] = useState<string>("");
  const [enlaces, setEnlaces] = useState<Array<{ nombre: string; url: string }>>([]);
  const [nuevoEnlaceUrl, setNuevoEnlaceUrl] = useState("");
  const [nuevoEnlaceNombre, setNuevoEnlaceNombre] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (db.isReady) {
        const [asigs, exams] = await Promise.all([db.getAsignaturas(), db.getExamenes()]);
        setAsignaturas(asigs);
        setExamenes(exams);
        setLoading(false);
      }
    };
    loadData();
  }, [db.isReady]);

  const addExamen = async () => {
    if (!nuevoExamen.asignaturaId || !nuevoExamen.titulo.trim() || !nuevoExamen.fecha) return;

    if (examenEditando) {
      // Modo edición
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
      // Modo crear
      const newExamen = await db.addExamen({
        asignatura_id: nuevoExamen.asignaturaId,
        titulo: nuevoExamen.titulo.trim(),
        fecha: nuevoExamen.fecha,
      });
      setExamenes((s) => [...s, newExamen]);
    }

    setNuevoExamen({ asignaturaId: "", titulo: "", fecha: "" });
    setOpenDialog(false);
  };

  const abrirParaEditar = (examen: Examen) => {
    setExamenEditando(examen.id);
    setNuevoExamen({
      asignaturaId: examen.asignatura_id || "",
      titulo: examen.titulo,
      fecha: examen.fecha,
    });
    setOpenDialog(true);
  };

  const abrirDetalles = (examen: Examen) => {
    setExamenSeleccionado(examen);
    setNota(examen.nota?.toString() || "");
    setDetalles(examen.detalles || "");

    if (examen.archivos) {
      try {
        const parsed = JSON.parse(examen.archivos as string);
        // Support new {nombre, url} format; skip legacy base64 entries
        setEnlaces(parsed.filter((e: any) => e.url && !e.contenido));
      } catch {
        setEnlaces([]);
      }
    } else {
      setEnlaces([]);
    }

    setNuevoEnlaceUrl("");
    setNuevoEnlaceNombre("");
    setOpenDetallesDialog(true);
  };

  const guardarDetalles = async () => {
    if (!examenSeleccionado) return;

    const notaNum = nota ? parseFloat(nota) : null;
    const detallesVal = detalles ? detalles : null;
    const archivosJson = enlaces.length > 0 ? JSON.stringify(enlaces) : null;

    await db.updateExamen(examenSeleccionado.id, {
      nota: notaNum,
      detalles: detallesVal,
      archivos: archivosJson,
    });

    setExamenes((s) =>
      s.map((e) =>
        e.id === examenSeleccionado.id
          ? { ...e, nota: notaNum ?? undefined, detalles: detallesVal ?? undefined, archivos: archivosJson ?? undefined }
          : e
      )
    );

    setOpenDetallesDialog(false);
    setExamenSeleccionado(null);
    setNota(""); setDetalles(""); setEnlaces([]); setNuevoEnlaceUrl(""); setNuevoEnlaceNombre("");
  };

  const añadirEnlace = () => {
    const url = nuevoEnlaceUrl.trim();
    if (!url) return;
    const nombre = nuevoEnlaceNombre.trim() || url;
    setEnlaces((prev) => [...prev, { nombre, url }]);
    setNuevoEnlaceUrl("");
    setNuevoEnlaceNombre("");
  };

  const eliminarEnlace = (index: number) => {
    setEnlaces((prev) => prev.filter((_, i) => i !== index));
  };

  const eliminarExamen = async (id: string) => {
    await db.deleteExamen(id);
    setExamenes((s) => s.filter((e) => e.id !== id));
  };

  const examenesFiltrados = useMemo(() => {
    if (filtroAsignatura === "todas") return examenes;
    return examenes.filter((e) => e.asignatura_id === filtroAsignatura);
  }, [examenes, filtroAsignatura]);

  const examenesPorFecha = useMemo(() => {
    const grouped: Record<string, Examen[]> = {};
    examenesFiltrados.forEach((examen) => {
      if (!grouped[examen.fecha]) {
        grouped[examen.fecha] = [];
      }
      grouped[examen.fecha].push(examen);
    });
    return grouped;
  }, [examenesFiltrados]);

  const fechasOrdenadas = useMemo(
    () => Object.keys(examenesPorFecha).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [examenesPorFecha]
  );

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const proximosExamenes = examenes.filter((e) => new Date(e.fecha + "T00:00:00") >= hoy);
  const examenesRealizados = examenes.filter((e) => new Date(e.fecha + "T00:00:00") < hoy);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando exámenes...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-foreground md:text-4xl">Exámenes</h1>
        <p className="mt-2 text-muted-foreground">
          Planifica tus exámenes, añade notas y adjunta apuntes.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{proximosExamenes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizados</CardTitle>
            <CalendarDays className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{examenesRealizados.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <List className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{examenes.length}</div>
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
            setExamenEditando(null);
            setNuevoExamen({ asignaturaId: "", titulo: "", fecha: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nuevo examen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
            <DialogTitle>{examenEditando ? 'Editar examen' : 'Crear nuevo examen'}</DialogTitle>
            <DialogDescription>{examenEditando ? 'Modifica los datos del examen.' : 'Añade un examen y asígnalo a una asignatura.'}</DialogDescription>
          </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="asignatura">Asignatura</Label>
                <Select value={nuevoExamen.asignaturaId} onValueChange={(v) => setNuevoExamen((s) => ({ ...s, asignaturaId: v }))}>
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
                <Label htmlFor="titulo">Tema del examen</Label>
                <Input
                  id="titulo"
                  value={nuevoExamen.titulo}
                  onChange={(e) => setNuevoExamen((s) => ({ ...s, titulo: e.target.value }))}
                  placeholder="Ej. Tema 3: Funciones"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha del examen</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={nuevoExamen.fecha}
                  onChange={(e) => setNuevoExamen((s) => ({ ...s, fecha: e.target.value }))}
                  className="w-full md:w-auto"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={addExamen}>{examenEditando ? 'Guardar cambios' : 'Crear examen'}</Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Detalles/Nota/Archivos */}
      <Dialog open={openDetallesDialog} onOpenChange={setOpenDetallesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Examen</DialogTitle>
            <DialogDescription>
              {examenSeleccionado?.titulo} - {examenSeleccionado && new Date(examenSeleccionado.fecha + "T00:00:00").toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nota">Nota obtenida</Label>
              <Input
                id="nota"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. 8.5"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detalles">Detalles / Comentarios</Label>
              <Textarea
                id="detalles"
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
                placeholder="Ej. Examen difícil, faltó tiempo..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>Archivos / Apuntes</Label>
              <div className="space-y-2">
                {enlaces.map((enlace, index) => (
                  <div key={index} className="flex items-center justify-between rounded-2xl border px-3 py-2 gap-2">
                    <a
                      href={enlace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline min-w-0 flex-1"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{enlace.nombre}</span>
                    </a>
                    <Button type="button" size="icon" variant="ghost" onClick={() => eliminarEnlace(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <Input
                    value={nuevoEnlaceNombre}
                    onChange={(e) => setNuevoEnlaceNombre(e.target.value)}
                    placeholder="Nombre del enlace (opcional)"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={nuevoEnlaceUrl}
                      onChange={(e) => setNuevoEnlaceUrl(e.target.value)}
                      placeholder="https://..."
                      onKeyDown={(e) => e.key === "Enter" && añadirEnlace()}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={añadirEnlace} disabled={!nuevoEnlaceUrl.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDetallesDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarDetalles}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <h3 className="mb-2 text-lg font-normal">No hay exámenes</h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  Añade tu primer examen para empezar a planificar tu estudio.
                </p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4" /> Crear examen
                </Button>
              </CardContent>
            </Card>
          ) : (
            fechasOrdenadas.map((fecha) => {
              const examenesDelDia = examenesPorFecha[fecha];
              const fechaObj = new Date(fecha + "T00:00:00");
              const esHoy = fechaObj.toDateString() === new Date().toDateString();
              const esPasado = fechaObj < hoy;
              const diasRestantes = Math.ceil((fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <Card key={fecha} className={esPasado ? "opacity-60" : ""}>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                      {fechaObj.toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {esHoy && <Badge>Hoy</Badge>}
                      {esPasado && <Badge variant="secondary">Realizado</Badge>}
                      {!esPasado && !esHoy && diasRestantes <= 7 && (
                        <Badge variant="destructive">En {diasRestantes} días</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {examenesDelDia.map((examen) => {
                      const asig = asignaturas.find((a) => a.id === examen.asignatura_id);
                      const tieneArchivos = examen.archivos && JSON.parse(examen.archivos).length > 0;
                      
                      return (
                        <div
                          key={examen.id}
                          className="flex flex-col gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{examen.titulo}</p>
                            {asig && (
                              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asig.color }} />
                                {asig.nombre}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {examen.nota !== undefined && (
                                <Badge variant="outline" className="gap-1">
                                  <Star className="h-3 w-3" />
                                  Nota: {examen.nota}
                                </Badge>
                              )}
                              {tieneArchivos && (
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  {JSON.parse(examen.archivos!).length} archivos
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setExamenEditando(examen.id);
                                setNuevoExamen({
                                  asignaturaId: examen.asignatura_id || "",
                                  titulo: examen.titulo,
                                  fecha: examen.fecha
                                });
                                setOpenDialog(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </Button>
                            <ReminderButton
                              referenceId={examen.id}
                              type="examen"
                              title={examen.titulo}
                              dueDate={examen.fecha}
                              reminder={reminderMap[examen.id]}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDetalles(examen)}
                              title="Ver detalles"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarExamen(examen.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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
          {examenesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <List className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-normal">No hay exámenes</h3>
                <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                  No se encontraron exámenes con el filtro seleccionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            examenesFiltrados
              .slice()
              .sort((a, b) => a.fecha.localeCompare(b.fecha))
              .map((examen) => {
                const asig = asignaturas.find((a) => a.id === examen.asignatura_id);
                const fechaObj = new Date(examen.fecha + "T00:00:00");
                const esPasado = fechaObj < hoy;
                const diasRestantes = Math.ceil((fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                const tieneArchivos = examen.archivos && JSON.parse(examen.archivos).length > 0;

                return (
                  <Card key={examen.id} className={esPasado ? "opacity-60" : ""}>
                    <CardContent className="flex items-start justify-between gap-3 py-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{examen.titulo}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {asig && (
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asig.color }} />
                                {asig.nombre}
                              </span>
                            )}
                            <span className="mx-2">•</span>
                            {fechaObj.toLocaleDateString()}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {examen.nota !== undefined && (
                              <Badge variant="outline" className="gap-1">
                                <Star className="h-3 w-3" />
                                Nota: {examen.nota}
                              </Badge>
                            )}
                            {tieneArchivos && (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                {JSON.parse(examen.archivos!).length} archivos
                              </Badge>
                            )}
                            {esPasado ? (
                              <Badge variant="secondary">Realizado</Badge>
                            ) : diasRestantes === 0 ? (
                              <Badge>Hoy</Badge>
                            ) : diasRestantes <= 7 ? (
                              <Badge variant="destructive">En {diasRestantes} días</Badge>
                            ) : (
                              <Badge variant="outline">En {diasRestantes} días</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirParaEditar(examen)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => abrirDetalles(examen)}>
                                <Star className="mr-2 h-4 w-4" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => eliminarExamen(examen.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="hidden md:flex md:items-center md:gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setExamenEditando(examen.id);
                            setNuevoExamen({
                              asignaturaId: examen.asignatura_id || "",
                              titulo: examen.titulo,
                              fecha: examen.fecha
                            });
                            setOpenDialog(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ReminderButton
                            referenceId={examen.id}
                            type="examen"
                            title={examen.titulo}
                            dueDate={examen.fecha}
                            reminder={reminderMap[examen.id]}
                          />
                          <Button variant="ghost" size="icon" onClick={() => abrirDetalles(examen)} title="Ver detalles">
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => eliminarExamen(examen.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
