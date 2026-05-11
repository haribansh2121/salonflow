# SalonFlow Master Configuration

This document contains the master configuration and database scripts for managing the multi-tenant SalonFlow SaaS platform.

## Database Scripts

### Create New Salon (Manual Setup)

Use the following SQL script to manually initialize a new salon (tenant) with its first admin user and default settings.

**Variables to replace:**
- `{{SALON_NAME}}`: The display name of the salon.
- `{{ADMIN_NAME}}`: Name of the salon owner/admin.
- `{{ADMIN_EMAIL}}`: Login email for the admin.
- `{{PASSWORD_HASH}}`: BCrypt hash of the admin password. (Example for 'password123': `$2a$10$7Z/8H.l9Nn6Gj7q5S7p9.O7Vz0E7zGj7q5S7p9.O7Vz0E7zGj7q5`)

```sql
-- 1. Create the Tenant (ID will be auto-generated)
INSERT INTO Tenants (name, plan, createdAt, updatedAt) 
VALUES ('{{SALON_NAME}}', 'pro', NOW(), NOW());

-- 2. GET the generated ID (e.g. 1, 2, 3...)
SET @new_tenant_id = LAST_INSERT_ID();

-- 3. Initialize Tenant Settings
INSERT INTO TenantSettings (tenantId, salonName, pageSize, currency, autoBookingConfirm, createdAt, updatedAt)
VALUES (@new_tenant_id, '{{SALON_NAME}}', 'Thermal80', 'INR', true, NOW(), NOW());

-- 4. Create the Main Branch
INSERT INTO Branches (tenantId, name, isActive, createdAt, updatedAt)
VALUES (@new_tenant_id, 'Main Branch', true, NOW(), NOW());
SET @new_branch_id = LAST_INSERT_ID();

-- 5. Create the Admin User
INSERT INTO Users (name, email, passwordHash, role, tenantId, branchId, createdAt, updatedAt)
VALUES ('{{ADMIN_NAME}}', '{{ADMIN_EMAIL}}', '{{PASSWORD_HASH}}', 'ADMIN', @new_tenant_id, @new_branch_id, NOW(), NOW());
```

---

## Global Configuration Notes

- **Data Isolation**: All tables (Bills, Appointments, Products, Services, Customers) have a numeric `tenantId` column.
- **Branch Management**: Users with the `ADMIN` role can toggle between branches. `STAFF` users are restricted to their assigned `branchId`.
- **API Security**: All requests include a valid JWT and the current branch context in the `X-Branch-Id` header.

---

## Fresh Start (Clear Everything & Recreate)

If you are facing "Incompatible Columns" (Error 3780) or foreign key constraint issues, the best way is to **Drop and Recreate**.

### Step 1: Wipe the Database
Run this script to completely delete all tables and their complex constraints.

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all existing tables
DROP TABLE IF EXISTS BillItems;
DROP TABLE IF EXISTS Bills;
DROP TABLE IF EXISTS Appointments;
DROP TABLE IF EXISTS MarketingCampaigns;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Services;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Branches;
DROP TABLE IF EXISTS TenantSettings;
DROP TABLE IF EXISTS Tenants;

SET FOREIGN_KEY_CHECKS = 1;
```

### Step 2: Recreate Tables
**Restart your backend server.** 
Since `server.js` is configured with `sequelize.sync({ alter: true })`, it will automatically detect the missing tables and recreate them perfectly using the new numeric `INTEGER` IDs defined in the models.

### Step 3: Load Dummy Data
Once the server has started and tables are recreated, run this script to load testing data:

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- Salon 1: "Glitz & Glamour"
INSERT INTO Tenants (name, plan, createdAt, updatedAt) VALUES ('Glitz & Glamour', 'premium', NOW(), NOW());
SET @t1 = LAST_INSERT_ID();

INSERT INTO TenantSettings (tenantId, salonName, currency, pageSize, createdAt, updatedAt) 
VALUES (@t1, 'Glitz & Glamour', 'INR', 'Thermal80', NOW(), NOW());

INSERT INTO Branches (tenantId, name, address, phone, createdAt, updatedAt) 
VALUES (@t1, 'Main HQ - Downtown', '101 Fashion St, Mumbai', '9876543210', NOW(), NOW());
SET @b1 = LAST_INSERT_ID();

INSERT INTO Users (name, email, passwordHash, role, tenantId, branchId, createdAt, updatedAt) 
VALUES ('Super Admin', 'admin@glitz.com', '$2a$10$7Z/8H.l9Nn6Gj7q5S7p9.O7Vz0E7zGj7q5S7p9.O7Vz0E7zGj7q5', 'ADMIN', @t1, @b1, NOW(), NOW());

-- Salon 2: "Style Studio"
INSERT INTO Tenants (name, plan, createdAt, updatedAt) VALUES ('Style Studio', 'pro', NOW(), NOW());
SET @t2 = LAST_INSERT_ID();

INSERT INTO TenantSettings (tenantId, salonName, currency, pageSize, createdAt, updatedAt) 
VALUES (@t2, 'Style Studio', 'INR', 'A4', NOW(), NOW());

INSERT INTO Branches (tenantId, name, address, createdAt, updatedAt) 
VALUES (@t2, 'Suburban Branch', 'Goregaon West, Mumbai', NOW(), NOW());
SET @b2 = LAST_INSERT_ID();

INSERT INTO Users (name, email, passwordHash, role, tenantId, branchId, createdAt, updatedAt) 
VALUES ('Admin User', 'admin@style.com', '$2a$10$7Z/8H.l9Nn6Gj7q5S7p9.O7Vz0E7zGj7q5S7p9.O7Vz0E7zGj7q5', 'ADMIN', @t2, @b2, NOW(), NOW());

-- Sample Services & Products for Salon 1
INSERT INTO Services (name, category, price, durationMinutes, tenantId, branchId, createdAt, updatedAt)
VALUES ('Haircut', 'Hair', 500, 30, @t1, @b1, NOW(), NOW()),
       ('Facial', 'Skin', 1200, 60, @t1, @b1, NOW(), NOW());

INSERT INTO Products (name, category, price, stock, tenantId, branchId, createdAt, updatedAt)
VALUES ('Shampoo 250ml', 'Haircare', 450, 20, @t1, @b1, NOW(), NOW()),
       ('Face Cream', 'Skincare', 800, 15, @t1, @b1, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
```
