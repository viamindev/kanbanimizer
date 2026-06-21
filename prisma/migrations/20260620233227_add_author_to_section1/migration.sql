/*
  Warnings:

  - Added the required column `authorId` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectInvite" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '10 days';

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "authorId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
