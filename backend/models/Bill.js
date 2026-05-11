const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bill = sequelize.define('Bill', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerName: {
    type: DataTypes.STRING,
  },
  customerPhone: {
    type: DataTypes.STRING,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Card', 'UPI', 'Other'),
    defaultValue: 'Cash',
  },
  status: {
    type: DataTypes.ENUM('paid', 'pending', 'cancelled', 'refunded'),
    defaultValue: 'paid',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Branch-specific sequential bill number (resets per branch, starts from 1)
  billSerial: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Branch-specific sequential bill number. Resets to 1 per branch.'
  },
  address: {
    type: DataTypes.TEXT,
  },
  gstNumber: {
    type: DataTypes.STRING,
  }
}, {
  timestamps: true,
});

module.exports = Bill;
