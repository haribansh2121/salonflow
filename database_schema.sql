-- SalonFlow Master Schema Creation Script
-- Target Database: MySQL / MariaDB

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tenants (The root of multi-tenancy)
CREATE TABLE IF NOT EXISTS `Tenants` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `plan` ENUM('free', 'pro', 'premium') DEFAULT 'free',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 2. TenantSettings (Configuration per salon)
CREATE TABLE IF NOT EXISTS `TenantSettings` (
  `id` INTEGER NOT NULL auto_increment,
  `tenantId` INTEGER NOT NULL UNIQUE,
  `salonName` VARCHAR(255) DEFAULT 'SalonFlow',
  `address` TEXT,
  `gstNumber` VARCHAR(255),
  `billHeader` TEXT,
  `billFooter` TEXT,
  `billDesign` ENUM('classic', 'modern', 'minimal') DEFAULT 'classic',
  `pageSize` ENUM('A4', 'A5', 'Thermal80', 'Thermal58') DEFAULT 'Thermal80',
  `logoUrl` VARCHAR(255),
  `whatsappApiKey` VARCHAR(255),
  `smsApiKey` VARCHAR(255),
  `emailApiKey` VARCHAR(255),
  `smtpHost` VARCHAR(255),
  `smtpPort` INTEGER,
  `smtpUser` VARCHAR(255),
  `smtpPass` VARCHAR(255),
  `stripePublishableKey` VARCHAR(255),
  `stripeSecretKey` VARCHAR(255),
  `currency` VARCHAR(255) DEFAULT 'INR',
  `rolePermissions` JSON,
  `enableRegistration` INTEGER DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Branches (Locations per salon)
CREATE TABLE IF NOT EXISTS `Branches` (
  `id` INTEGER NOT NULL auto_increment,
  `tenantId` INTEGER NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT,
  `gstNumber` VARCHAR(255),
  `phone` VARCHAR(255),
  `email` VARCHAR(255),
  `isActive` TINYINT(1) DEFAULT 1,
  `openingTime` VARCHAR(255) DEFAULT '09:00',
  `closingTime` VARCHAR(255) DEFAULT '21:00',
  `whatsappApiKey` VARCHAR(255),
  `smsApiKey` VARCHAR(255),
  `emailApiKey` VARCHAR(255),
  `smtpHost` VARCHAR(255),
  `smtpPort` INTEGER,
  `smtpUser` VARCHAR(255),
  `smtpPass` VARCHAR(255),
  `stripePublishableKey` VARCHAR(255),
  `stripeSecretKey` VARCHAR(255),
  `enableAutomation` TINYINT(1) DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Modules (System features)
CREATE TABLE IF NOT EXISTS `Modules` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 5. Roles (Custom roles per tenant)
CREATE TABLE IF NOT EXISTS `Roles` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `permissions` JSON,
  `tenantId` INTEGER NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_tenant_id_unique` (`name`, `tenantId`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. RolePermissions (Mapping roles to modules)
CREATE TABLE IF NOT EXISTS `RolePermissions` (
  `id` INTEGER NOT NULL auto_increment,
  `roleId` INTEGER NOT NULL,
  `moduleId` INTEGER NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_id_module_id_unique` (`roleId`, `moduleId`),
  FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`moduleId`) REFERENCES `Modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Users (Staff and Admins)
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(255),
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) DEFAULT 'STAFF',
  `roleId` INTEGER,
  `tenantId` INTEGER NOT NULL,
  `branchId` INTEGER,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. Customers
CREATE TABLE IF NOT EXISTS `Customers` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255),
  `email` VARCHAR(255),
  `gender` ENUM('Male', 'Female', 'Other'),
  `notes` TEXT,
  `totalVisits` INTEGER DEFAULT 0,
  `totalSpent` DECIMAL(10,2) DEFAULT 0.00,
  `birthday` DATE,
  `tenantId` INTEGER NOT NULL,
  `branchId` INTEGER,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Services
CREATE TABLE IF NOT EXISTS `Services` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255),
  `price` DECIMAL(10,2) NOT NULL,
  `durationMinutes` INTEGER,
  `tenantId` INTEGER NOT NULL,
  `branchId` INTEGER,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Products
CREATE TABLE IF NOT EXISTS `Products` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255),
  `price` DECIMAL(10,2) NOT NULL,
  `stock` INTEGER DEFAULT 0,
  `tenantId` INTEGER NOT NULL,
  `branchId` INTEGER,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Appointments
CREATE TABLE IF NOT EXISTS `Appointments` (
  `id` INTEGER NOT NULL auto_increment,
  `customerName` VARCHAR(255) NOT NULL,
  `customerPhone` VARCHAR(255),
  `serviceId` INTEGER,
  `staffId` INTEGER,
  `date` DATE NOT NULL,
  `time` VARCHAR(255) NOT NULL,
  `duration` INTEGER DEFAULT 30,
  `status` ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  `notes` TEXT,
  `tenantId` INTEGER NOT NULL,
  `branchId` INTEGER,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`serviceId`) REFERENCES `Services` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`staffId`) REFERENCES `Users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. Bills
CREATE TABLE IF NOT EXISTS `Bills` (
  `id` INTEGER NOT NULL auto_increment,
  `customerName` VARCHAR(255),
  `customerPhone` VARCHAR(255),
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `tax` DECIMAL(10,2) DEFAULT 0.00,
  `paymentMethod` ENUM('Cash', 'Card', 'UPI', 'Other') DEFAULT 'Cash',
  `status` ENUM('paid', 'pending', 'cancelled', 'refunded') DEFAULT 'paid',
  `notes` TEXT,
  `staffId` INTEGER,
  `tenantId` INTEGER NOT NULL,
  `branchId` INTEGER,
  `billSerial` INTEGER,
  `address` TEXT,
  `gstNumber` VARCHAR(255),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`staffId`) REFERENCES `Users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. BillItems
CREATE TABLE IF NOT EXISTS `BillItems` (
  `id` INTEGER NOT NULL auto_increment,
  `billId` INTEGER NOT NULL,
  `itemType` ENUM('service', 'product') NOT NULL,
  `itemId` INTEGER NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` INTEGER DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  `staffId` INTEGER,
  `branchId` INTEGER,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`billId`) REFERENCES `Bills` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`staffId`) REFERENCES `Users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`branchId`) REFERENCES `Branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. MarketingCampaigns
CREATE TABLE IF NOT EXISTS `MarketingCampaigns` (
  `id` INTEGER NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('whatsapp', 'sms', 'email') NOT NULL,
  `content` TEXT NOT NULL,
  `status` ENUM('draft', 'scheduled', 'sent', 'failed') DEFAULT 'draft',
  `scheduledAt` DATETIME,
  `targetAudience` VARCHAR(255),
  `tenantId` INTEGER NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenantId`) REFERENCES `Tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
