const express = require('express');
const router = express.Router();
const { Bill, BillItem, User, Product } = require('../models');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all bills for a tenant
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const where = { tenantId: req.user.tenantId };
    if (req.branchId) where.branchId = req.branchId;

    if (status) where.status = status;

    if (startDate || endDate) {
      const { Op } = require('sequelize');
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59');
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: bills, count: total } = await Bill.findAndCountAll({
      where,
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name'] },
        { model: BillItem }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      bills,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get a single bill
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name'] },
        { model: BillItem }
      ]
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// Create a new bill
router.post('/', async (req, res) => {
  try {
    const { customerType, customerId, customerName, customerPhone, customerEmail, items, paymentMethod, discount, tax, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const { Customer, Branch, TenantSetting } = require('../models');
    
    // Get Branch details for the bill
    const branchId = req.body.branchId || req.branchId;
    let billAddress = '';
    let billGst = '';

    if (branchId) {
      const branch = await Branch.findByPk(branchId);
      if (branch) {
        billAddress = branch.address;
        billGst = branch.gstNumber;
      }
    } else {
      const settings = await TenantSetting.findOne({ where: { tenantId: req.user.tenantId } });
      if (settings) {
        billAddress = settings.address;
        billGst = settings.gstNumber;
      }
    }

    // Automatically register walk-in customers to the database
    if (customerType === 'walk-in') {
      try {
        await Customer.create({
          name: customerName || 'Walk-in Customer',
          phone: customerPhone,
          email: customerEmail,
          tenantId: req.user.tenantId,
          branchId: branchId
        });
      } catch (err) {
        console.error('Failed to auto-register walk-in customer:', err);
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.price) * (item.quantity || 1);
    }
    const discountAmount = parseFloat(discount) || 0;
    const taxAmount = parseFloat(tax) || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Generate branch-specific bill serial number
    const serialWhere = { tenantId: req.user.tenantId };
    if (branchId) serialWhere.branchId = branchId;
    const lastBill = await Bill.findOne({
      where: serialWhere,
      order: [['billSerial', 'DESC']],
      attributes: ['billSerial']
    });
    const billSerial = (lastBill?.billSerial || 0) + 1;

    const bill = await Bill.create({
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      totalAmount,
      discount: discountAmount,
      tax: taxAmount,
      paymentMethod: paymentMethod || 'Cash',
      status: 'paid',
      notes,
      staffId: req.user.id,
      tenantId: req.user.tenantId,
      branchId: branchId,
      billSerial,
      address: billAddress,
      gstNumber: billGst
    });

    // Create bill items (with branchId for data isolation)
    const billItems = await Promise.all(
      items.map(item =>
        BillItem.create({
          billId: bill.id,
          itemType: item.itemType || 'service',
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
          staffId: item.staffId || null,
          branchId: branchId || null
        })
      )
    );

    // Deduct product stock
    for (const item of items) {
      if (item.itemType === 'product' && item.itemId) {
        await Product.decrement('stock', {
          by: item.quantity || 1,
          where: { id: item.itemId }
        });
      }
    }

    const fullBill = await Bill.findOne({
      where: { id: bill.id },
      include: [
        { model: User, as: 'staff', attributes: ['id', 'name'] },
        { model: BillItem }
      ]
    });

    res.status(201).json(fullBill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(400).json({ error: 'Failed to create bill', details: error.message });
  }
});

// Update bill status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await Bill.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: [{ model: BillItem }]
    });
    
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    
    // If status is cancelled or refunded, restore product stock
    if ((status === 'cancelled' || status === 'refunded') && bill.status === 'paid') {
      const { Product } = require('../models');
      for (const item of bill.BillItems) {
        if (item.itemType === 'product' && item.itemId) {
          await Product.increment('stock', {
            by: item.quantity || 1,
            where: { id: item.itemId }
          });
        }
      }
    }

    await bill.update({ status });
    res.json(bill);
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(400).json({ error: 'Failed to update bill status' });
  }
});

// Delete a bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    // Delete items first
    await BillItem.destroy({ where: { billId: bill.id } });
    await bill.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

module.exports = router;
