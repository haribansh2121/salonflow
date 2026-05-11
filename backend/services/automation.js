const cron = require('node-cron');
const { Customer, TenantSetting, sequelize } = require('../models');
const comms = require('./communication');
const { Op } = require('sequelize');

class AutomationService {
  init() {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', () => {
      console.log('[Automation] Running daily tasks...');
      this.processBirthdayWishes();
    });
    
    console.log('[Automation] Service initialized.');
  }

  async processBirthdayWishes() {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Find all customers whose birthday is today (ignoring year)
      // MySQL Dialect version
      const customers = await Customer.findAll({
        where: sequelize.where(
          sequelize.fn('DATE_FORMAT', sequelize.col('birthday'), '%m-%d'),
          `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        )
      });

      console.log(`[Automation] Found ${customers.length} birthdays today.`);

      for (const customer of customers) {
        if (customer.branchId) {
          const { Branch } = require('../models');
          const branch = await Branch.findByPk(customer.branchId);
          if (branch && branch.enableAutomation === false) {
            console.log(`[Automation] Skipped birthday wish for ${customer.name} (Branch automation disabled)`);
            continue;
          }
        }
        await comms.sendBirthdayWish(customer.tenantId, customer, customer.branchId);
      }
    } catch (error) {
      console.error('[Automation Error] Birthday processing failed:', error);
    }
  }
}

module.exports = new AutomationService();
