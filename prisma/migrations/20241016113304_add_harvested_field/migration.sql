/*
  Warnings:

  - You are about to drop the column `species` on the `plant` table. All the data in the column will be lost.
  - You are about to drop the column `waterFrequency` on the `plant` table. All the data in the column will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `GalleryImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Protocol` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `galleryimage` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `url` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `plant` DROP COLUMN `species`,
    DROP COLUMN `waterFrequency`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `harvested` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ALTER COLUMN `stage` DROP DEFAULT;

-- AlterTable
ALTER TABLE `protocol` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ALTER COLUMN `date` DROP DEFAULT;

-- DropTable
DROP TABLE `user`;
