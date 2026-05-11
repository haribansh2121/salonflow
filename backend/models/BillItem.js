const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillItem = sequelize.define('BillItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  billId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  itemType: {
    type: DataTypes.ENUM('service', 'product'),
    allowNull: false,
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = BillItem;
