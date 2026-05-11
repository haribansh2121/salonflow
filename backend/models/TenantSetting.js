const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantSetting = sequelize.define('TenantSetting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  // General Info
  salonName: { type: DataTypes.STRING, defaultValue: 'SalonFlow' },
  address: { type: DataTypes.TEXT },
  gstNumber: { type: DataTypes.STRING },

  // Bill Design
  billHeader: { type: DataTypes.TEXT },
  billFooter: { type: DataTypes.TEXT },
  billDesign: {
    type: DataTypes.ENUM('classic', 'modern', 'minimal'),
    defaultValue: 'classic'
  },
  pageSize: {
    type: DataTypes.ENUM('A4', 'A5', 'Thermal80', 'Thermal58'),
    defaultValue: 'Thermal80'
  },
  logoUrl: { type: DataTypes.STRING },

  // Communications (API Keys & SMTP)
  whatsappApiKey: { type: DataTypes.STRING },
  smsApiKey: { type: DataTypes.STRING },
  emailApiKey: { type: DataTypes.STRING }, // For SendGrid/Resend
  smtpHost: { type: DataTypes.STRING },
  smtpPort: { type: DataTypes.INTEGER },
  smtpUser: { type: DataTypes.STRING },
  smtpPass: { type: DataTypes.STRING },

  // Payment Gateway
  stripePublishableKey: { type: DataTypes.STRING },
  stripeSecretKey: { type: DataTypes.STRING },
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },

  // Role Permissions Mapping
  rolePermissions: {
    type: DataTypes.JSON,
    defaultValue: {
      STAFF: ['appointments', 'billing', 'services', 'customers'],
      ADMIN: ['appointments', 'billing', 'services', 'products', 'customers', 'staff', 'reports', 'marketing', 'settings']
    }
  },
  // Feature Toggles
  enableRegistration: { type: DataTypes.INTEGER, defaultValue: 1 }, // 1 = Enabled, 0 = Disabled
}, {
  timestamps: true,
});

module.exports = TenantSetting;
