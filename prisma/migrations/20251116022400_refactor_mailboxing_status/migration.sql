/*
  Warnings:

  - You are about to drop the column `no_disturb` on the `Mailboxing` table. All the data in the column will be lost.
  - You are about to drop the column `was_inside` on the `Mailboxing` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MailboxingStatus" AS ENUM ('inside', 'outside', 'no_disturb');

-- AlterTable: Agregar columna status temporalmente nullable
ALTER TABLE "public"."Mailboxing" ADD COLUMN "status" "public"."MailboxingStatus";

-- Migrar datos existentes:
-- wasInside = true → status = 'inside'
-- wasInside = false AND noDisturb = true → status = 'no_disturb'
-- wasInside = false AND noDisturb = false → status = 'outside'
UPDATE "public"."Mailboxing" 
SET "status" = CASE
  WHEN "was_inside" = true THEN 'inside'::"public"."MailboxingStatus"
  WHEN "was_inside" = false AND "no_disturb" = true THEN 'no_disturb'::"public"."MailboxingStatus"
  WHEN "was_inside" = false AND "no_disturb" = false THEN 'outside'::"public"."MailboxingStatus"
  ELSE 'outside'::"public"."MailboxingStatus"
END
WHERE "status" IS NULL;

-- Hacer la columna status NOT NULL con valor por defecto
ALTER TABLE "public"."Mailboxing" 
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'outside'::"public"."MailboxingStatus";

-- Eliminar columnas antiguas
ALTER TABLE "public"."Mailboxing" 
  DROP COLUMN "no_disturb",
  DROP COLUMN "was_inside";
