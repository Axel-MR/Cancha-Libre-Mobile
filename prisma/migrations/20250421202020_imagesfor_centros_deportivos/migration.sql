-- AlterTable
ALTER TABLE "Canchas" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imagenUrl" TEXT;

-- AlterTable
ALTER TABLE "CentroDeportivo" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imagenNombre" TEXT,
ADD COLUMN     "imagenTamaño" INTEGER,
ADD COLUMN     "imagenTipo" TEXT,
ADD COLUMN     "imagenUrl" TEXT;

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Usuarios" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ObjetoRenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "imagenUrl" TEXT,
    "reservaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjetoRenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PersonalCentro" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PersonalCentro_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PersonalCentro_B_index" ON "_PersonalCentro"("B");

-- AddForeignKey
ALTER TABLE "ObjetoRenta" ADD CONSTRAINT "ObjetoRenta_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalCentro" ADD CONSTRAINT "_PersonalCentro_A_fkey" FOREIGN KEY ("A") REFERENCES "CentroDeportivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalCentro" ADD CONSTRAINT "_PersonalCentro_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
