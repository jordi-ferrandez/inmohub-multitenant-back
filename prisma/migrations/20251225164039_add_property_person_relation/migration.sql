-- CreateEnum
CREATE TYPE "PropertyPersonRole" AS ENUM ('owner', 'tenant');

-- CreateTable
CREATE TABLE "PropertyPerson" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "role" "PropertyPersonRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "PropertyPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyPerson_property_id_idx" ON "PropertyPerson"("property_id");

-- CreateIndex
CREATE INDEX "PropertyPerson_person_id_idx" ON "PropertyPerson"("person_id");

-- CreateIndex
CREATE INDEX "PropertyPerson_role_idx" ON "PropertyPerson"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPerson_property_id_person_id_role_key" ON "PropertyPerson"("property_id", "person_id", "role");

-- AddForeignKey
ALTER TABLE "PropertyPerson" ADD CONSTRAINT "PropertyPerson_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPerson" ADD CONSTRAINT "PropertyPerson_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

