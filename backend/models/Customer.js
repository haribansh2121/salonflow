const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
  },
  notes: {
    type: DataTypes.TEXT,
  },
  totalVisits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  birthday: {
    type: DataTypes.DATEONLY,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Customer;
