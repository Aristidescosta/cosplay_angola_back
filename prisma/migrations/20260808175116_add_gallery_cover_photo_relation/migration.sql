-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
