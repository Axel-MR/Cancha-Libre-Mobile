-- CreateTable
CREATE TABLE "Usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "clave_ine" TEXT NOT NULL,
    "edad" INTEGER,
    "sexo" TEXT,
    "estatura" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "ejercicio_semanal" INTEGER,
    "reservasHechas" INTEGER NOT NULL DEFAULT 0,
    "faltas" INTEGER NOT NULL DEFAULT 0,
    "rol" TEXT NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroDeportivo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,

    CONSTRAINT "CentroDeportivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canchas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deporte" TEXT NOT NULL,
    "idCentroDeportivoFK" TEXT NOT NULL,
    "alumbrado" BOOLEAN NOT NULL,

    CONSTRAINT "Canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "centroDeportivoFK" TEXT NOT NULL,
    "deporteFK" TEXT NOT NULL,
    "idCanchaFK" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,
    "reservadorFK" TEXT NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "Usuarios"("correo");

-- AddForeignKey
ALTER TABLE "Canchas" ADD CONSTRAINT "Canchas_idCentroDeportivoFK_fkey" FOREIGN KEY ("idCentroDeportivoFK") REFERENCES "CentroDeportivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_centroDeportivoFK_fkey" FOREIGN KEY ("centroDeportivoFK") REFERENCES "CentroDeportivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_idCanchaFK_fkey" FOREIGN KEY ("idCanchaFK") REFERENCES "Canchas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_reservadorFK_fkey" FOREIGN KEY ("reservadorFK") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
