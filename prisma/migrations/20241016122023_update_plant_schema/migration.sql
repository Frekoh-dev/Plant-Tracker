/*
  Warnings:

  - You are about to drop the `protocol` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `protocol` DROP FOREIGN KEY `Protocol_plantId_fkey`;

-- AlterTable
ALTER TABLE `galleryimage` MODIFY `url` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `plant` ADD COLUMN `species` VARCHAR(191) NULL,
    ADD COLUMN `waterFrequency` INTEGER NULL,
    MODIFY `imageUrl` TEXT NULL;

-- DropTable
DROP TABLE `protocol`;

-- CreateTable
CREATE TABLE `ProtocolEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plantId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProtocolEntry` ADD CONSTRAINT `ProtocolEntry_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
