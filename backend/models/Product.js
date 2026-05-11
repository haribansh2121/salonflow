const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
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
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  margin: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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

module.exports = Product;
