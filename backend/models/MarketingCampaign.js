const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingCampaign = sequelize.define('MarketingCampaign', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('whatsapp', 'sms', 'email'), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('draft', 'scheduled', 'sent', 'failed'), defaultValue: 'draft' },
  scheduledAt: { type: DataTypes.DATE },
  targetAudience: { type: DataTypes.STRING }, // e.g., "all", "frequent", "lapsed"
  tenantId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  timestamps: true,
});

module.exports = MarketingCampaign;
