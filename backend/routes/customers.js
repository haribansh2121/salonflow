const express = require('express');
const router = express.Router();
const { Customer } = require('../models');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all customers for a tenant
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (req.branchId) where.branchId = req.branchId;

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const customers = await Customer.findAll({
      where,
      order: [['name', 'ASC']]
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, gender, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const customer = await Customer.create({
      name,
      phone,
      email,
      gender,
      notes,
      tenantId: req.user.tenantId,
      branchId: req.branchId
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, gender, notes } = req.body;
    const customer = await Customer.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.update({ name, phone, email, gender, notes });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.destroy({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
