const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  gstNumber: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Salon Timing
  openingTime: { type: DataTypes.STRING, defaultValue: '09:00' },
  closingTime: { type: DataTypes.STRING, defaultValue: '21:00' },
  // Communications (Branch Specific)
  whatsappApiKey: { type: DataTypes.STRING },
  smsApiKey: { type: DataTypes.STRING },
  emailApiKey: { type: DataTypes.STRING },
  smtpHost: { type: DataTypes.STRING },
  smtpPort: { type: DataTypes.INTEGER },
  smtpUser: { type: DataTypes.STRING },
  smtpPass: { type: DataTypes.STRING },
  // Payment Gateway (Branch Specific)
  stripePublishableKey: { type: DataTypes.STRING },
  stripeSecretKey: { type: DataTypes.STRING },
  // Automation Toggle
  enableAutomation: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
});

module.exports = Branch;
