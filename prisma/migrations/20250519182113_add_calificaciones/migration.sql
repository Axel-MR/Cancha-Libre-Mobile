-- AlterTable
ALTER TABLE "Cancha" ADD COLUMN     "calificacionPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalCalificaciones" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "canchaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_canchaId_usuarioId_key" ON "Calificacion"("canchaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "Cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
