const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerPhone: {
    type: DataTypes.STRING,
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'scheduled',
  },
  notes: {
    type: DataTypes.TEXT,
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

module.exports = Appointment;
