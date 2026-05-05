import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpenText, Plus, Trash2, ClipboardList, Calendar } from "lucide-react";
import { useDB, Asignatura, Tarea, Examen } from "@/hooks/use-db";

export default function AsignaturasPage() {
  const db = useDB();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevaAsig, setNuevaAsig] = useState({ nombre: "", color: "#F9C2FC", profesor: "" });
  const [asignaturaEditando, setAsignaturaEditando] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (db.isReady) {
        const [asigs, tars, exams] = await Promise.all([
          db.getAsignaturas(),
          db.getTareas(),
          db.getExamenes(),
        ]);
        setAsignaturas(asigs);
        setTareas(tars);
        setExamenes(exams);
        setLoading(false);
      }
    };
    loadData();
  }, [db.isReady]);

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
    setOpenDialog(false);
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
          <p className="text-muted-foreground">Cargando asignaturas...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-foreground md:text-4xl">Asignaturas</h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona todas tus asignaturas del curso. Cada asignatura puede tener tareas y exámenes asociados.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setAsignaturaEditando(null);
            setNuevaAsig({ nombre: "", color: "#F9C2FC" });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Nueva asignatura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{asignaturaEditando ? 'Editar asignatura' : 'Crear nueva asignatura'}</DialogTitle>
              <DialogDescription>{asignaturaEditando ? 'Modifica el nombre y color de la asignatura.' : 'Añade una asignatura con un nombre y color identificativo.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre de la asignatura</Label>
                <Input
                  id="nombre"
                  autoFocus
                  value={nuevaAsig.nombre}
                  onChange={(e) => setNuevaAsig((s) => ({ ...s, nombre: e.target.value }))}
                  placeholder="Ej. Matemáticas, Historia, Biología..."
                  onKeyDown={(e) => e.key === "Enter" && addAsignatura()}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profesor">Profesor <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  id="profesor"
                  value={nuevaAsig.profesor}
                  onChange={(e) => setNuevaAsig((s) => ({ ...s, profesor: e.target.value }))}
                  placeholder="Ej. Juan García"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color identificativo</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    className="h-12 w-20 cursor-pointer rounded-2xl"
                    value={nuevaAsig.color}
                    onChange={(e) => setNuevaAsig((s) => ({ ...s, color: e.target.value }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    Este color te ayudará a identificar la asignatura visualmente
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={addAsignatura}>{asignaturaEditando ? 'Guardar cambios' : 'Crear asignatura'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{asignaturas.length}</span> asignaturas
          </p>
        </div>
      </div>

      {asignaturas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpenText className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-normal">No tienes asignaturas</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Comienza añadiendo tu primera asignatura para organizar tus tareas y exámenes.
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="h-4 w-4" /> Crear primera asignatura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {asignaturas.map((asig) => {
            const tareasAsig = tareas.filter((t) => t.asignatura_id === asig.id);
            const tareasPendientes = tareasAsig.filter((t) => !t.hecha).length;
            const examenesAsig = examenes.filter((e) => e.asignatura_id === asig.id);
            const proximosExamenes = examenesAsig.filter(
              (e) => new Date(e.fecha) >= new Date()
            ).length;

            return (
              <Card
                key={asig.id}
                className="group overflow-hidden border-l-4 transition-all hover:shadow-md"
                style={{ borderLeftColor: asig.color }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="break-words">{asig.nombre}</CardTitle>
                      {asig.profesor && (
                        <CardDescription className="mt-1">Prof. {asig.profesor}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setAsignaturaEditando(asig.id);
                          setNuevaAsig({ nombre: asig.nombre, color: asig.color, profesor: asig.profesor ?? "" });
                          setOpenDialog(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarAsignatura(asig.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {tareasPendientes} {tareasPendientes === 1 ? "tarea" : "tareas"}
                    </Badge>
                    <Badge variant="outline">
                      {proximosExamenes} {proximosExamenes === 1 ? "examen" : "exámenes"}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Total tareas: {tareasAsig.length}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Total exámenes: {examenesAsig.length}
                    </p>
                  </div>
                  <div className="flex justify-end mt-2">
                    <span
                      className="h-5 w-5 rounded-full shadow-sm"
                      style={{ backgroundColor: asig.color }}
                      title={asig.color}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
