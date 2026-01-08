-- AlterTable: Rename existing date columns and add new end date columns
ALTER TABLE "monuments" RENAME COLUMN "m_date" TO "start_date";
ALTER TABLE "monuments" RENAME COLUMN "m_date_Hijri" TO "start_date_Hijri";
ALTER TABLE "monuments" ADD COLUMN "end_date" VARCHAR;
ALTER TABLE "monuments" ADD COLUMN "end_date_Hijri" VARCHAR;
