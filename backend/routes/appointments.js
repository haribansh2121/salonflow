const express = require('express');
const router = express.Router();
const { Appointment, Service, User } = require('../models');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all appointments for a tenant
router.get('/', async (req, res) => {
  try {
    const { date, status, staffId } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (req.branchId) where.branchId = req.branchId;

    if (date) where.date = date;
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Service, attributes: ['id', 'name', 'price', 'durationMinutes'] },
        { model: User, as: 'assignedStaff', attributes: ['id', 'name'] }
      ],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: [
        { model: Service, attributes: ['id', 'name', 'price', 'durationMinutes'] },
        { model: User, as: 'assignedStaff', attributes: ['id', 'name'] }
      ]
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create appointment
router.post('/', async (req, res) => {
  try {
    const { customerType, customerId, customerName, customerPhone, customerEmail, serviceId, staffId, date, time, duration, notes } = req.body;
    if (!customerName || !date || !time) {
      return res.status(400).json({ error: 'Customer name, date, and time are required' });
    }

    // Validation: Prevent past date/time
    const bookingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    if (bookingDateTime < now) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }

    // Validation: Salon Timing (Branch specific)
    if (req.branchId) {
      const { Branch } = require('../models');
      const branch = await Branch.findByPk(req.branchId);
      if (branch && branch.openingTime && branch.closingTime) {
        if (time < branch.openingTime || time > branch.closingTime) {
          return res.status(400).json({ error: `Salon is closed at this time. Working hours: ${branch.openingTime} - ${branch.closingTime}` });
        }
      }
    }

    const { Customer } = require('../models');
    
    // Automatically register walk-in customers to the database
    if (customerType === 'walk-in') {
      try {
        await Customer.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          tenantId: req.user.tenantId,
          branchId: req.branchId
        });
      } catch (err) {
        console.error('Failed to auto-register walk-in customer:', err);
      }
    }

    const appointment = await Appointment.create({
      customerName,
      customerPhone,
      serviceId,
      staffId,
      date,
      time,
      duration: duration || 30,
      status: 'scheduled',
      notes,
      tenantId: req.user.tenantId,
      branchId: req.branchId
    });

    const fullAppointment = await Appointment.findOne({
      where: { id: appointment.id },
      include: [
        { model: Service, attributes: ['id', 'name', 'price', 'durationMinutes'] },
        { model: User, as: 'assignedStaff', attributes: ['id', 'name'] }
      ]
    });

    // Send async confirmation
    const comms = require('../services/communication');
    comms.sendBookingConfirmation(req.user.tenantId, fullAppointment, fullAppointment.Service?.name || 'Service');

    res.status(201).json(fullAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { customerName, customerPhone, serviceId, staffId, date, time, duration, status, notes } = req.body;
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    await appointment.update({ customerName, customerPhone, serviceId, staffId, date, time, duration, status, notes });

    const updated = await Appointment.findOne({
      where: { id: appointment.id },
      include: [
        { model: Service, attributes: ['id', 'name', 'price', 'durationMinutes'] },
        { model: User, as: 'assignedStaff', attributes: ['id', 'name'] }
      ]
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update appointment' });
  }
});

// Update appointment status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    await appointment.update({ status });
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update appointment status' });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.destroy({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
