const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize, Tenant, User, Service, Product, Bill, BillItem, Customer, Appointment, TenantSetting, MarketingCampaign } = require('./models');
const automationService = require('./services/automation');
const seedModules = require('./seeders');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ──
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const productRoutes = require('./routes/products');
const billRoutes = require('./routes/bills');
const customerRoutes = require('./routes/customers');
const appointmentRoutes = require('./routes/appointments');
const staffRoutes = require('./routes/staff');
const settingsRoutes = require('./routes/settings');
const marketingRoutes = require('./routes/marketing');
const publicRoutes = require('./routes/public');
const reportsRoutes = require('./routes/reports');
const branchRoutes = require('./routes/branches');
const rolesRoutes = require('./routes/roles');
const authMiddleware = require('./middleware/auth');
const checkPermission = require('./middleware/permission');

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

app.use('/api/customers', authMiddleware, checkPermission('customers'), customerRoutes);
app.use('/api/services', authMiddleware, checkPermission('services'), serviceRoutes);
app.use('/api/products', authMiddleware, checkPermission('products'), productRoutes);
app.use('/api/bills', authMiddleware, checkPermission('billing'), billRoutes);
app.use('/api/staff', authMiddleware, checkPermission('staff'), staffRoutes);
app.use('/api/branches', authMiddleware, branchRoutes);
app.use('/api/appointments', authMiddleware, checkPermission('appointments'), appointmentRoutes);
app.use('/api/reports', authMiddleware, checkPermission('reports'), reportsRoutes);
app.use('/api/marketing', authMiddleware, checkPermission('marketing'), marketingRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/roles', authMiddleware, rolesRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'SalonFlow API is running', version: '1.0.0' });
});

// ── Analytics ──
app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branchId = req.branchId;
    const where = { tenantId };
    if (branchId) where.branchId = branchId;

    const activeWhere = { ...where, status: { [require('sequelize').Op.notIn]: ['cancelled', 'refunded'] } };
    const totalRevenue = await Bill.sum('totalAmount', { where: activeWhere }) || 0;
    const totalBills = await Bill.count({ where: activeWhere });
    const totalCustomers = await Customer.count({ where });
    const totalStaff = await User.count({ where: { ...where, role: 'STAFF' } });
    const totalAppointments = await Appointment.count({ where: { ...where, status: 'scheduled' } });

    const revenueByDay = await sequelize.query(`
      SELECT DATE(createdAt) as date, SUM(totalAmount) as revenue 
      FROM Bills 
      WHERE tenantId = :tenantId 
      ${branchId ? 'AND branchId = :branchId' : ''}
      AND status NOT IN ('cancelled', 'refunded')
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, {
      replacements: { tenantId, branchId },
      type: sequelize.QueryTypes.SELECT
    });

    const topServices = await sequelize.query(`
      SELECT bi.name, COUNT(*) as count
      FROM BillItems bi
      JOIN Bills b ON bi.billId = b.id
      WHERE b.tenantId = :tenantId 
      ${branchId ? 'AND b.branchId = :branchId' : ''}
      AND b.status NOT IN ('cancelled', 'refunded')
      AND bi.itemType = 'service'
      GROUP BY bi.name
      ORDER BY count DESC
      LIMIT 5
    `, {
      replacements: { tenantId, branchId },
      type: sequelize.QueryTypes.SELECT
    });

    const recentBills = await Bill.findAll({
      where,
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'staff', attributes: ['name'] }]
    });

    const todayAppointments = await Appointment.findAll({
      where: { 
        ...where,
        date: new Date().toISOString().split('T')[0] 
      },
      include: [
        { model: Service, attributes: ['name'] }, 
        { model: User, as: 'assignedStaff', attributes: ['name'] }
      ],
      order: [['time', 'ASC']],
      limit: 5
    });

    const lowStockProducts = await Product.findAll({
      where: { 
        ...where,
        stock: { [require('sequelize').Op.lte]: 5 } 
      },
      limit: 5
    });

    res.json({
      summary: { totalRevenue: parseFloat(totalRevenue), totalBills, totalCustomers, totalStaff, totalAppointments },
      revenueByDay: revenueByDay || [],
      topServices: topServices || [],
      recentBills,
      todayAppointments,
      lowStockProducts
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// ── Export for Vercel/Serverless ──
module.exports = app;

// ── Startup ──
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('Database connected');
      const isDev = process.env.NODE_ENV !== 'production';
      return sequelize.sync({ alter: isDev });
    })
    .then(() => {
      console.log('Database synced successfully');
      automationService.init();
      seedModules();
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Startup Error:', err.message);
      if (err.message.includes('alter')) {
        console.warn('HINT: If you changed ID types, please run the "Fresh Start" SQL script from MASTER_CONFIG.md to clear old constraints.');
      }
    });
}
