-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_reservadorId_fkey";

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE',
ADD COLUMN     "responsableId" TEXT,
ALTER COLUMN "reservadorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_reservadorId_fkey" FOREIGN KEY ("reservadorId") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
