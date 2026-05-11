const express = require('express');
const router = express.Router();
const { TenantSetting } = require('../models');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');

router.use(authMiddleware);

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await TenantSetting.findOne({
      where: { tenantId: req.user.tenantId }
    });
    
    if (!settings) {
      settings = await TenantSetting.create({
        tenantId: req.user.tenantId,
        billHeader: 'Your Salon Name',
        billFooter: 'Thank you for visiting!',
        billDesign: 'classic'
      });
    }

    // RBAC: If user doesn't have 'settings' permission, only return non-sensitive fields
    const hasSettingsPerm = req.user.role === 'ADMIN' || (req.user.permissions && req.user.permissions.includes('settings'));
    
    if (!hasSettingsPerm) {
      // Return only what's needed for Sidebar and Billing
      return res.json({
        salonName: settings.salonName,
        billHeader: settings.billHeader,
        billFooter: settings.billFooter,
        billDesign: settings.billDesign,
        pageSize: settings.pageSize,
        logoUrl: settings.logoUrl,
        currency: settings.currency
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', checkPermission('settings'), async (req, res) => {
  try {
    const settings = await TenantSetting.findOne({
      where: { tenantId: req.user.tenantId }
    });
    
    await settings.update(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Settings Update Error:', error);
    res.status(400).json({ error: 'Failed to update settings' });
  }
});

// Test SMTP connection
const comms = require('../services/communication');
const { User } = require('../models');
router.post('/test-email', checkPermission('settings'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const success = await comms.sendEmail(
      req.user.tenantId, 
      user.email, 
      'SalonFlow SMTP Test', 
      'This is a test email to verify your SMTP settings. If you received this, your email configuration is working correctly! 🚀'
    );
    
    if (success) {
      res.json({ message: 'Test email sent successfully to ' + user.email });
    } else {
      res.status(500).json({ error: 'Failed to send test email. Please check your SMTP settings and server logs for details.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
