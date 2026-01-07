/*
  Warnings:

  - You are about to drop the column `mailboxing_status_id` on the `Mailboxing` table. All the data in the column will be lost.
  - You are about to drop the column `mailboxing_type_id` on the `Mailboxing` table. All the data in the column will be lost.
  - You are about to drop the `FollowUpResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FollowUpStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FollowUpType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MailboxingStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MailboxingType` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('sin_estado', 'noticia_venta', 'noticia_alquiler', 'antiguo_cliente');

-- DropForeignKey
ALTER TABLE "public"."Mailboxing" DROP CONSTRAINT "Mailboxing_mailboxing_status_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Mailboxing" DROP CONSTRAINT "Mailboxing_mailboxing_type_id_fkey";

-- AlterTable
ALTER TABLE "public"."Building" ADD COLUMN     "no_disturb" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."BuildingAttachment" ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "uploaded_by_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."FollowUp" ALTER COLUMN "was_contacted" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Mailboxing" DROP COLUMN "mailboxing_status_id",
DROP COLUMN "mailboxing_type_id",
ADD COLUMN     "no_disturb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "was_inside" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."MailboxingAttachment" ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "uploaded_by_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."Person" ALTER COLUMN "birth_date" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "is_informer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_president" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_second_residence" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rental_price" DECIMAL(65,30),
ADD COLUMN     "sale_price" DECIMAL(65,30),
ADD COLUMN     "status" "public"."PropertyStatus" NOT NULL DEFAULT 'sin_estado';

-- AlterTable
ALTER TABLE "public"."PropertyAttachment" ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "uploaded_by_id" INTEGER;

-- DropTable
DROP TABLE "public"."FollowUpResult";

-- DropTable
DROP TABLE "public"."FollowUpStatus";

-- DropTable
DROP TABLE "public"."FollowUpType";

-- DropTable
DROP TABLE "public"."MailboxingStatus";

-- DropTable
DROP TABLE "public"."MailboxingType";

-- AddForeignKey
ALTER TABLE "public"."PropertyAttachment" ADD CONSTRAINT "PropertyAttachment_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuildingAttachment" ADD CONSTRAINT "BuildingAttachment_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MailboxingAttachment" ADD CONSTRAINT "MailboxingAttachment_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
