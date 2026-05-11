const express = require('express');
const router = express.Router();
const { Branch } = require('../models');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all branches for a tenant
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.findAll({
      where: { tenantId: req.user.tenantId }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Create a new branch
router.post('/', async (req, res) => {
  try {
    const branch = await Branch.create({
      ...req.body,
      tenantId: req.user.tenantId
    });
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create branch' });
  }
});

// Update a branch
router.put('/:id', async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    
    await branch.update(req.body);
    res.json(branch);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update branch' });
  }
});

// Delete a branch (soft delete or deactivate)
router.delete('/:id', async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    
    await branch.update({ isActive: false });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

module.exports = router;
