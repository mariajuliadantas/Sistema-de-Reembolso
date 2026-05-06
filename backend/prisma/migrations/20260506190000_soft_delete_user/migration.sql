-- Add soft delete column for users
ALTER TABLE "users" ADD COLUMN "deletedAt" DATETIME;
