/*
  Warnings:

  - You are about to drop the column `contrasena` on the `Usuarios` table. All the data in the column will be lost.
  - Added the required column `clave` to the `Usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Usuarios" DROP COLUMN "contrasena",
ADD COLUMN     "clave" TEXT NOT NULL;
