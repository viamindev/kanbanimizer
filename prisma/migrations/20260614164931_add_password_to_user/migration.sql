-- AlterTable
ALTER TABLE "ProjectInvite" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '10 days';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;
