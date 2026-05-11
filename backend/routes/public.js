const express = require('express');
const router = express.Router();
const { Tenant, Service, User, Appointment } = require('../models');

// Get salon info for booking
router.get('/:tenantId/info', async (req, res) => {
  try {
    const { Branch } = require('../models');
    const tenant = await Tenant.findByPk(req.params.tenantId, {
      attributes: ['id', 'name']
    });
    if (!tenant) return res.status(404).json({ error: 'Salon not found' });

    const branches = await Branch.findAll({
      where: { tenantId: req.params.tenantId, isActive: true },
      attributes: ['id', 'name', 'address', 'openingTime', 'closingTime']
    });

    const services = await Service.findAll({
      where: { tenantId: req.params.tenantId },
      attributes: ['id', 'name', 'price', 'durationMinutes', 'category']
    });

    const staff = await User.findAll({
      where: { tenantId: req.params.tenantId, role: 'STAFF' },
      attributes: ['id', 'name', 'branchId']
    });

    res.json({ salon: tenant, branches, services, staff });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch salon info' });
  }
});

// Create external appointment
router.post('/:tenantId/book', async (req, res) => {
  const { customerName, customerPhone, customerEmail, serviceId, staffId, branchId, date, time, notes } = req.body;
  try {
    if (!customerName || !customerPhone || !date || !time) {
      return res.status(400).json({ error: 'Name, phone, date, and time are required' });
    }

    const bookingDateTime = new Date(`${date}T${time}`);
    if (bookingDateTime < new Date()) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }

    const { Branch, Customer } = require('../models');
    
    // Validate Branch Timing
    if (branchId) {
      const branch = await Branch.findByPk(branchId);
      if (branch && branch.openingTime && branch.closingTime) {
        if (time < branch.openingTime || time > branch.closingTime) {
          return res.status(400).json({ error: `Salon working hours: ${branch.openingTime} - ${branch.closingTime}` });
        }
      }
    }

    // Auto-register customer
    try {
      const existingCust = await Customer.findOne({ where: { phone: customerPhone, tenantId: req.params.tenantId }});
      if (!existingCust) {
        await Customer.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          tenantId: req.params.tenantId,
          branchId: branchId || null
        });
      }
    } catch (e) { console.log('Customer registration error', e); }

    const service = await Service.findByPk(serviceId);
    
    const appointment = await Appointment.create({
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      staffId,
      branchId,
      date,
      time,
      duration: service ? service.durationMinutes : 30,
      status: 'scheduled',
      notes: notes ? `Online Booking: ${notes}` : 'Online Booking',
      tenantId: req.params.tenantId
    });

    // Dual Notification
    const comms = require('../services/communication');
    
    // 1. Notify Customer
    comms.sendBookingConfirmation(req.params.tenantId, appointment, service?.name || 'Service');

    // 2. Notify Salon Admin/Staff
    const { TenantSetting } = require('../models');
    const settings = await TenantSetting.findOne({ where: { tenantId: req.params.tenantId } });
    if (settings && settings.smtpHost) {
      let staffEmail = null;
      if (staffId) {
        const assignedStaff = await User.findByPk(staffId);
        staffEmail = assignedStaff?.email;
      }
      
      // Notify Admin or Staff
      const targetEmail = staffEmail || settings.smtpUser; 
      if (targetEmail) {
        const adminMsg = `New Online Booking!\n\nCustomer: ${customerName} (${customerPhone})\nService: ${service?.name || 'Service'}\nDate: ${date}\nTime: ${time}\nNotes: ${notes || 'None'}`;
        comms.sendEmail(req.params.tenantId, targetEmail, `New Booking Alert - ${customerName}`, adminMsg, branchId);
      }
    }

    // Real-time UI Sync would typically happen via WebSockets/Socket.io
    // Since we don't have socket.io yet, the frontend will rely on polling or SWR for real-time feel

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    console.error('Online Booking Error:', error);
    res.status(400).json({ error: 'Failed to book appointment' });
  }
});

module.exports = router;
