-- AlterTable
ALTER TABLE "Property" ADD COLUMN "is_opportunity" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_property_opportunity" ON "Property"("is_opportunity") WHERE "is_opportunity" = true;

