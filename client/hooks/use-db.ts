export interface Asignatura {
  id: string;
  nombre: string;
  color: string;
  profesor?: string;
}

export interface Tarea {
  id: string;
  asignatura_id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  hecha: boolean;
  archivos?: any;
}

export interface SubTarea {
  id: string;
  tarea_id: string;
  titulo: string;
  hecha: boolean;
}

export interface Examen {
  id: string;
  asignatura_id: string;
  titulo: string;
  fecha: string;
  nota?: number;
  detalles?: string;
  archivos?: any;
}

export interface CosaQuHacer {
  id: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  fecha_creacion: string;
  prioridad: 'baja' | 'media' | 'alta';
}

const api = async (path: string, options?: RequestInit) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json();
};

export const useDB = () => {
  const isReady = true;

  const getAsignaturas = (): Promise<Asignatura[]> => api('/asignaturas');
  const addAsignatura = (a: Omit<Asignatura, 'id'>) => api('/asignaturas', { method: 'POST', body: JSON.stringify(a) });
  const updateAsignatura = (id: string, a: Partial<Asignatura>) => api(`/asignaturas/${id}`, { method: 'PUT', body: JSON.stringify(a) });
  const deleteAsignatura = (id: string) => api(`/asignaturas/${id}`, { method: 'DELETE' });

  const getTareas = (): Promise<Tarea[]> => api('/tareas');
  const addTarea = (t: Omit<Tarea, 'id'>) => api('/tareas', { method: 'POST', body: JSON.stringify(t) });
  const updateTarea = (id: string, t: Partial<Tarea>) => api(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(t) });
  const deleteTarea = (id: string) => api(`/tareas/${id}`, { method: 'DELETE' });

  const getExamenes = (): Promise<Examen[]> => api('/examenes');
  const addExamen = (e: Omit<Examen, 'id'>) => api('/examenes', { method: 'POST', body: JSON.stringify(e) });
  const updateExamen = (id: string, e: Partial<Examen>) => api(`/examenes/${id}`, { method: 'PUT', body: JSON.stringify(e) });
  const deleteExamen = (id: string) => api(`/examenes/${id}`, { method: 'DELETE' });

  const getCosasQuHacer = (): Promise<CosaQuHacer[]> => api('/cosas');
  const addCosaQuHacer = (c: Omit<CosaQuHacer, 'id' | 'fecha_creacion'>) => api('/cosas', { method: 'POST', body: JSON.stringify(c) });
  const updateCosaQuHacer = (id: string, c: Partial<Omit<CosaQuHacer, 'id' | 'fecha_creacion'>>) => api(`/cosas/${id}`, { method: 'PUT', body: JSON.stringify(c) });
  const deleteCosaQuHacer = (id: string) => api(`/cosas/${id}`, { method: 'DELETE' });

  return {
    isReady,
    getAsignaturas,
    addAsignatura,
    updateAsignatura,
    deleteAsignatura,
    getTareas,
    addTarea,
    updateTarea,
    deleteTarea,
    getExamenes,
    addExamen,
    updateExamen,
    deleteExamen,
    getCosasQuHacer,
    addCosaQuHacer,
    updateCosaQuHacer,
    deleteCosaQuHacer,
  };
};
