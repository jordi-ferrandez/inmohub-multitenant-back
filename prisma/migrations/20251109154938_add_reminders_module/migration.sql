-- CreateEnum
CREATE TYPE "public"."ReminderRecurrenceType" AS ENUM ('once', 'daily', 'weekly', 'monthly', 'custom');

-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('active', 'paused', 'cancelled', 'archived');

-- CreateEnum
CREATE TYPE "public"."ReminderOccurrenceStatus" AS ENUM ('pending', 'completed', 'skipped', 'cancelled');

-- CreateTable
CREATE TABLE "public"."Reminder" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "responsible_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "property_id" INTEGER,
    "person_id" INTEGER,
    "follow_up_id" INTEGER,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "recurrence_type" "public"."ReminderRecurrenceType" NOT NULL,
    "recurrence_rule" TEXT,
    "recurrence_ends_at" TIMESTAMP(3),
    "status" "public"."ReminderStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReminderOccurrence" (
    "id" SERIAL NOT NULL,
    "reminder_id" INTEGER NOT NULL,
    "follow_up_id" INTEGER,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "original_scheduled_for" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "status" "public"."ReminderOccurrenceStatus" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "skipped_at" TIMESTAMP(3),
    "skipped_reason" TEXT,
    "auto_generated" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ReminderOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_reminder_responsible" ON "public"."Reminder"("responsible_id");

-- CreateIndex
CREATE INDEX "idx_reminder_scheduled_at" ON "public"."Reminder"("scheduled_at");

-- CreateIndex
CREATE INDEX "idx_reminder_status" ON "public"."Reminder"("status");

-- CreateIndex
CREATE INDEX "idx_reminder_occurrence_scheduled" ON "public"."ReminderOccurrence"("scheduled_for");

-- CreateIndex
CREATE INDEX "idx_reminder_occurrence_status" ON "public"."ReminderOccurrence"("status");

-- CreateIndex
CREATE INDEX "idx_reminder_occurrence_followup" ON "public"."ReminderOccurrence"("follow_up_id");

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "public"."FollowUp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderOccurrence" ADD CONSTRAINT "ReminderOccurrence_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "public"."Reminder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderOccurrence" ADD CONSTRAINT "ReminderOccurrence_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "public"."FollowUp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
