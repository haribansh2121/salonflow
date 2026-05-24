const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./models');
const automationService = require('./services/automation');
const seedModules = require('./seeders');

const app = express();

// ── CORS (FIXED FOR PRODUCTION) ──
app.use(cors({
  origin: [
    'https://salonflow-ot0ybu54i-haribansh2121.vercel.app',
      'https://salonflow-six.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// ── API Routes ──
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

// ── Health Check ──
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

    const { Op } = require('sequelize');

    const activeWhere = {
      ...where,
      status: { [Op.notIn]: ['cancelled', 'refunded'] }
    };

    const { Bill, Customer, User, Appointment, Product, Service } = require('./models');

    const totalRevenue = await Bill.sum('totalAmount', { where: activeWhere }) || 0;
    const totalBills = await Bill.count({ where: activeWhere });
    const totalCustomers = await Customer.count({ where });
    const totalStaff = await User.count({ where: { ...where, role: 'STAFF' } });
    const totalAppointments = await Appointment.count({ where: { ...where, status: 'scheduled' } });

    const recentBills = await Bill.findAll({
      where,
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const todayAppointments = await Appointment.findAll({
      where,
      limit: 5
    });

    const lowStockProducts = await Product.findAll({
      where: {
        ...where,
        stock: { [Op.lte]: 5 }
      },
      limit: 5
    });

    res.json({
      summary: {
        totalRevenue,
        totalBills,
        totalCustomers,
        totalStaff,
        totalAppointments
      },
      recentBills,
      todayAppointments,
      lowStockProducts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── IMPORTANT: NO app.listen() (Vercel requirement) ──

// ── Export for Vercel ──
module.exports = app;

// ── Optional init (safe for serverless) ──
sequelize.authenticate()
  .then(() => {
    console.log('DB connected');
    return sequelize.sync();
  })
  .then(() => {
    console.log('DB synced');
    automationService.init();
    seedModules();
  })
  .catch(err => console.error('DB Error:', err));
