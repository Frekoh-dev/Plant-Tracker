/*
  Warnings:

  - The values [FRUITING] on the enum `Plant_stage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `plant` ADD COLUMN `floweringDate` DATETIME(3) NULL,
    ADD COLUMN `ripeningDate` DATETIME(3) NULL,
    ADD COLUMN `seedDate` DATETIME(3) NULL,
    ADD COLUMN `seedlingDate` DATETIME(3) NULL,
    ADD COLUMN `vegetativeDate` DATETIME(3) NULL,
    MODIFY `stage` ENUM('SEED', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'RIPENING', 'HARVESTED') NOT NULL DEFAULT 'SEED';
