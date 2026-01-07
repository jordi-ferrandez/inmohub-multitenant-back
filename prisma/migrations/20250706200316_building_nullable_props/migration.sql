-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL NOT NULL,
    "street" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "block" TEXT,
    "stair" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "inmovilla_code" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "building_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_building" ON "Building"("number", "block", "stair", "street");

-- CreateIndex
CREATE INDEX "idx_building_street" ON "Building"("street");

-- CreateIndex
CREATE UNIQUE INDEX "Building_number_block_stair_street_key" ON "Building"("number", "block", "stair", "street");

-- CreateIndex
CREATE INDEX "idx_property_building" ON "Property"("building_id");

-- CreateIndex
CREATE INDEX "idx_property_inmovilla_code" ON "Property"("inmovilla_code");

-- CreateIndex
CREATE UNIQUE INDEX "Property_number_floor_building_id_key" ON "Property"("number", "floor", "building_id");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
