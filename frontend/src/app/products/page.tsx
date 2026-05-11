'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { productsAPI } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Package, X, IndianRupee, Loader2, AlertTriangle } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ProductItem {
  id: number;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  margin: number;
  stock: number;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', costPrice: '', margin: '', stock: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openModal = (product?: ProductItem) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category || '',
        price: String(product.price),
        costPrice: String(product.costPrice || ''),
        margin: String(product.margin || ''),
        stock: String(product.stock),
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', price: '', costPrice: '', margin: '', stock: '0' });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice) || 0,
        margin: parseFloat(formData.margin) || 0,
        stock: parseInt(formData.stock) || 0,
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
      } else {
        await productsAPI.create(payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleting(null);
    }
  };

  const calculateSalePrice = (cost: string, marg: string) => {
    const c = parseFloat(cost) || 0;
    const m = parseFloat(marg) || 0;
    const sale = c + (c * m / 100);
    setFormData(prev => ({ ...prev, costPrice: cost, margin: marg, price: sale.toFixed(2) }));
  };

  const calculateMargin = (cost: string, sale: string) => {
    const c = parseFloat(cost) || 0;
    const s = parseFloat(sale) || 0;
    if (c === 0) return;
    const m = ((s - c) / c) * 100;
    setFormData(prev => ({ ...prev, costPrice: cost, price: sale, margin: m.toFixed(2) }));
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + (parseFloat(String(p.price)) * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Product Inventory</h2>
            <p className="text-slate-500 mt-1">Track and manage your salon&apos;s product stock.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Inventory Value</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
          </div>
          <div className={`bg-white p-4 rounded-xl border shadow-sm ${lowStockCount > 0 ? 'border-amber-200' : 'border-slate-100'}`}>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
              {lowStockCount > 0 && <AlertTriangle size={12} className="text-amber-500" />}
              Low Stock Items
            </p>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{lowStockCount}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left bg-slate-50">
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <Package size={16} />
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {product.category || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-0.5 font-bold text-slate-800 text-sm">
                        <IndianRupee size={14} />
                        {parseFloat(String(product.price)).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.stock <= 2 ? 'bg-rose-50 text-rose-600' :
                        product.stock <= 5 ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                        >
                          {deleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                      {search ? 'No products matching your search' : 'No products yet. Add your first product!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="e.g. L'Oréal Shampoo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="e.g. Hair Care, Skin Care"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => calculateSalePrice(e.target.value, formData.margin)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    placeholder="300"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Margin (%)</label>
                  <input
                    type="number"
                    value={formData.margin}
                    onChange={(e) => calculateSalePrice(formData.costPrice, e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    placeholder="25"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Sale Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => calculateMargin(formData.costPrice, e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 border-indigo-200 bg-indigo-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="450"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Stock Qty</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editingProduct ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ProductsPage;
