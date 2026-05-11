const express = require('express');
const router = express.Router();
const { User, Role } = require('../models');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);

// Get all staff for a tenant
router.get('/', async (req, res) => {
  try {
    const where = { tenantId: req.user.tenantId };
    if (req.branchId) where.branchId = req.branchId;

    const staff = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'role', 'roleId', 'branchId', 'createdAt'],
      include: [{ model: Role, attributes: ['id', 'name', 'permissions'] }],
      order: [['name', 'ASC']]
    });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create staff member
router.post('/', async (req, res) => {
  const { name, email, phone, password, role, branchId, roleId } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // Resolve roleId: use provided roleId, or look up by role name
    let resolvedRoleId = roleId || null;
    if (!resolvedRoleId && role && role !== 'ADMIN' && role !== 'STAFF') {
      const foundRole = await Role.findOne({ where: { name: role, tenantId: req.user.tenantId } });
      if (foundRole) resolvedRoleId = foundRole.id;
    }

    const staff = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'STAFF',
      roleId: resolvedRoleId,
      tenantId: req.user.tenantId,
      branchId: branchId || req.branchId
    });
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(400).json({ error: 'Failed to create staff member' });
  }
});

// Update staff member
router.put('/:id', async (req, res) => {
  const { name, email, phone, password, role, branchId, roleId } = req.body;
  try {
    const staff = await User.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });

    if (!staff) return res.status(404).json({ error: 'Staff member not found' });

    // Resolve roleId: use provided roleId, or look up by role name
    let resolvedRoleId = roleId || null;
    if (!resolvedRoleId && role && role !== 'ADMIN' && role !== 'STAFF') {
      const foundRole = await Role.findOne({ where: { name: role, tenantId: req.user.tenantId } });
      if (foundRole) resolvedRoleId = foundRole.id;
    }

    const updates = { name, email, phone, role, branchId, roleId: resolvedRoleId };
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    await staff.update(updates);
    res.json(staff);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(400).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!deleted) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ message: 'Staff member removed' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

module.exports = router;
