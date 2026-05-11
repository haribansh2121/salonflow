const express = require('express');
const router = express.Router();
const { Role, Module, RolePermission } = require('../models');
const authMiddleware = require('../middleware/auth');

// Helper to sync RolePermissions junction table
async function syncRolePermissions(role, permissionKeys) {
  if (!permissionKeys || !Array.isArray(permissionKeys)) return;
  
  try {
    // 1. Find all modules matching the permission keys
    const modules = await Module.findAll({
      where: { key: permissionKeys }
    });
    
    // 2. Set the associations (Sequelize belongsToMany helper)
    // This will automatically handle adding/removing entries in RolePermissions table
    await role.setModules(modules);
    
    console.log(`Synced RolePermissions for Role ${role.id}: ${modules.length} modules linked.`);
  } catch (err) {
    console.error('Error syncing RolePermissions:', err);
  }
}

// Get all roles for the tenant
router.get('/', authMiddleware, async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { tenantId: req.user.tenantId },
      include: [{ model: Module }] // Include modules to verify junction table works
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Create a new role
router.post('/', authMiddleware, async (req, res) => {
  const { name, permissions } = req.body;
  try {
    const role = await Role.create({
      name,
      permissions,
      tenantId: req.user.tenantId
    });
    
    // Sync with junction table
    await syncRolePermissions(role, permissions);
    
    res.status(201).json(role);
  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update a role
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, permissions } = req.body;
  try {
    const role = await Role.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    console.log(`Updating role ${req.params.id}:`, { name, permissions });

    if (name !== undefined) role.name = name;
    if (permissions !== undefined) {
      role.permissions = permissions;
      // Sync with junction table
      await syncRolePermissions(role, permissions);
    }
    
    await role.save();
    res.json(role);
  } catch (error) {
    console.error('Role Update Error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete a role
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const role = await Role.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    await role.destroy();
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

module.exports = router;
