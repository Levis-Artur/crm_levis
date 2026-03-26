ALTER TABLE `orders`
  ADD COLUMN `customerPhoneExtra` VARCHAR(32) NULL,
  ADD COLUMN `city` VARCHAR(120) NULL,
  ADD COLUMN `deliveryPoint` VARCHAR(191) NULL,
  ADD COLUMN `deliveryMethod` VARCHAR(100) NULL,
  ADD COLUMN `paymentMethod` VARCHAR(100) NULL,
  ADD COLUMN `purchaseAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `saleAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `marginAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `prepaymentAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `shippingCost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `internalNote` TEXT NULL,
  ADD COLUMN `cancelReason` VARCHAR(255) NULL,
  ADD COLUMN `isProblematic` BOOLEAN NOT NULL DEFAULT false,
  ADD INDEX `orders_is_problematic_placed_at_idx`(`isProblematic`, `placedAt`);

ALTER TABLE `order_items`
  ADD COLUMN `purchasePrice` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `salePrice` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE `manager_payouts`
  ADD COLUMN `createdById` CHAR(36) NULL,
  ADD INDEX `manager_payouts_created_by_id_idx`(`createdById`);

ALTER TABLE `manager_payouts`
  ADD CONSTRAINT `manager_payouts_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `shipments`
  ADD COLUMN `externalRef` VARCHAR(120) NULL,
  ADD COLUMN `declaredValue` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `cashOnDeliveryAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `rawPayloadJson` JSON NULL,
  ADD COLUMN `lastSyncedAt` DATETIME(3) NULL,
  ADD INDEX `shipments_external_ref_idx`(`externalRef`);
