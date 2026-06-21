-- AlterTable
ALTER TABLE "ProjectInvite" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '10 days';
