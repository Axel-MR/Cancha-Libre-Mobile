/*
  Warnings:

  - You are about to drop the `Canchas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Canchas" DROP CONSTRAINT "Canchas_centroDeportivoId_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_canchaId_fkey";

-- DropTable
DROP TABLE "Canchas";

-- CreateTable
CREATE TABLE "Cancha" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deporte" TEXT NOT NULL,
    "alumbrado" BOOLEAN NOT NULL,
    "jugadores" INTEGER NOT NULL,
    "imagenUrl" TEXT,
    "centroDeportivoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cancha_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cancha" ADD CONSTRAINT "Cancha_centroDeportivoId_fkey" FOREIGN KEY ("centroDeportivoId") REFERENCES "CentroDeportivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "Cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
