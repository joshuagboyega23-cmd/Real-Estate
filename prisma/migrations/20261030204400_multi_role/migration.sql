-- AlterTable
ALTER TABLE "User" ADD COLUMN "roles" "Role"[] NOT NULL DEFAULT ARRAY['TENANT'::"Role"];
ALTER TABLE "User" ADD COLUMN "lastActiveRole" "Role";

-- Backfill
UPDATE "User" SET "roles" = ARRAY["role"]::"Role"[], "lastActiveRole" = "role";

-- Drop old column
ALTER TABLE "User" DROP COLUMN "role";

