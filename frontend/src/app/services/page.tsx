'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { servicesAPI } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Scissors, X, Clock, IndianRupee, Loader2, LayoutGrid, List } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ServiceItem {
  id: number;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
}

const ServicesPage = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', durationMinutes: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const fetchServices = useCallback(async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category: service.category || '',
        price: String(service.price),
        durationMinutes: String(service.durationMinutes || ''),
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', category: '', price: '', durationMinutes: '' });
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
        durationMinutes: parseInt(formData.durationMinutes) || 30,
      };
      if (editingService) {
        await servicesAPI.update(editingService.id, payload);
      } else {
        await servicesAPI.create(payload);
      }
      setShowModal(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    setDeleting(id);
    try {
      await servicesAPI.delete(id);
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Services Catalog</h2>
            <p className="text-slate-500 mt-1">Manage your salon&apos;s service offerings and pricing.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>

        {/* Categories Summary */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
            All ({services.length})
          </span>
          {categories.map(cat => (
            <span key={cat} className="px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
              {cat} ({services.filter(s => s.category === cat).length})
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-slate-50">
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Scissors size={16} />
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                          {service.category || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-slate-600 text-sm">
                          <Clock size={14} className="text-slate-400" />
                          {service.durationMinutes || '—'} mins
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-0.5 font-bold text-slate-800 text-sm">
                          <IndianRupee size={14} />
                          {parseFloat(String(service.price)).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openModal(service)}
                            className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            disabled={deleting === service.id}
                            className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                          >
                            {deleting === service.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((service) => (
                <div key={service.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Scissors size={20} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal(service)}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deleting === service.id}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{service.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{service.category || 'Uncategorized'}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                      <Clock size={14} />
                      {service.durationMinutes} mins
                    </div>
                    <div className="text-lg font-black text-indigo-600">
                      ₹{parseFloat(String(service.price)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && filtered.length === 0 && (
            <div className="px-6 py-16 text-center text-slate-400 text-sm">
              {search ? 'No services matching your search' : 'No services yet. Add your first service!'}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="e.g. Haircut & Styling"
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
                  placeholder="e.g. Hair, Nails, Skin Care"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    placeholder="500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Duration (mins)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    placeholder="30"
                    min="5"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editingService ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ServicesPage;
