const express = require('express');
const router = express.Router();
const { Service } = require('../models');
const authMiddleware = require('../middleware/auth');

// All service routes require authentication
router.use(authMiddleware);

// Get all services for a tenant
router.get('/', async (req, res) => {
  try {
    const where = { tenantId: req.user.tenantId };
    if (req.branchId) where.branchId = req.branchId;

    const services = await Service.findAll({ where });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create a new service
router.post('/', async (req, res) => {
  try {
    const { name, category, price, durationMinutes } = req.body;
    const service = await Service.create({
      name,
      category,
      price,
      durationMinutes,
      tenantId: req.user.tenantId,
      branchId: req.branchId
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create service' });
  }
});

// Update a service
router.put('/:id', async (req, res) => {
  try {
    const { name, category, price, durationMinutes } = req.body;
    const service = await Service.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await service.update({ name, category, price, durationMinutes });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update service' });
  }
});

// Delete a service
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Service.destroy({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
