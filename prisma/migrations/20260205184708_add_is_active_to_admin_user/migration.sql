/*
  Warnings:

  - You are about to drop the column `name` on the `AdminUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `AdminUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `AdminUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AdminUser_email_idx";

-- AlterTable
ALTER TABLE "AdminUser" DROP COLUMN "name",
ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "focusKeyword" TEXT,
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "ogImage" TEXT,
ALTER COLUMN "publishedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "focusKeyword" TEXT,
ADD COLUMN     "ogImage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
