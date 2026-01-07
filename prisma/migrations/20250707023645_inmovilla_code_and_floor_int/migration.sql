/*
  Warnings:

  - Changed the type of `inmovilla_code` on the `Property` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `floor` on the `Property` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "inmovilla_code",
ADD COLUMN     "inmovilla_code" INTEGER NOT NULL,
DROP COLUMN "floor",
ADD COLUMN     "floor" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "idx_property_inmovilla_code" ON "Property"("inmovilla_code");

-- CreateIndex
CREATE UNIQUE INDEX "Property_number_floor_building_id_key" ON "Property"("number", "floor", "building_id");
