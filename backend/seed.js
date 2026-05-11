const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { sequelize, Tenant, User, Service, Product, Bill, BillItem, Customer, Appointment } = require('./models');
require('dotenv').config();

const seedData = async () => {
  try {
    // Create database if not exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || ''
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'salon_flow'}\`;`);
    await connection.end();

    await sequelize.sync({ force: true });

    // ── Tenant ──
    const tenant = await Tenant.create({
      id: 'default-salon',
      name: 'Glow Up Salon',
      plan: 'premium'
    });

    // ── Users (properly hashed passwords) ──
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@salonflow.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id
    });

    const staff1 = await User.create({
      name: 'Jane Smith',
      email: 'jane@salonflow.com',
      passwordHash: hashedPassword,
      role: 'STAFF',
      tenantId: tenant.id
    });

    const staff2 = await User.create({
      name: 'Raj Patel',
      email: 'raj@salonflow.com',
      passwordHash: hashedPassword,
      role: 'STAFF',
      tenantId: tenant.id
    });

    const staff3 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@salonflow.com',
      passwordHash: hashedPassword,
      role: 'STAFF',
      tenantId: tenant.id
    });

    const staffList = [staff1, staff2, staff3];

    // ── Services ──
    const services = await Promise.all([
      Service.create({ name: 'Haircut & Styling', category: 'Hair', price: 500, durationMinutes: 45, tenantId: tenant.id }),
      Service.create({ name: 'Hair Coloring', category: 'Hair', price: 1500, durationMinutes: 120, tenantId: tenant.id }),
      Service.create({ name: 'Keratin Treatment', category: 'Hair', price: 3500, durationMinutes: 180, tenantId: tenant.id }),
      Service.create({ name: 'Basic Facial', category: 'Skin Care', price: 800, durationMinutes: 60, tenantId: tenant.id }),
      Service.create({ name: 'Gold Facial', category: 'Skin Care', price: 1500, durationMinutes: 90, tenantId: tenant.id }),
      Service.create({ name: 'Manicure', category: 'Nails', price: 400, durationMinutes: 30, tenantId: tenant.id }),
      Service.create({ name: 'Pedicure', category: 'Nails', price: 500, durationMinutes: 45, tenantId: tenant.id }),
      Service.create({ name: 'Full Body Massage', category: 'Spa', price: 2000, durationMinutes: 60, tenantId: tenant.id }),
      Service.create({ name: 'Head Massage', category: 'Spa', price: 300, durationMinutes: 20, tenantId: tenant.id }),
      Service.create({ name: 'Threading & Waxing', category: 'Grooming', price: 250, durationMinutes: 20, tenantId: tenant.id }),
    ]);

    // ── Products ──
    const products = await Promise.all([
      Product.create({ name: 'L\'Oréal Shampoo', category: 'Hair Care', price: 450, stock: 25, tenantId: tenant.id }),
      Product.create({ name: 'Conditioner Pro', category: 'Hair Care', price: 380, stock: 18, tenantId: tenant.id }),
      Product.create({ name: 'Hair Serum', category: 'Hair Care', price: 550, stock: 12, tenantId: tenant.id }),
      Product.create({ name: 'Face Wash', category: 'Skin Care', price: 280, stock: 30, tenantId: tenant.id }),
      Product.create({ name: 'Moisturizer SPF 50', category: 'Skin Care', price: 650, stock: 15, tenantId: tenant.id }),
      Product.create({ name: 'Nail Polish Set', category: 'Nails', price: 350, stock: 8, tenantId: tenant.id }),
      Product.create({ name: 'Hair Color Kit', category: 'Hair Care', price: 800, stock: 3, tenantId: tenant.id }),
      Product.create({ name: 'Massage Oil', category: 'Spa', price: 400, stock: 20, tenantId: tenant.id }),
    ]);

    // ── Customers ──
    const customerNames = [
      { name: 'Anita Desai', phone: '9876543210', email: 'anita@email.com', gender: 'Female' },
      { name: 'Vikram Singh', phone: '9876543211', email: 'vikram@email.com', gender: 'Male' },
      { name: 'Meera Kapoor', phone: '9876543212', email: 'meera@email.com', gender: 'Female' },
      { name: 'Arjun Reddy', phone: '9876543213', email: 'arjun@email.com', gender: 'Male' },
      { name: 'Sanya Malhotra', phone: '9876543214', email: 'sanya@email.com', gender: 'Female' },
      { name: 'Karan Johar', phone: '9876543215', email: 'karan@email.com', gender: 'Male' },
      { name: 'Deepika Nair', phone: '9876543216', email: 'deepika@email.com', gender: 'Female' },
      { name: 'Rohit Mehta', phone: '9876543217', email: 'rohit@email.com', gender: 'Male' },
      { name: 'Pooja Bhat', phone: '9876543218', email: 'pooja@email.com', gender: 'Female' },
      { name: 'Amar Kumar', phone: '9876543219', email: 'amar@email.com', gender: 'Male' },
    ];

    const customers = await Promise.all(
      customerNames.map(c => Customer.create({ ...c, tenantId: tenant.id }))
    );

    // ── Bills (last 30 days) ──
    const paymentMethods = ['Cash', 'Card', 'UPI'];
    const now = new Date();

    for (let i = 0; i < 35; i++) {
      const date = new Date();
      date.setDate(now.getDate() - Math.floor(Math.random() * 30));
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const staff = staffList[Math.floor(Math.random() * staffList.length)];
      const numItems = Math.floor(Math.random() * 3) + 1;

      let totalAmount = 0;
      const items = [];

      for (let j = 0; j < numItems; j++) {
        const isProduct = Math.random() > 0.7;
        if (isProduct) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          items.push({
            itemType: 'product',
            itemId: product.id,
            name: product.name,
            quantity: qty,
            price: product.price,
          });
          totalAmount += parseFloat(product.price) * qty;
        } else {
          const service = services[Math.floor(Math.random() * services.length)];
          items.push({
            itemType: 'service',
            itemId: service.id,
            name: service.name,
            quantity: 1,
            price: service.price,
          });
          totalAmount += parseFloat(service.price);
        }
      }

      const bill = await Bill.create({
        customerName: customer.name,
        customerPhone: customer.phone,
        totalAmount,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: 'paid',
        tenantId: tenant.id,
        staffId: staff.id,
        createdAt: date,
      });

      for (const item of items) {
        await BillItem.create({
          billId: bill.id,
          ...item,
          createdAt: date,
        });
      }

      // Update customer stats
      await customer.increment({ totalVisits: 1, totalSpent: totalAmount });
    }

    // ── Appointments (next 7 days) ──
    const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    const statuses = ['scheduled', 'completed', 'cancelled'];

    for (let d = -2; d < 7; d++) {
      const appointmentDate = new Date();
      appointmentDate.setDate(now.getDate() + d);
      const dateStr = appointmentDate.toISOString().split('T')[0];
      const numAppts = Math.floor(Math.random() * 4) + 2;

      for (let a = 0; a < numAppts; a++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        const staff = staffList[Math.floor(Math.random() * staffList.length)];
        const time = times[Math.floor(Math.random() * times.length)];
        const status = d < 0 ? (Math.random() > 0.2 ? 'completed' : 'cancelled') : 'scheduled';

        await Appointment.create({
          customerName: customer.name,
          customerPhone: customer.phone,
          serviceId: service.id,
          staffId: staff.id,
          date: dateStr,
          time,
          duration: service.durationMinutes,
          status,
          tenantId: tenant.id,
        });
      }
    }

    console.log('✅ Database seeded successfully with comprehensive data!');
    console.log(`   - 1 Tenant (Glow Up Salon)`);
    console.log(`   - 4 Users (1 admin + 3 staff)`);
    console.log(`   - ${services.length} Services`);
    console.log(`   - ${products.length} Products`);
    console.log(`   - ${customers.length} Customers`);
    console.log(`   - 35 Bills with items`);
    console.log(`   - Appointments for 9 days`);
    console.log(`\n   Login: admin@salonflow.com / admin123`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
