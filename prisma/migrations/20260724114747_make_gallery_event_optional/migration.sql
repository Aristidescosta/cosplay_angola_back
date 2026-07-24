-- DropForeignKey
ALTER TABLE "galleries" DROP CONSTRAINT "galleries_eventId_fkey";

-- AlterTable
ALTER TABLE "galleries" ALTER COLUMN "eventId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
