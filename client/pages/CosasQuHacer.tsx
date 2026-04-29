import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useDB, CosaQuHacer } from "@/hooks/use-db";

export default function CosasQuHacerPage() {
  const db = useDB();
  const [cosas, setCosas] = useState<CosaQuHacer[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<"baja" | "media" | "alta">("media");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    cargarCosas();
  }, []);

  const cargarCosas = async () => {
    const cosasCargadas = await db.getCosasQuHacer();
    setCosas(cosasCargadas);
  };

  const guardarCosa = async () => {
    if (!titulo.trim()) return;

    if (editingId) {
      await db.updateCosaQuHacer(editingId, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        prioridad,
      });
      setEditingId(null);
    } else {
      await db.addCosaQuHacer({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        prioridad,
        completada: false,
      });
    }

    await cargarCosas();
    setTitulo("");
    setDescripcion("");
    setPrioridad("media");
    setOpenDialog(false);
  };

  const toggleCompletada = async (id: string) => {
    const cosa = cosas.find(c => c.id === id);
    if (cosa) {
      await db.updateCosaQuHacer(id, { completada: !cosa.completada });
      await cargarCosas();
    }
  };

  const eliminarCosa = async (id: string) => {
    await db.deleteCosaQuHacer(id);
    await cargarCosas();
  };

  const abrirParaEditar = (cosa: CosaQuHacer) => {
    setEditingId(cosa.id);
    setTitulo(cosa.titulo);
    setDescripcion(cosa.descripcion || "");
    setPrioridad(cosa.prioridad);
    setOpenDialog(true);
  };

  const cosasActivas = cosas.filter(c => !c.completada);
  const cosasCompletadas = cosas.filter(c => c.completada);
  const cosasAltas = cosasActivas.filter(c => c.prioridad === "alta");

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-red-100 text-red-800";
      case "media":
        return "bg-yellow-100 text-yellow-800";
      case "baja":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadIcon = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-foreground">
              Cosas Que Hacer
            </h1>
            <p className="mt-2 text-muted-foreground">
              Organiza tus tareas pendientes y haz un seguimiento de lo que necesitas completar.
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) {
              setEditingId(null);
              setTitulo("");
              setDescripcion("");
              setPrioridad("media");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Añadir cosa
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar cosa" : "Nueva cosa que hacer"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Modifica los detalles de la cosa." : "Añade una nueva tarea a tu lista."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    autoFocus
                    className="rounded-full"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej. Estudiar matemáticas"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <textarea
                    id="descripcion"
                    className="h-20 rounded-lg border bg-background px-3 py-2 text-sm"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalles adicionales..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <select
                    id="prioridad"
                    className="h-10 rounded-full border bg-background px-3 text-sm"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as "baja" | "media" | "alta")}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarCosa}>{editingId ? "Guardar cambios" : "Guardar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <AlertCircle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cosas.length}</div>
            <p className="text-xs text-muted-foreground">Cosas en la lista</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Circle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cosasActivas.length}</div>
            <p className="text-xs text-muted-foreground">Por completar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cosasCompletadas.length}</div>
            <p className="text-xs text-muted-foreground">Hechas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pendientes">
            Pendientes ({cosasActivas.length})
          </TabsTrigger>
          <TabsTrigger value="altas" className={cosasAltas.length > 0 ? "text-red-600" : ""}>
            Alta Prioridad ({cosasAltas.length})
          </TabsTrigger>
          <TabsTrigger value="completadas">
            Completadas ({cosasCompletadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes">
          {cosasActivas.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                ¡No hay cosas pendientes! Excelente trabajo.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {cosasActivas
                .sort((a, b) => {
                  const prioridadOrder = { alta: 0, media: 1, baja: 2 };
                  return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
                })
                .map((cosa) => (
                  <Card key={cosa.id} className="rounded-3xl">
                    <CardContent className="flex items-start gap-4 py-4">
                      <button
                        onClick={() => toggleCompletada(cosa.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        <Circle className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base">{cosa.titulo}</div>
                        {cosa.descripcion && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {cosa.descripcion}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={`rounded-full ${getPrioridadColor(cosa.prioridad)}`}>
                            {cosa.prioridad === "alta" && getPrioridadIcon("alta")}
                            {cosa.prioridad.charAt(0).toUpperCase() + cosa.prioridad.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirParaEditar(cosa)}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => eliminarCosa(cosa.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="altas">
          {cosasAltas.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay cosas de alta prioridad.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {cosasAltas.map((cosa) => (
                <Card key={cosa.id} className="rounded-3xl border-l-4 border-red-500">
                  <CardContent className="flex items-start gap-4 py-4">
                    <button
                      onClick={() => toggleCompletada(cosa.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      <Circle className="h-6 w-6 text-red-600 hover:text-red-700 transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">{cosa.titulo}</div>
                      {cosa.descripcion && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {cosa.descripcion}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirParaEditar(cosa)}
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => eliminarCosa(cosa.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completadas">
          {cosasCompletadas.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                Aún no hay cosas completadas.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {cosasCompletadas.map((cosa) => (
                <Card key={cosa.id} className="rounded-3xl opacity-75">
                  <CardContent className="flex items-start gap-4 py-4">
                    <button
                      onClick={() => toggleCompletada(cosa.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      <CheckCircle2 className="h-6 w-6 text-green-600 hover:text-green-700 transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base line-through text-muted-foreground">
                        {cosa.titulo}
                      </div>
                      {cosa.descripcion && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {cosa.descripcion}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => eliminarCosa(cosa.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
