'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { customersAPI } from '../lib/api';
import { Plus, Search, Edit2, Trash2, X, Loader2, User, Phone, Mail, IndianRupee, LayoutGrid, List, Cake } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CustomerItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  gender: string;
  notes: string;
  totalVisits: number;
  totalSpent: number;
  birthday: string;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', gender: '', notes: '', birthday: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll(search || undefined);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchCustomers]);

  const openModal = (customer?: CustomerItem) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        gender: customer.gender || '',
        notes: customer.notes || '',
        birthday: customer.birthday || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', gender: '', notes: '', birthday: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
      } else {
        await customersAPI.create(formData);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    setDeleting(id);
    try {
      await customersAPI.delete(id);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setDeleting(null);
    }
  };

  const totalSpentAll = customers.reduce((sum, c) => sum + parseFloat(String(c.totalSpent || 0)), 0);

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Customer Directory</h2>
            <p className="text-slate-500 mt-1">Manage your salon&apos;s client relationships.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{customers.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Lifetime Value</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalSpentAll.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg. Visits</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {customers.length > 0
                ? Math.round(customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0) / customers.length)
                : 0}
            </p>
          </div>
        </div>

        {/* Customer Cards */}
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
              />
            </div>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map(customer => (
              <div key={customer.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{customer.name}</h3>
                      {customer.gender && (
                        <span className="text-[10px] text-slate-400 font-medium uppercase">{customer.gender}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(customer)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      disabled={deleting === customer.id}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                    >
                      {deleting === customer.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone size={13} className="text-slate-400" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail size={13} className="text-slate-400" />
                      {customer.email}
                    </div>
                  )}
                  {customer.birthday && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Cake size={13} className="text-pink-400" />
                      {new Date(customer.birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-50">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-slate-400">Visits</p>
                    <p className="font-bold text-slate-700">{customer.totalVisits || 0}</p>
                  </div>
                  <div className="flex-1 text-center border-l border-slate-50">
                    <p className="text-xs text-slate-400">Spent</p>
                    <p className="font-bold text-emerald-600 flex items-center justify-center gap-0.5">
                      <IndianRupee size={12} />
                      {parseFloat(String(customer.totalSpent || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-slate-50">
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Birthday</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Visits</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{customer.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {customer.birthday ? new Date(customer.birthday).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{customer.gender || '—'}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{customer.totalVisits || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-emerald-600 text-sm">
                        ₹{parseFloat(String(customer.totalSpent || 0)).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && customers.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            {search ? 'No customers matching your search' : 'No customers yet. Add your first customer!'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Birthday</label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  placeholder="Any special notes..."
                  rows={2}
                />
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
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editingCustomer ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default CustomersPage;
