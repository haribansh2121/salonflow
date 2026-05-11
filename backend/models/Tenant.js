const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  plan: {
    type: DataTypes.ENUM('free', 'pro', 'premium'),
    defaultValue: 'free',
  }
}, {
  timestamps: true,
});

module.exports = Tenant;
