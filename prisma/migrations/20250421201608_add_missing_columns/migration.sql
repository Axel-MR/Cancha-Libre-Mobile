-- Para Canchas
ALTER TABLE "Canchas" ADD COLUMN "jugadores" INTEGER;
ALTER TABLE "Canchas" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Canchas" SET "jugadores" = 10 WHERE "jugadores" IS NULL;
UPDATE "Canchas" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Canchas" ALTER COLUMN "jugadores" SET NOT NULL;
ALTER TABLE "Canchas" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Para CentroDeportivo
ALTER TABLE "CentroDeportivo" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "CentroDeportivo" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "CentroDeportivo" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Para Reserva
ALTER TABLE "Reserva" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Reserva" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Reserva" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Para Usuarios
ALTER TABLE "Usuarios" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Usuarios" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Usuarios" ALTER COLUMN "updatedAt" SET NOT NULL;