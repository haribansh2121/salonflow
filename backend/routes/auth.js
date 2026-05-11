const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Tenant, TenantSetting, Role } = require('../models');

// Register a new Salon (Tenant)
router.post('/register', async (req, res) => {
  const { salonName, name, email, password } = req.body;

  if (!salonName || !name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create Tenant (ID will be auto-generated as numeric)
    const tenant = await Tenant.create({
      name: salonName,
      plan: 'free'
    });

    const tenantId = tenant.id;

    // Create Default Settings
    await TenantSetting.create({
      tenantId: tenantId,
      salonName: salonName,
      billHeader: salonName,
      billFooter: 'Thank you for visiting!',
      billDesign: 'classic'
    });

    // Create Admin User
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      tenantId: tenantId
    });

    res.status(201).json({ message: 'Salon registered successfully', tenantId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register salon' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Tenant },
        { 
          model: Role, 
          include: [{ model: require('../models').Module, attributes: ['key'] }] 
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fallback: if roleId is null but role is a custom name, look up the Role by name
    let permissions = user.Role?.permissions || [];
    if (!user.Role && user.role && user.role !== 'ADMIN' && user.role !== 'STAFF') {
      const foundRole = await Role.findOne({ 
        where: { name: user.role, tenantId: user.tenantId } 
      });
      if (foundRole) {
        permissions = foundRole.permissions || [];
        // Auto-fix: link the roleId for future logins
        await user.update({ roleId: foundRole.id });
      }
    }

    // FINAL FALLBACK: If still empty (plain STAFF/ADMIN with no custom role),
    // load default permissions from TenantSetting.rolePermissions
    if (permissions.length === 0 && user.role !== 'ADMIN') {
      try {
        const settings = await TenantSetting.findOne({ where: { tenantId: user.tenantId } });
        if (settings && settings.rolePermissions) {
          const roleKey = user.role?.toUpperCase() || 'STAFF';
          permissions = settings.rolePermissions[roleKey] || settings.rolePermissions['STAFF'] || [];
        }
      } catch (e) {
        console.error('Failed to load default permissions from TenantSetting:', e.message);
      }
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        tenantId: user.tenantId,
        branchId: user.branchId,
        name: user.name,
        tenantName: user.Tenant?.name,
        permissions: permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        tenantName: user.Tenant?.name,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'roleId', 'tenantId', 'branchId'],
      include: [
        { model: Tenant, attributes: ['name', 'plan'] },
        { 
          model: Role, 
          attributes: ['id', 'name', 'permissions'],
          include: [{ model: require('../models').Module, attributes: ['key'] }]
        }
      ]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fallback: look up Role by name if roleId is null
    let permissions = user.Role?.permissions || [];
    if (!user.Role && user.role && user.role !== 'ADMIN' && user.role !== 'STAFF') {
      const foundRole = await Role.findOne({ 
        where: { name: user.role, tenantId: user.tenantId } 
      });
      if (foundRole) {
        permissions = foundRole.permissions || [];
        await user.update({ roleId: foundRole.id });
      }
    }

    // FINAL FALLBACK: Plain STAFF with no custom role → load from TenantSetting
    if (permissions.length === 0 && user.role !== 'ADMIN') {
      try {
        const settings = await TenantSetting.findOne({ where: { tenantId: user.tenantId } });
        if (settings && settings.rolePermissions) {
          const roleKey = user.role?.toUpperCase() || 'STAFF';
          permissions = settings.rolePermissions[roleKey] || settings.rolePermissions['STAFF'] || [];
        }
      } catch (e) {
        console.error('Failed to load default permissions from TenantSetting (/me):', e.message);
      }
    }

    const userData = user.toJSON();
    userData.permissions = permissions;
    res.json(userData);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
