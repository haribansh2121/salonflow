const express = require('express');
const router = express.Router();
const { Bill, BillItem, User, Service, Product, Appointment, sequelize } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Revenue & P&L Report
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {
      tenantId: req.user.tenantId,
      status: { [Op.notIn]: ['cancelled', 'refunded'] },
      createdAt: {
        [Op.between]: [
          startDate ? new Date(startDate + 'T00:00:00') : new Date('2000-01-01'),
          endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-12-31')
        ]
      }
    };
    if (req.branchId) where.branchId = req.branchId;

    const bills = await Bill.findAll({
      where,
      include: [{ model: BillItem }]
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let serviceRevenue = 0;
    let productRevenue = 0;

    for (const bill of bills) {
      totalRevenue += parseFloat(bill.totalAmount);
      for (const item of bill.BillItems) {
        if (item.itemType === 'service') {
          serviceRevenue += parseFloat(item.price) * item.quantity;
        } else {
          productRevenue += parseFloat(item.price) * item.quantity;
          // Try to find product cost
          const product = await Product.findByPk(item.itemId);
          if (product) {
            totalCost += parseFloat(product.costPrice || 0) * item.quantity;
          }
        }
      }
    }

    res.json({
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      serviceRevenue,
      productRevenue,
      billCount: bills.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff-wise Revenue
router.get('/staff-wise', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const staffRevenue = await BillItem.findAll({
      attributes: [
        'staffId',
        [sequelize.fn('SUM', sequelize.literal('BillItem.price * BillItem.quantity')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('BillItem.id')), 'itemCount']
      ],
      include: [
        { model: User, as: 'performer', attributes: ['name'] },
        { 
          model: Bill, 
          attributes: [], 
          where: { 
            tenantId: req.user.tenantId,
            status: { [Op.notIn]: ['cancelled', 'refunded'] },
            ...(req.branchId ? { branchId: req.branchId } : {})
          } 
        }
      ],
      where: {
        staffId: { [Op.ne]: null },
        createdAt: {
          [Op.between]: [
            startDate ? new Date(startDate + 'T00:00:00') : new Date('2000-01-01'),
            endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-12-31')
          ]
        }
      },
      group: ['staffId', 'performer.id'],
      raw: true,
      nest: true
    });
    res.json(staffRevenue);
  } catch (error) {
    console.error('Staff Report Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Service-wise Revenue
router.get('/service-wise', async (req, res) => {
  try {
    const serviceRevenue = await BillItem.findAll({
      attributes: [
        'name',
        [sequelize.fn('SUM', sequelize.literal('BillItem.price * BillItem.quantity')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('BillItem.id')), 'count']
      ],
      include: [
        { 
          model: Bill, 
          attributes: [], 
          where: { 
            tenantId: req.user.tenantId,
            status: { [Op.notIn]: ['cancelled', 'refunded'] },
            ...(req.branchId ? { branchId: req.branchId } : {})
          } 
        }
      ],
      where: { itemType: 'service' },
      group: ['name'],
      raw: true
    });
    res.json(serviceRevenue);
  } catch (error) {
    console.error('Service Report Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Product-wise Revenue
router.get('/product-wise', async (req, res) => {
  try {
    const productRevenue = await BillItem.findAll({
      attributes: [
        'name',
        [sequelize.fn('SUM', sequelize.literal('BillItem.price * BillItem.quantity')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('BillItem.id')), 'count']
      ],
      include: [
        { 
          model: Bill, 
          attributes: [], 
          where: { 
            tenantId: req.user.tenantId,
            status: { [Op.notIn]: ['cancelled', 'refunded'] },
            ...(req.branchId ? { branchId: req.branchId } : {})
          } 
        }
      ],
      where: { itemType: 'product' },
      group: ['name'],
      raw: true
    });
    res.json(productRevenue);
  } catch (error) {
    console.error('Product Report Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customer-wise Revenue
router.get('/customer-wise', async (req, res) => {
  try {
    const customerRevenue = await Bill.findAll({
      attributes: [
        'customerName',
        'customerPhone',
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'visitCount']
      ],
      where: { 
        tenantId: req.user.tenantId,
        status: { [Op.notIn]: ['cancelled', 'refunded'] },
        ...(req.branchId ? { branchId: req.branchId } : {})
      },
      group: ['customerName', 'customerPhone'],
      order: [[sequelize.literal('totalSpent'), 'DESC']],
      limit: 10
    });
    res.json(customerRevenue);
  } catch (error) {
    console.error('Customer Report Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment Method Breakdown
router.get('/payment-methods', async (req, res) => {
  try {
    const payments = await Bill.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { 
        tenantId: req.user.tenantId,
        status: { [Op.notIn]: ['cancelled', 'refunded'] },
        ...(req.branchId ? { branchId: req.branchId } : {})
      },
      group: ['paymentMethod']
    });
    res.json(payments);
  } catch (error) {
    console.error('Payment Stats Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Appointment Status Report
router.get('/appointment-stats', async (req, res) => {
  try {
    const stats = await Appointment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { 
        tenantId: req.user.tenantId,
        ...(req.branchId ? { branchId: req.branchId } : {})
      },
      group: ['status']
    });
    res.json(stats);
  } catch (error) {
    console.error('Appointment Stats Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
