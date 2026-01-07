-- AlterTable: Agregar columna building_id al modelo Reminder
ALTER TABLE "public"."Reminder" ADD COLUMN IF NOT EXISTS "building_id" INTEGER;

-- AddForeignKey: Crear relación con Building
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_building_id_fkey" 
  FOREIGN KEY ("building_id") 
  REFERENCES "public"."Building"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- CreateIndex: Crear índice para mejorar búsquedas por building_id
CREATE INDEX IF NOT EXISTS "idx_reminder_building" ON "public"."Reminder"("building_id");

