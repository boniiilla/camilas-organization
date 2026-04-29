import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, List } from "lucide-react";
import { useDB, Asignatura, Tarea, Examen } from "@/hooks/use-db";

export default function CalendarioPage() {
  const db = useDB();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Combinar tareas y exámenes por fecha
  const eventosPorFecha = useMemo(() => {
    const grouped: Record<string, { tareas: Tarea[]; examenes: Examen[] }> = {};

    tareas.forEach((tarea) => {
      if (!grouped[tarea.fecha]) {
        grouped[tarea.fecha] = { tareas: [], examenes: [] };
      }
      grouped[tarea.fecha].tareas.push(tarea);
    });

    examenes.forEach((examen) => {
      if (!grouped[examen.fecha]) {
        grouped[examen.fecha] = { tareas: [], examenes: [] };
      }
      grouped[examen.fecha].examenes.push(examen);
    });

    return grouped;
  }, [tareas, examenes]);

  const fechasOrdenadas = useMemo(
    () => Object.keys(eventosPorFecha).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [eventosPorFecha]
  );

  // Agrupar por mes
  const eventosPorMes = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    fechasOrdenadas.forEach((fecha) => {
      const mes = new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", { year: "numeric", month: "long" });
      if (!grouped[mes]) {
        grouped[mes] = [];
      }
      grouped[mes].push(fecha);
    });
    return grouped;
  }, [fechasOrdenadas]);

  // Eventos de esta semana
  const eventosEstaSemana = useMemo(() => {
    const hoy = new Date();
    const inicioDeSemana = new Date(hoy);
    inicioDeSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioDeSemana.setHours(0, 0, 0, 0);
    
    const finDeSemana = new Date(inicioDeSemana);
    finDeSemana.setDate(inicioDeSemana.getDate() + 6);
    finDeSemana.setHours(23, 59, 59, 999);

    return fechasOrdenadas.filter((fecha) => {
      const fechaObj = new Date(fecha + "T00:00:00");
      return fechaObj >= inicioDeSemana && fechaObj <= finDeSemana;
    });
  }, [fechasOrdenadas]);

  // Eventos de hoy
  const eventosHoy = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return eventosPorFecha[hoy] || { tareas: [], examenes: [] };
  }, [eventosPorFecha]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-foreground md:text-4xl">Calendario</h1>
        <p className="mt-2 text-muted-foreground">
          Vista general de todas tus tareas y exámenes organizados por fecha.
        </p>
      </div>

      <Tabs defaultValue="mes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="mes">
            <Calendar className="mr-2 h-4 w-4" />
            Mes
          </TabsTrigger>
          <TabsTrigger value="semana">
            <CalendarDays className="mr-2 h-4 w-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="dia">
            <List className="mr-2 h-4 w-4" />
            Día
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mes" className="space-y-6">
          {Object.keys(eventosPorMes).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-normal">No hay eventos</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Añade tareas y exámenes para verlos en el calendario.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(eventosPorMes).map(([mes, fechas]) => (
              <div key={mes}>
                <h2 className="mb-4 text-2xl font-normal capitalize">{mes}</h2>
                <div className="space-y-4">
                  {fechas.map((fecha) => {
                    const eventos = eventosPorFecha[fecha];
                    const fechaObj = new Date(fecha + "T00:00:00");
                    const esHoy = fechaObj.toDateString() === new Date().toDateString();

                    return (
                      <Card key={fecha}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            {fechaObj.toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                            {esHoy && <Badge>Hoy</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {eventos.tareas.length > 0 && (
                            <div>
                              <p className="mb-2 text-sm font-medium text-muted-foreground">Tareas</p>
                              {eventos.tareas.map((tarea) => {
                        const asig = asignaturas.find((a) => a.id === tarea.asignatura_id);
                                return (
                                  <div key={tarea.id} className="mb-2 flex items-center gap-2 rounded-2xl border p-3">
                                    <input
                                      type="checkbox"
                                      checked={!!tarea.hecha}
                                      readOnly
                                      className="h-4 w-4 rounded-full accent-primary"
                                    />
                                    <div className="flex-1">
                                      <p className={`text-sm ${tarea.hecha ? "line-through text-muted-foreground" : ""}`}>
                                        {tarea.titulo}
                                      </p>
                                      {asig && (
                                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asig.color }} />
                                          {asig.nombre}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant={tarea.hecha ? "secondary" : "default"}>
                                      {tarea.hecha ? "Hecha" : "Pendiente"}
                                    </Badge>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {eventos.examenes.length > 0 && (
                            <div>
                              <p className="mb-2 text-sm font-medium text-muted-foreground">Exámenes</p>
                              {eventos.examenes.map((examen) => {
                        const asig = asignaturas.find((a) => a.id === examen.asignatura_id);
                                return (
                                  <div key={examen.id} className="mb-2 rounded-2xl border p-3">
                                    <p className="font-medium">{examen.titulo}</p>
                                    {asig && (
                                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asig.color }} />
                                        {asig.nombre}
                                      </p>
                                    )}
                                    {examen.nota !== undefined && (
                                      <Badge variant="outline" className="mt-2">
                                        Nota: {examen.nota}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          {eventosEstaSemana.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-normal">No hay eventos esta semana</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No tienes tareas ni exámenes programados para esta semana.
                </p>
              </CardContent>
            </Card>
          ) : (
            eventosEstaSemana.map((fecha) => {
              const eventos = eventosPorFecha[fecha];
              const fechaObj = new Date(fecha + "T00:00:00");
              const esHoy = fechaObj.toDateString() === new Date().toDateString();

              return (
                <Card key={fecha}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      {fechaObj.toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {esHoy && <Badge>Hoy</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{eventos.tareas.length} tareas</Badge>
                      <Badge variant="outline">{eventos.examenes.length} exámenes</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="dia" className="space-y-4">
          {eventosHoy.tareas.length === 0 && eventosHoy.examenes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <List className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-normal">No hay eventos hoy</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No tienes tareas ni exámenes programados para hoy.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Hoy - {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventosHoy.tareas.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">Tareas ({eventosHoy.tareas.length})</h3>
                    <div className="space-y-2">
                      {eventosHoy.tareas.map((tarea) => {
                      const asig = asignaturas.find((a) => a.id === tarea.asignatura_id);
                        return (
                          <div key={tarea.id} className="flex items-center gap-3 rounded-2xl border p-3">
                            <input
                              type="checkbox"
                              checked={!!tarea.hecha}
                              readOnly
                              className="h-5 w-5 rounded-full accent-primary"
                            />
                            <div className="flex-1">
                              <p className={tarea.hecha ? "line-through text-muted-foreground" : ""}>{tarea.titulo}</p>
                              {asig && (
                                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asig.color }} />
                                  {asig.nombre}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {eventosHoy.examenes.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">Exámenes ({eventosHoy.examenes.length})</h3>
                    <div className="space-y-2">
                      {eventosHoy.examenes.map((examen) => {
                      const asig = asignaturas.find((a) => a.id === examen.asignatura_id);
                        return (
                          <div key={examen.id} className="rounded-2xl border p-3">
                            <p className="font-medium">{examen.titulo}</p>
                            {asig && (
                              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: asig.color }} />
                                {asig.nombre}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
