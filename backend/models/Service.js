const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
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

module.exports = Service;
