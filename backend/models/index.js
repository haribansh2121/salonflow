const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const User = require('./User');
const Service = require('./Service');
const Product = require('./Product');
const Bill = require('./Bill');
const BillItem = require('./BillItem');
const Customer = require('./Customer');
const Appointment = require('./Appointment');
const TenantSetting = require('./TenantSetting');
const MarketingCampaign = require('./MarketingCampaign');
const Branch = require('./Branch');
const Role = require('./Role');
const Module = require('./Module');
const RolePermission = require('./RolePermission');

// ── Tenant Associations ──
User.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(User, { foreignKey: 'tenantId' });

Role.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Role, { foreignKey: 'tenantId' });

User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

Role.belongsToMany(Module, { through: RolePermission, foreignKey: 'roleId' });
Module.belongsToMany(Role, { through: RolePermission, foreignKey: 'moduleId' });
Role.hasMany(RolePermission, { foreignKey: 'roleId' });
RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
Module.hasMany(RolePermission, { foreignKey: 'moduleId' });
RolePermission.belongsTo(Module, { foreignKey: 'moduleId' });

Branch.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Branch, { foreignKey: 'tenantId' });

Service.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Service, { foreignKey: 'tenantId' });

Product.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Product, { foreignKey: 'tenantId' });

Bill.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Bill, { foreignKey: 'tenantId' });

Customer.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Customer, { foreignKey: 'tenantId' });

Appointment.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Appointment, { foreignKey: 'tenantId' });

TenantSetting.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasOne(TenantSetting, { foreignKey: 'tenantId' });

MarketingCampaign.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(MarketingCampaign, { foreignKey: 'tenantId' });

// ── Branch Associations ──
User.belongsTo(Branch, { foreignKey: 'branchId' });
Branch.hasMany(User, { foreignKey: 'branchId' });

Bill.belongsTo(Branch, { foreignKey: 'branchId' });
Branch.hasMany(Bill, { foreignKey: 'branchId' });

// ── Bill Associations ──
Bill.belongsTo(User, { as: 'staff', foreignKey: 'staffId' });
BillItem.belongsTo(User, { as: 'performer', foreignKey: 'staffId' });
User.hasMany(Bill, { foreignKey: 'staffId' });
User.hasMany(BillItem, { foreignKey: 'staffId' });

BillItem.belongsTo(Bill, { foreignKey: 'billId', onDelete: 'CASCADE' });
Bill.hasMany(BillItem, { foreignKey: 'billId' });

// ── Appointment Associations ──
Appointment.belongsTo(Service, { foreignKey: 'serviceId' });
Service.hasMany(Appointment, { foreignKey: 'serviceId' });

Appointment.belongsTo(User, { as: 'assignedStaff', foreignKey: 'staffId' });
User.hasMany(Appointment, { as: 'appointments', foreignKey: 'staffId' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Service,
  Product,
  Bill,
  BillItem,
  Customer,
  Appointment,
  TenantSetting,
  MarketingCampaign,
  Branch,
  Role,
  Module,
  RolePermission
};
