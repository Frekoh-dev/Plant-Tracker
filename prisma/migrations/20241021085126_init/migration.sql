/*
  Warnings:

  - You are about to drop the column `userId` on the `plant` table. All the data in the column will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `plant` DROP FOREIGN KEY `Plant_userId_fkey`;

-- AlterTable
ALTER TABLE `plant` DROP COLUMN `userId`;

-- DropTable
DROP TABLE `user`;
