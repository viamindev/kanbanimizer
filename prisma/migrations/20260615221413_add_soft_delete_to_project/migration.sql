-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProjectInvite" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '10 days';
