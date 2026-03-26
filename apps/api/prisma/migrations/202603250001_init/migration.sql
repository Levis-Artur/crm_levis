CREATE TABLE `roles` (
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `isSystem` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_statuses` (
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isTerminal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payment_statuses` (
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isFinal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `delivery_statuses` (
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isTerminal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `return_statuses` (
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isTerminal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `finance_categories` (
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `direction` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isSystem` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `roleCode` VARCHAR(50) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(32) NULL,
  `passwordHash` VARCHAR(255) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `lastLoginAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `users_email_key`(`email`),
  UNIQUE INDEX `users_phone_key`(`phone`),
  INDEX `users_role_code_idx`(`roleCode`),
  INDEX `users_is_active_created_at_idx`(`isActive`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` CHAR(36) NOT NULL,
  `orderNumber` VARCHAR(40) NOT NULL,
  `managerId` CHAR(36) NOT NULL,
  `orderStatusCode` VARCHAR(50) NOT NULL DEFAULT 'new',
  `paymentStatusCode` VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  `deliveryStatusCode` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `customerName` VARCHAR(191) NOT NULL,
  `customerPhone` VARCHAR(32) NULL,
  `customerEmail` VARCHAR(191) NULL,
  `currencyCode` CHAR(3) NOT NULL DEFAULT 'UAH',
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discountTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `placedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `orders_order_number_key`(`orderNumber`),
  INDEX `orders_manager_id_idx`(`managerId`),
  INDEX `orders_order_status_code_idx`(`orderStatusCode`),
  INDEX `orders_payment_status_code_idx`(`paymentStatusCode`),
  INDEX `orders_delivery_status_code_idx`(`deliveryStatusCode`),
  INDEX `orders_manager_id_placed_at_idx`(`managerId`, `placedAt`),
  INDEX `orders_placed_at_idx`(`placedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` CHAR(36) NOT NULL,
  `orderId` CHAR(36) NOT NULL,
  `lineNumber` INTEGER NOT NULL,
  `sku` VARCHAR(100) NULL,
  `productName` VARCHAR(191) NOT NULL,
  `quantity` INTEGER NOT NULL DEFAULT 1,
  `unitPrice` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `lineTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `order_items_order_id_line_number_key`(`orderId`, `lineNumber`),
  INDEX `order_items_order_id_idx`(`orderId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `returns` (
  `id` CHAR(36) NOT NULL,
  `returnNumber` VARCHAR(40) NOT NULL,
  `orderId` CHAR(36) NOT NULL,
  `returnStatusCode` VARCHAR(50) NOT NULL DEFAULT 'requested',
  `processedById` CHAR(36) NULL,
  `reason` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `returns_return_number_key`(`returnNumber`),
  INDEX `returns_order_id_idx`(`orderId`),
  INDEX `returns_return_status_code_idx`(`returnStatusCode`),
  INDEX `returns_processed_by_id_idx`(`processedById`),
  INDEX `returns_requested_at_idx`(`requestedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `manager_payouts` (
  `id` CHAR(36) NOT NULL,
  `managerId` CHAR(36) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `currencyCode` CHAR(3) NOT NULL DEFAULT 'UAH',
  `periodStart` DATETIME(3) NOT NULL,
  `periodEnd` DATETIME(3) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `notes` TEXT NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `manager_payouts_manager_id_period_start_period_end_key`(`managerId`, `periodStart`, `periodEnd`),
  INDEX `manager_payouts_manager_id_idx`(`managerId`),
  INDEX `manager_payouts_status_period_start_idx`(`status`, `periodStart`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shipments` (
  `id` CHAR(36) NOT NULL,
  `orderId` CHAR(36) NOT NULL,
  `deliveryStatusCode` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `provider` ENUM('NOVA_POSHTA', 'COURIER', 'PICKUP', 'OTHER') NOT NULL DEFAULT 'NOVA_POSHTA',
  `trackingNumber` VARCHAR(100) NULL,
  `recipientName` VARCHAR(191) NULL,
  `recipientPhone` VARCHAR(32) NULL,
  `destinationCity` VARCHAR(120) NULL,
  `destinationBranch` VARCHAR(120) NULL,
  `shippingCost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `metadata` JSON NULL,
  `dispatchedAt` DATETIME(3) NULL,
  `deliveredAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `shipments_provider_tracking_number_key`(`provider`, `trackingNumber`),
  INDEX `shipments_order_id_idx`(`orderId`),
  INDEX `shipments_delivery_status_code_idx`(`deliveryStatusCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `finance_transactions` (
  `id` CHAR(36) NOT NULL,
  `categoryCode` VARCHAR(50) NOT NULL,
  `managerId` CHAR(36) NULL,
  `orderId` CHAR(36) NULL,
  `returnId` CHAR(36) NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `currencyCode` CHAR(3) NOT NULL DEFAULT 'UAH',
  `reference` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `metadata` JSON NULL,
  `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `finance_transactions_category_code_idx`(`categoryCode`),
  INDEX `finance_transactions_manager_id_idx`(`managerId`),
  INDEX `finance_transactions_order_id_idx`(`orderId`),
  INDEX `finance_transactions_return_id_idx`(`returnId`),
  INDEX `finance_transactions_occurred_at_idx`(`occurredAt`),
  INDEX `finance_transactions_manager_id_occurred_at_idx`(`managerId`, `occurredAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` CHAR(36) NOT NULL,
  `actorId` CHAR(36) NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` VARCHAR(64) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `summary` VARCHAR(255) NULL,
  `changes` JSON NULL,
  `metadata` JSON NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `audit_logs_actor_id_created_at_idx`(`actorId`, `createdAt`),
  INDEX `audit_logs_entity_type_entity_id_created_at_idx`(`entityType`, `entityId`, `createdAt`),
  INDEX `audit_logs_action_created_at_idx`(`action`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `comments` (
  `id` CHAR(36) NOT NULL,
  `authorId` CHAR(36) NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId` VARCHAR(64) NOT NULL,
  `body` TEXT NOT NULL,
  `isInternal` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `comments_author_id_created_at_idx`(`authorId`, `createdAt`),
  INDEX `comments_entity_type_entity_id_created_at_idx`(`entityType`, `entityId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users`
  ADD CONSTRAINT `users_roleCode_fkey`
    FOREIGN KEY (`roleCode`) REFERENCES `roles`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_managerId_fkey`
    FOREIGN KEY (`managerId`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_orderStatusCode_fkey`
    FOREIGN KEY (`orderStatusCode`) REFERENCES `order_statuses`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_paymentStatusCode_fkey`
    FOREIGN KEY (`paymentStatusCode`) REFERENCES `payment_statuses`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_deliveryStatusCode_fkey`
    FOREIGN KEY (`deliveryStatusCode`) REFERENCES `delivery_statuses`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `returns`
  ADD CONSTRAINT `returns_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `returns_returnStatusCode_fkey`
    FOREIGN KEY (`returnStatusCode`) REFERENCES `return_statuses`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `returns_processedById_fkey`
    FOREIGN KEY (`processedById`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `manager_payouts`
  ADD CONSTRAINT `manager_payouts_managerId_fkey`
    FOREIGN KEY (`managerId`) REFERENCES `users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `shipments`
  ADD CONSTRAINT `shipments_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `shipments_deliveryStatusCode_fkey`
    FOREIGN KEY (`deliveryStatusCode`) REFERENCES `delivery_statuses`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `finance_transactions`
  ADD CONSTRAINT `finance_transactions_categoryCode_fkey`
    FOREIGN KEY (`categoryCode`) REFERENCES `finance_categories`(`code`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `finance_transactions_managerId_fkey`
    FOREIGN KEY (`managerId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `finance_transactions_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `finance_transactions_returnId_fkey`
    FOREIGN KEY (`returnId`) REFERENCES `returns`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `comments`
  ADD CONSTRAINT `comments_authorId_fkey`
    FOREIGN KEY (`authorId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
