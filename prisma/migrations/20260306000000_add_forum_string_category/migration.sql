-- CreateTable: Foro con category como String simple (sin tabla ForumCategory)

CREATE TABLE IF NOT EXISTS "ForumTopic" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "company_id" INTEGER,

    CONSTRAINT "ForumTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ForumPost" (
    "id" SERIAL NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ForumTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ForumTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable (join table for many-to-many ForumTopic <-> ForumTag)
CREATE TABLE IF NOT EXISTS "_ForumTagToForumTopic" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ForumTopic_category_idx" ON "ForumTopic"("category");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ForumTag_name_key" ON "ForumTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_ForumTagToForumTopic_AB_unique" ON "_ForumTagToForumTopic"("A", "B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_ForumTagToForumTopic_B_index" ON "_ForumTagToForumTopic"("B");

-- AddForeignKey
ALTER TABLE "ForumTopic" ADD CONSTRAINT "ForumTopic_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ForumTopic" ADD CONSTRAINT "ForumTopic_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "ForumTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ForumTagToForumTopic" ADD CONSTRAINT "_ForumTagToForumTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "ForumTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ForumTagToForumTopic" ADD CONSTRAINT "_ForumTagToForumTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
