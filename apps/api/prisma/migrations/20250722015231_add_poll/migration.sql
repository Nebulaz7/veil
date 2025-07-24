/*
  Warnings:

  - You are about to drop the column `isActive` on the `Poll` table. All the data in the column will be lost.
  - Added the required column `name` to the `Poll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "isActive",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;
