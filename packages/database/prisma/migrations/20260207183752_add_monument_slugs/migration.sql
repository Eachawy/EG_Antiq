-- AlterTable
ALTER TABLE "monuments" ADD COLUMN     "slug_ar" VARCHAR(255),
ADD COLUMN     "slug_en" VARCHAR(255);

-- CreateIndex
CREATE INDEX "monuments_slug_en_idx" ON "monuments"("slug_en");

-- CreateIndex
CREATE INDEX "monuments_slug_ar_idx" ON "monuments"("slug_ar");
