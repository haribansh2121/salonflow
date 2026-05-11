const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get all products for a tenant
router.get('/', async (req, res) => {
  try {
    const where = { tenantId: req.user.tenantId };
    if (req.branchId) where.branchId = req.branchId;

    const products = await Product.findAll({
      where,
      order: [['name', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const product = await Product.create({
      name,
      category,
      price,
      stock: stock || 0,
      tenantId: req.user.tenantId,
      branchId: req.branchId
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    const product = await Product.findOne({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update({ name, category, price, stock });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.destroy({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
