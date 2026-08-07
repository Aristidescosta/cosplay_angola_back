/*
  Warnings:

  - You are about to drop the column `showcaseVideoUrl` on the `galleries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "showcaseVideoUrl" TEXT;

-- AlterTable
ALTER TABLE "galleries" DROP COLUMN "showcaseVideoUrl";
