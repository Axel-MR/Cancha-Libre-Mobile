/*
  Warnings:

  - You are about to drop the column `idCentroDeportivoFK` on the `Canchas` table. All the data in the column will be lost.
  - You are about to drop the column `centroDeportivoFK` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `deporteFK` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `idCanchaFK` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `reservadorFK` on the `Reserva` table. All the data in the column will be lost.
  - Added the required column `centroDeportivoId` to the `Canchas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canchaId` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `centroDeportivoId` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservadorId` to the `Reserva` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Canchas" DROP CONSTRAINT "Canchas_idCentroDeportivoFK_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_centroDeportivoFK_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_idCanchaFK_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_reservadorFK_fkey";

-- AlterTable
ALTER TABLE "Canchas" DROP COLUMN "idCentroDeportivoFK",
ADD COLUMN     "centroDeportivoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reserva" DROP COLUMN "centroDeportivoFK",
DROP COLUMN "deporteFK",
DROP COLUMN "idCanchaFK",
DROP COLUMN "reservadorFK",
ADD COLUMN     "canchaId" TEXT NOT NULL,
ADD COLUMN     "centroDeportivoId" TEXT NOT NULL,
ADD COLUMN     "reservadorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Canchas" ADD CONSTRAINT "Canchas_centroDeportivoId_fkey" FOREIGN KEY ("centroDeportivoId") REFERENCES "CentroDeportivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_centroDeportivoId_fkey" FOREIGN KEY ("centroDeportivoId") REFERENCES "CentroDeportivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_canchaId_fkey" FOREIGN KEY ("canchaId") REFERENCES "Canchas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_reservadorId_fkey" FOREIGN KEY ("reservadorId") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
