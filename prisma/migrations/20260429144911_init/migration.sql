-- CreateTable
CREATE TABLE "asignaturas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "asignatura_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "hecha" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes" (
    "id" TEXT NOT NULL,
    "asignatura_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "nota" DOUBLE PRECISION,
    "detalles" TEXT,
    "archivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cosas_qu_hacer" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prioridad" TEXT NOT NULL DEFAULT 'media',

    CONSTRAINT "cosas_qu_hacer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
