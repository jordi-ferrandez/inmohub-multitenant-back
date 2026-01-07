-- Refactorización del sistema de seguimientos
-- Eliminar tablas FollowUpType, FollowUpResult, FollowUpStatus
-- Modificar tabla FollowUp con nuevos campos

-- Paso 1: Eliminar foreign keys de FollowUp que referencian las tablas que vamos a eliminar
ALTER TABLE "FollowUp" DROP CONSTRAINT IF EXISTS "FollowUp_follow_up_type_id_fkey";
ALTER TABLE "FollowUp" DROP CONSTRAINT IF EXISTS "FollowUp_follow_up_result_id_fkey";
ALTER TABLE "FollowUp" DROP CONSTRAINT IF EXISTS "FollowUp_follow_up_status_id_fkey";

-- Paso 2: Eliminar índices que referencian las columnas que vamos a eliminar
DROP INDEX IF EXISTS "idx_follow_up_type";
DROP INDEX IF EXISTS "idx_follow_up_result";
DROP INDEX IF EXISTS "idx_follow_up_status";
DROP INDEX IF EXISTS "idx_follow_up_date";

-- Paso 3: Eliminar las columnas antiguas de FollowUp
ALTER TABLE "FollowUp" DROP COLUMN IF EXISTS "follow_up_type_id";
ALTER TABLE "FollowUp" DROP COLUMN IF EXISTS "follow_up_result_id";
ALTER TABLE "FollowUp" DROP COLUMN IF EXISTS "follow_up_status_id";
ALTER TABLE "FollowUp" DROP COLUMN IF EXISTS "date";

-- Paso 4: Agregar las nuevas columnas a FollowUp
ALTER TABLE "FollowUp" ADD COLUMN "was_contacted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FollowUp" ADD COLUMN "contact_type" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "letter_type" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "observation_type" TEXT;
ALTER TABLE "FollowUp" ADD COLUMN "planned_date" TIMESTAMP(3);
ALTER TABLE "FollowUp" ADD COLUMN "executed_date" TIMESTAMP(3);

-- Paso 5: Crear nuevos índices
CREATE INDEX "idx_follow_up_planned" ON "FollowUp"("planned_date");
CREATE INDEX "idx_follow_up_executed" ON "FollowUp"("executed_date");

-- Paso 6: Eliminar las tablas que ya no necesitamos (esto se hará después de asegurar que no hay dependencias)
-- Comentamos estas líneas por ahora para evitar errores si hay datos existentes
-- DROP TABLE IF EXISTS "FollowUpStatus";
-- DROP TABLE IF EXISTS "FollowUpResult";
-- DROP TABLE IF EXISTS "FollowUpType";

-- Nota: Las tablas FollowUpType, FollowUpResult, FollowUpStatus se eliminarán manualmente
-- después de verificar que no hay datos o dependencias importantes
