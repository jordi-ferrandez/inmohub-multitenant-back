-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('Following', 'Mailboxing');

-- CreateEnum
CREATE TYPE "PhoneType" AS ENUM ('Mobile', 'Home', 'Work', 'Other');

-- CreateTable
CREATE TABLE "PropertyAttachment" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "file_name" TEXT,
    "s3_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "PropertyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingAttachment" (
    "id" SERIAL NOT NULL,
    "building_id" INTEGER NOT NULL,
    "file_name" TEXT,
    "s3_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "BuildingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "building_id" INTEGER NOT NULL,
    "type" "AssignmentType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "follow_up_type_id" INTEGER NOT NULL,
    "follow_up_result_id" INTEGER NOT NULL,
    "follow_up_status_id" INTEGER NOT NULL,
    "comment" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "FollowUpType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpResult" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "FollowUpResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "FollowUpStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailboxing" (
    "id" SERIAL NOT NULL,
    "mailboxer_id" INTEGER NOT NULL,
    "building_id" INTEGER NOT NULL,
    "mailboxing_type_id" INTEGER NOT NULL,
    "mailboxing_status_id" INTEGER NOT NULL,
    "comment" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Mailboxing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxingType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "MailboxingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxingStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "MailboxingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxingAttachment" (
    "id" SERIAL NOT NULL,
    "mailboxing_id" INTEGER NOT NULL,
    "file_name" TEXT,
    "s3_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "MailboxingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonPhone" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "PhoneType" NOT NULL,

    CONSTRAINT "PersonPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ownership" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenancy" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Tenancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "listing_type_id" INTEGER NOT NULL,
    "listing_status_id" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ListingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ListingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_follow_up_seller" ON "FollowUp"("seller_id");

-- CreateIndex
CREATE INDEX "idx_follow_up_property" ON "FollowUp"("property_id");

-- CreateIndex
CREATE INDEX "idx_follow_up_type" ON "FollowUp"("follow_up_type_id");

-- CreateIndex
CREATE INDEX "idx_follow_up_result" ON "FollowUp"("follow_up_result_id");

-- CreateIndex
CREATE INDEX "idx_follow_up_status" ON "FollowUp"("follow_up_status_id");

-- CreateIndex
CREATE INDEX "idx_follow_up_date" ON "FollowUp"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpType_name_key" ON "FollowUpType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpResult_name_key" ON "FollowUpResult"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpStatus_name_key" ON "FollowUpStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxingType_name_key" ON "MailboxingType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MailboxingStatus_name_key" ON "MailboxingStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE INDEX "idx_ownership_person" ON "Ownership"("person_id");

-- CreateIndex
CREATE INDEX "idx_ownership_property" ON "Ownership"("property_id");

-- CreateIndex
CREATE INDEX "idx_ownership_person_property" ON "Ownership"("person_id", "property_id");

-- CreateIndex
CREATE INDEX "idx_tenancy_person" ON "Tenancy"("person_id");

-- CreateIndex
CREATE INDEX "idx_tenancy_property" ON "Tenancy"("property_id");

-- CreateIndex
CREATE INDEX "idx_tenancy_person_property" ON "Tenancy"("person_id", "property_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingType_name_key" ON "ListingType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ListingStatus_name_key" ON "ListingStatus"("name");

-- AddForeignKey
ALTER TABLE "PropertyAttachment" ADD CONSTRAINT "PropertyAttachment_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingAttachment" ADD CONSTRAINT "BuildingAttachment_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_follow_up_type_id_fkey" FOREIGN KEY ("follow_up_type_id") REFERENCES "FollowUpType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_follow_up_result_id_fkey" FOREIGN KEY ("follow_up_result_id") REFERENCES "FollowUpResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_follow_up_status_id_fkey" FOREIGN KEY ("follow_up_status_id") REFERENCES "FollowUpStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailboxing" ADD CONSTRAINT "Mailboxing_mailboxer_id_fkey" FOREIGN KEY ("mailboxer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailboxing" ADD CONSTRAINT "Mailboxing_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailboxing" ADD CONSTRAINT "Mailboxing_mailboxing_type_id_fkey" FOREIGN KEY ("mailboxing_type_id") REFERENCES "MailboxingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailboxing" ADD CONSTRAINT "Mailboxing_mailboxing_status_id_fkey" FOREIGN KEY ("mailboxing_status_id") REFERENCES "MailboxingStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailboxingAttachment" ADD CONSTRAINT "MailboxingAttachment_mailboxing_id_fkey" FOREIGN KEY ("mailboxing_id") REFERENCES "Mailboxing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonPhone" ADD CONSTRAINT "PersonPhone_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenancy" ADD CONSTRAINT "Tenancy_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenancy" ADD CONSTRAINT "Tenancy_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_listing_type_id_fkey" FOREIGN KEY ("listing_type_id") REFERENCES "ListingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_listing_status_id_fkey" FOREIGN KEY ("listing_status_id") REFERENCES "ListingStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
