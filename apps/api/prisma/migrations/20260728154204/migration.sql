/*
  Warnings:

  - The values [REFFERAL] on the enum `LeadSource` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contactedAt` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LeadSource_new" AS ENUM ('MANUAL', 'WEBSITE', 'LINKEDIN', 'REFERRAL', 'EMAIL', 'PHONE', 'EVENT', 'ADVERTISING', 'OTHER');
ALTER TABLE "public"."Lead" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "source" TYPE "LeadSource_new" USING ("source"::text::"LeadSource_new");
ALTER TYPE "LeadSource" RENAME TO "LeadSource_old";
ALTER TYPE "LeadSource_new" RENAME TO "LeadSource";
DROP TYPE "public"."LeadSource_old";
ALTER TABLE "Lead" ALTER COLUMN "source" SET DEFAULT 'MANUAL';
COMMIT;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "contactedAt",
ADD COLUMN     "contractedAt" TIMESTAMP(3);
