-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_firstname" ON "User"("first_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_lastname" ON "User"("last_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

