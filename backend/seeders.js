const { Module } = require('./models');

const seedModules = async () => {
  const modules = [
    { name: 'Appointments', key: 'appointments', description: 'Manage bookings and schedule' },
    { name: 'Billing', key: 'billing', description: 'Create bills and track sales' },
    { name: 'Services', key: 'services', description: 'Manage salon services catalog' },
    { name: 'Products', key: 'products', description: 'Inventory and product management' },
    { name: 'Customers', key: 'customers', description: 'Customer database and history' },
    { name: 'Staff', key: 'staff', description: 'Staff management and attendance' },
    { name: 'Marketing', key: 'marketing', description: 'Campaigns and engagement' },
    { name: 'Reports', key: 'reports', description: 'Analytics and revenue reports' },
    { name: 'Settings', key: 'settings', description: 'Salon branding and configuration' },
  ];

  for (const m of modules) {
    await Module.findOrCreate({
      where: { key: m.key },
      defaults: m
    });
  }
  console.log('Modules seeded successfully');
};

module.exports = seedModules;
