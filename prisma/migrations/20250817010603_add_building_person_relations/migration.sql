/*
  Warnings:

  - You are about to drop the `Ownership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tenancy` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_person_id_fkey";

-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_property_id_fkey";

-- DropForeignKey
ALTER TABLE "Tenancy" DROP CONSTRAINT "Tenancy_person_id_fkey";

-- DropForeignKey
ALTER TABLE "Tenancy" DROP CONSTRAINT "Tenancy_property_id_fkey";

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "contact_id" INTEGER,
ADD COLUMN     "informer_id" INTEGER,
ADD COLUMN     "president_id" INTEGER;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "appraisal_price" DECIMAL(65,30),
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "captured_by_id" INTEGER,
ADD COLUMN     "important_notice" TEXT,
ADD COLUMN     "no_bell" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "no_counter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "no_disturb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "no_doormat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occupied_by" TEXT,
ADD COLUMN     "owner_id" INTEGER,
ADD COLUMN     "rso_comment" TEXT,
ADD COLUMN     "sold_rented_us" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenant_id" INTEGER;

-- DropTable
DROP TABLE "Ownership";

-- DropTable
DROP TABLE "Tenancy";

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_president_id_fkey" FOREIGN KEY ("president_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_informer_id_fkey" FOREIGN KEY ("informer_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_captured_by_id_fkey" FOREIGN KEY ("captured_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
