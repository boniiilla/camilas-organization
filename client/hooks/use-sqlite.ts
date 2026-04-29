import { useEffect, useState } from 'react';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'camila_organization';
const isNative = Capacitor.isNativePlatform();

let db: SQLiteDBConnection | null = null;
let sqliteConnection: SQLiteConnection | null = null;

export interface Asignatura {
  id: string;
  nombre: string;
  color: string;
}

export interface Tarea {
  id: string;
  asignaturaId: string;
  titulo: string;
  fecha: string;
  hecha: number;
}

export interface Examen {
  id: string;
  asignaturaId: string;
  titulo: string;
  fecha: string;
  nota?: number;
  detalles?: string;
  archivos?: string; // JSON string array of base64 files
}

const initDB = async () => {
  if (!isNative) {
    console.log('Running in browser, using localStorage fallback');
    return null;
  }

  try {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
    db = await sqliteConnection.createConnection(
      DB_NAME,
      false,
      'no-encryption',
      1,
      false
    );
    
    await db.open();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS asignaturas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tareas (
        id TEXT PRIMARY KEY,
        asignaturaId TEXT NOT NULL,
        titulo TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hecha INTEGER DEFAULT 0,
        FOREIGN KEY (asignaturaId) REFERENCES asignaturas(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS examenes (
        id TEXT PRIMARY KEY,
        asignaturaId TEXT NOT NULL,
        titulo TEXT NOT NULL,
        fecha TEXT NOT NULL,
        nota REAL,
        detalles TEXT,
        archivos TEXT,
        FOREIGN KEY (asignaturaId) REFERENCES asignaturas(id) ON DELETE CASCADE
      );
    `);

    console.log('SQLite database initialized');
    return db;
  } catch (error) {
    console.error('Error initializing SQLite:', error);
    return null;
  }
};

export const useSQLite = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initDB();
      setIsReady(true);
    };
    init();
  }, []);

  const getAsignaturas = async (): Promise<Asignatura[]> => {
    if (!isNative || !db) {
      const stored = localStorage.getItem('mc_asignaturas');
      return stored ? JSON.parse(stored) : [];
    }
    
    const result = await db.query('SELECT * FROM asignaturas');
    return result.values || [];
  };

  const addAsignatura = async (asignatura: Asignatura) => {
    if (!isNative || !db) {
      const current = await getAsignaturas();
      const updated = [...current, asignatura];
      localStorage.setItem('mc_asignaturas', JSON.stringify(updated));
      return;
    }

    await db.run(
      'INSERT INTO asignaturas (id, nombre, color) VALUES (?, ?, ?)',
      [asignatura.id, asignatura.nombre, asignatura.color]
    );
  };

  const deleteAsignatura = async (id: string) => {
    if (!isNative || !db) {
      const current = await getAsignaturas();
      const updated = current.filter((a) => a.id !== id);
      localStorage.setItem('mc_asignaturas', JSON.stringify(updated));
      
      const tareas = await getTareas();
      const updatedTareas = tareas.filter((t) => t.asignaturaId !== id);
      localStorage.setItem('mc_tareas', JSON.stringify(updatedTareas));
      
      const examenes = await getExamenes();
      const updatedExamenes = examenes.filter((e) => e.asignaturaId !== id);
      localStorage.setItem('mc_examenes', JSON.stringify(updatedExamenes));
      return;
    }

    await db.run('DELETE FROM asignaturas WHERE id = ?', [id]);
  };

  const getTareas = async (): Promise<Tarea[]> => {
    if (!isNative || !db) {
      const stored = localStorage.getItem('mc_tareas');
      return stored ? JSON.parse(stored) : [];
    }
    
    const result = await db.query('SELECT * FROM tareas');
    return result.values || [];
  };

  const addTarea = async (tarea: Tarea) => {
    if (!isNative || !db) {
      const current = await getTareas();
      const updated = [...current, tarea];
      localStorage.setItem('mc_tareas', JSON.stringify(updated));
      return;
    }

    await db.run(
      'INSERT INTO tareas (id, asignaturaId, titulo, fecha, hecha) VALUES (?, ?, ?, ?, ?)',
      [tarea.id, tarea.asignaturaId, tarea.titulo, tarea.fecha, tarea.hecha]
    );
  };

  const updateTarea = async (id: string, hecha: number) => {
    if (!isNative || !db) {
      const current = await getTareas();
      const updated = current.map((t) => t.id === id ? { ...t, hecha } : t);
      localStorage.setItem('mc_tareas', JSON.stringify(updated));
      return;
    }

    await db.run('UPDATE tareas SET hecha = ? WHERE id = ?', [hecha, id]);
  };

  const deleteTarea = async (id: string) => {
    if (!isNative || !db) {
      const current = await getTareas();
      const updated = current.filter((t) => t.id !== id);
      localStorage.setItem('mc_tareas', JSON.stringify(updated));
      return;
    }

    await db.run('DELETE FROM tareas WHERE id = ?', [id]);
  };

  const getExamenes = async (): Promise<Examen[]> => {
    if (!isNative || !db) {
      const stored = localStorage.getItem('mc_examenes');
      return stored ? JSON.parse(stored) : [];
    }
    
    const result = await db.query('SELECT * FROM examenes');
    return result.values || [];
  };

  const addExamen = async (examen: Examen) => {
    if (!isNative || !db) {
      const current = await getExamenes();
      const updated = [...current, examen];
      localStorage.setItem('mc_examenes', JSON.stringify(updated));
      return;
    }

    await db.run(
      'INSERT INTO examenes (id, asignaturaId, titulo, fecha, nota, detalles, archivos) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [examen.id, examen.asignaturaId, examen.titulo, examen.fecha, examen.nota || null, examen.detalles || null, examen.archivos || null]
    );
  };

  const updateExamen = async (id: string, data: Partial<Omit<Examen, 'id'>>) => {
    if (!isNative || !db) {
      const current = await getExamenes();
      const updated = current.map((e) => (e.id === id ? { ...e, ...data } : e));
      localStorage.setItem('mc_examenes', JSON.stringify(updated));
      return;
    }

    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.run(`UPDATE examenes SET ${fields} WHERE id = ?`, values);
  };

  const deleteExamen = async (id: string) => {
    if (!isNative || !db) {
      const current = await getExamenes();
      const updated = current.filter((e) => e.id !== id);
      localStorage.setItem('mc_examenes', JSON.stringify(updated));
      return;
    }

    await db.run('DELETE FROM examenes WHERE id = ?', [id]);
  };

  return {
    isReady,
    getAsignaturas,
    addAsignatura,
    deleteAsignatura,
    getTareas,
    addTarea,
    updateTarea,
    deleteTarea,
    getExamenes,
    addExamen,
    updateExamen,
    deleteExamen,
  };
};
