const express = require('express');
const router = express.Router();
const { MarketingCampaign, Customer } = require('../models');
const comms = require('../services/communication');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.findAll({
      where: { tenantId: req.user.tenantId },
      order: [['createdAt', 'DESC']]
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Send promotional message
router.post('/send', async (req, res) => {
  const { type, content, targetAudience, customerId } = req.body;
  try {
    const campaign = await MarketingCampaign.create({
      name: `Promo ${new Date().toLocaleDateString()}`,
      type,
      content,
      status: 'draft',
      tenantId: req.user.tenantId
    });

    // Determine target customers
    let customers = [];
    const baseWhere = { tenantId: req.user.tenantId };

    if (targetAudience === 'individual' && customerId) {
      customers = await Customer.findAll({ where: { ...baseWhere, id: customerId } });
    } else if (targetAudience === 'frequent') {
      customers = await Customer.findAll({ where: { ...baseWhere, totalVisits: { [require('sequelize').Op.gte]: 5 } } });
    } else if (targetAudience === 'lapsed') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      customers = await Customer.findAll({ where: { ...baseWhere, updatedAt: { [require('sequelize').Op.lte]: thirtyDaysAgo } } });
    } else {
      // Default: 'all'
      customers = await Customer.findAll({ where: baseWhere });
    }
    
    // Send messages (in parallel for better performance in this small scale)
    await Promise.all(customers.map(async (customer) => {
      const msg = content.replace('{name}', customer.name);
      if (type === 'whatsapp' && customer.phone) await comms.sendWhatsApp(req.user.tenantId, customer.phone, msg);
      if (type === 'sms' && customer.phone) await comms.sendSMS(req.user.tenantId, customer.phone, msg);
      if (type === 'email' && customer.email) await comms.sendEmail(req.user.tenantId, customer.email, 'Special Offer - SalonFlow', msg);
    }));

    await campaign.update({ status: 'sent' });
    res.json({ message: 'Campaign sent successfully', campaign, recipientCount: customers.length });
  } catch (error) {
    console.error('Marketing Send Error:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

module.exports = router;
