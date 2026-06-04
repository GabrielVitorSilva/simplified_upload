-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED');

-- AlterTable
ALTER TABLE "files" ADD COLUMN "client_id" TEXT;
ALTER TABLE "files" ADD COLUMN "status" "FileStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
