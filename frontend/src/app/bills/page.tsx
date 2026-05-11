'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import {
  Plus, Search, FileText, X, IndianRupee, Loader2,
  ShoppingCart, Trash2, Eye, CreditCard, Banknote, Smartphone,
  Printer, ExternalLink, LayoutGrid, List, User as UserIcon, MapPin
} from 'lucide-react';
import { billsAPI, servicesAPI, productsAPI, settingsAPI, staffAPI, customersAPI } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BillsPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billSettings, setBillSettings] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // Create bill form
  const [customerType, setCustomerType] = useState<'registered' | 'walk-in'>('registered');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState('0');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      const response = await billsAPI.getAll({ limit: 50 });
      setBills(response.data.bills || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const { branchesAPI } = await import('../lib/api');
      const [svcRes, prodRes, staffRes, custRes, branchRes] = await Promise.all([
        servicesAPI.getAll(),
        productsAPI.getAll(),
        staffAPI.getAll(),
        customersAPI.getAll(),
        branchesAPI.getAll()
      ]);
      setServices(svcRes.data);
      setProducts(prodRes.data);
      setStaffMembers(staffRes.data);
      setCustomersList(Array.isArray(custRes.data) ? custRes.data : []);
      setBranches(branchRes.data);
      
      // Set default branch from user context if available
      const currentBranch = localStorage.getItem('currentBranchId');
      if (currentBranch) {
        setSelectedBranchId(currentBranch);
      } else {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.branchId) setSelectedBranchId(user.branchId.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching catalog:', error);
    }
  }, []);

  useEffect(() => {
    fetchBills();
    fetchCatalog();
    settingsAPI.get().then(res => setBillSettings(res.data));
  }, [fetchBills, fetchCatalog]);

  const addToCart = (item: any, type: 'service' | 'product') => {
    const existing = cartItems.find(c => c.itemId === item.id && c.itemType === type);
    if (existing) {
      setCartItems(cartItems.map(c =>
        c.itemId === item.id && c.itemType === type
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCartItems([...cartItems, {
        itemType: type,
        itemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
        staffId: '', // Default no staff
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, updates: any) => {
    setCartItems(cartItems.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert('Please add at least one item');
    setSaving(true);
    try {
      await billsAPI.create({
        customerType,
        customerId,
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        customerEmail,
        items: cartItems,
        paymentMethod,
        discount: discountAmount,
        branchId: selectedBranchId || null
      });
      setShowCreateModal(false);
      resetForm();
      fetchBills();
    } catch (error) {
      console.error('Error creating bill:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerType('registered');
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setPaymentMethod('Cash');
    setDiscount('0');
    setCartItems([]);
    
    // Reset to current branch context
    const currentBranch = localStorage.getItem('currentBranchId');
    if (currentBranch) {
      setSelectedBranchId(currentBranch);
    } else {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.branchId) setSelectedBranchId(user.branchId.toString());
        else setSelectedBranchId('');
      } else {
        setSelectedBranchId('');
      }
    }
  };

  const viewBillDetail = (bill: any) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const updateBillStatus = async (id: number, status: string) => {
    try {
      if (!confirm(`Are you sure you want to mark this bill as ${status}? This will restore product inventory.`)) return;
      await billsAPI.updateStatus(id, status);
      fetchBills();
      if (selectedBill?.id === id) {
        setSelectedBill({ ...selectedBill, status });
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      alert('Failed to update bill status');
    }
  };

  const filtered = bills.filter(b =>
    b.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = bills.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

  return (
    <PageLayout>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .printable-bill, .printable-bill * { visibility: visible; }
          .printable-bill { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow-x: hidden;
          }
          .no-print { display: none !important; }
          
          /* Page Size Specifics */
          @page {
            margin: 0;
          }
          ${billSettings?.pageSize === 'Thermal80' ? '@page { size: 80mm auto; }' : ''}
          ${billSettings?.pageSize === 'Thermal58' ? '@page { size: 58mm auto; }' : ''}
          ${billSettings?.pageSize === 'A4' ? '@page { size: A4; margin: 10mm; }' : ''}
          ${billSettings?.pageSize === 'A5' ? '@page { size: A5; margin: 10mm; }' : ''}
        }
      `}</style>
      <div className="flex-1 overflow-auto p-8 bg-slate-100 no-print">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Billing & Sales</h2>
            <p className="text-slate-500 mt-1">Create bills and track your salon&apos;s revenue.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            <Plus size={18} />
            Create Bill
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Bills</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{bills.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg. Bill Value</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              ₹{bills.length > 0 ? Math.round(totalRevenue / bills.length).toLocaleString('en-IN') : 0}
            </p>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by customer..."
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
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Bill #</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" />
                          <span className="font-mono text-sm text-slate-500">#{String(bill.billSerial || bill.id).padStart(4, '0')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 text-sm">{bill.customerName}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{bill.staff?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-0.5">
                          <IndianRupee size={14} />
                          {parseFloat(bill.totalAmount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                          bill.status === 'cancelled' || bill.status === 'refunded' ? 'bg-rose-50 text-rose-600' :
                          bill.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-600' :
                          bill.paymentMethod === 'UPI' ? 'bg-purple-50 text-purple-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {bill.status === 'cancelled' || bill.status === 'refunded' ? <X size={10} /> :
                           bill.paymentMethod === 'Card' ? <CreditCard size={10} /> :
                           bill.paymentMethod === 'UPI' ? <Smartphone size={10} /> :
                           <Banknote size={10} />}
                          {bill.status === 'cancelled' || bill.status === 'refunded' ? bill.status.toUpperCase() : bill.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => viewBillDetail(bill)}
                          className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((bill: any) => (
                <div key={bill.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <button
                      onClick={() => viewBillDetail(bill)}
                      className="p-2 bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Bill #{String(bill.billSerial || bill.id).padStart(4, '0')}</p>
                    <h4 className="font-bold text-slate-800 truncate">{bill.customerName}</h4>
                    <p className="text-xs text-slate-500">by {bill.staff?.name || 'Manager'}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bill.status === 'cancelled' || bill.status === 'refunded' ? 'bg-rose-100 text-rose-700' :
                        bill.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-700' :
                        bill.paymentMethod === 'UPI' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {bill.status === 'cancelled' || bill.status === 'refunded' ? bill.status.toUpperCase() : bill.paymentMethod}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(bill.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-xl font-black text-indigo-600">
                      ₹{parseFloat(bill.totalAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              {search ? 'No bills matching your search' : 'No bills yet. Create your first bill!'}
            </div>
          )}
        </div>
      </div>

      {/* Create Bill Modal (POS-style) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Create New Bill</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="flex flex-1 overflow-hidden">
              {/* Left: Catalog */}
              <div className="w-1/2 border-r border-slate-100 p-6 overflow-auto">
                <h4 className="font-semibold text-slate-700 text-sm mb-3">Services</h4>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {services.map((svc: any) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => addToCart(svc, 'service')}
                      className="text-left p-3 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-sm"
                    >
                      <p className="font-medium text-slate-700 truncate">{svc.name}</p>
                      <p className="text-indigo-600 font-bold text-xs mt-1">₹{parseFloat(svc.price).toLocaleString('en-IN')}</p>
                    </button>
                  ))}
                </div>

                <h4 className="font-semibold text-slate-700 text-sm mb-3">Products</h4>
                <div className="grid grid-cols-2 gap-2">
                  {products.map((prod: any) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addToCart(prod, 'product')}
                      className="text-left p-3 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all text-sm"
                    >
                      <p className="font-medium text-slate-700 truncate">{prod.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-purple-600 font-bold text-xs">₹{parseFloat(prod.price).toLocaleString('en-IN')}</p>
                        <span className="text-[10px] text-slate-400">{prod.stock} in stock</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Cart + Customer */}
              <div className="w-1/2 p-6 flex flex-col overflow-auto">
                {/* Branch Selection */}
                {branches.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Branch</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={14} />
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-indigo-100 bg-indigo-50/30 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 appearance-none"
                      >
                        <option value="">Main Salon (Default)</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Customer Info */}
                <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex p-1 bg-white rounded-lg mb-3 shadow-sm border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCustomerType('registered')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${customerType === 'registered' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Registered
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerType('walk-in');
                        setCustomerId('');
                        setCustomerName('');
                        setCustomerPhone('');
                        setCustomerEmail('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${customerType === 'walk-in' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Walk-in (New)
                    </button>
                  </div>

                  {customerType === 'registered' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Select Customer</label>
                      <select
                        value={customerId}
                        onChange={(e) => {
                          const cust = customersList.find(c => c.id.toString() === e.target.value);
                          setCustomerId(e.target.value);
                          setCustomerName(cust ? cust.name : '');
                          setCustomerPhone(cust ? cust.phone : '');
                          setCustomerEmail(cust ? cust.email : '');
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        required
                      >
                        <option value="">Choose customer...</option>
                        {customersList.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="Walk-in name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                          <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Phone"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Email"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart size={16} className="text-slate-400" />
                  <h4 className="font-semibold text-slate-700 text-sm">Cart ({cartItems.length} items)</h4>
                </div>
                <div className="flex-1 overflow-auto space-y-2 mb-4 min-h-[120px]">
                  {cartItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Click services or products to add
                    </div>
                  ) : (
                    cartItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-slate-700 text-sm">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.itemType} · ₹{item.price}</p>
                            </div>
                            {item.itemType === 'service' && (
                              <select
                                value={item.staffId}
                                onChange={(e) => updateCartItem(i, { staffId: e.target.value })}
                                className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 max-w-[100px]"
                              >
                                <option value="">Select Staff</option>
                                {staffMembers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center border border-slate-200 rounded-lg">
                            <button type="button" onClick={() => updateCartItem(i, { quantity: Math.max(1, item.quantity - 1) })} className="px-2 py-1 text-slate-400 hover:text-slate-600 text-sm">-</button>
                            <span className="px-2 text-sm font-medium">{item.quantity}</span>
                            <button type="button" onClick={() => updateCartItem(i, { quantity: item.quantity + 1 })} className="px-2 py-1 text-slate-400 hover:text-slate-600 text-sm">+</button>
                          </div>
                          <span className="text-sm font-bold text-slate-700 w-16 text-right">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          <button type="button" onClick={() => removeFromCart(i)} className="p-1 text-slate-300 hover:text-rose-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-700">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500">Discount</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-100">
                    <span className="text-slate-800">Total</span>
                    <span className="text-indigo-600">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment & Submit */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-500 mb-2">Payment Method</label>
                  <div className="flex gap-2 mb-4">
                    {['Cash', 'Card', 'UPI'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1 ${
                          paymentMethod === method
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {method === 'Cash' ? <Banknote size={14} /> : method === 'Card' ? <CreditCard size={14} /> : <Smartphone size={14} />}
                        {method}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={saving || cartItems.length === 0}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <IndianRupee size={18} />
                        Complete Sale · ₹{total.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {showDetailModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col overflow-hidden ${billSettings?.billDesign === 'modern' ? 'border-t-8 border-indigo-600' : ''}`}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100 no-print flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Bill #{String(selectedBill.billSerial || selectedBill.id).padStart(4, '0')}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className={`p-6 printable-bill overflow-y-auto flex-1 ${
              billSettings?.pageSize === 'Thermal80' ? 'w-[80mm] mx-auto' :
              billSettings?.pageSize === 'Thermal58' ? 'w-[58mm] mx-auto' :
              billSettings?.pageSize === 'A4' ? 'w-[210mm] mx-auto' :
              billSettings?.pageSize === 'A5' ? 'w-[148mm] mx-auto' : ''
            }`}>
              {/* Configurable Header */}
              <div className="text-center mb-6 border-b border-slate-100 pb-4">
                {billSettings?.logoUrl && (
                  <div className="mb-3 flex justify-center no-print">
                    <img src={billSettings.logoUrl} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {billSettings?.salonName || 'SalonFlow'}
                </h2>
                
                {/* Branch/Salon Details */}
                <div className="mt-1 text-[10px] text-slate-500 font-medium space-y-0.5">
                  {selectedBill.address && <p>{selectedBill.address}</p>}
                  {selectedBill.gstNumber && <p className="font-bold">GST: {selectedBill.gstNumber}</p>}
                </div>

                {selectedBill.status === 'cancelled' || selectedBill.status === 'refunded' ? (
                  <div className="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-bold text-[10px] uppercase tracking-widest rounded-full my-2">
                    {selectedBill.status}
                  </div>
                ) : null}
                
                <div className="flex justify-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                  <span>Bill #{String(selectedBill.billSerial || selectedBill.id).padStart(4, '0')}</span>
                  <span>•</span>
                  <span>{new Date(selectedBill.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Customer</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedBill.customerName}</p>
                  {selectedBill.customerPhone && <p className="text-xs text-slate-500">{selectedBill.customerPhone}</p>}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Attended By</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedBill.staff?.name || 'Manager'}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Service Details</p>
                <div className="space-y-2">
                  {(selectedBill.BillItems || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400">{item.itemType} × {item.quantity}</p>
                          {item.performer && (
                            <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-0.5 uppercase tracking-tighter">
                              <UserIcon size={10} /> {item.performer.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>Subtotal</span>
                    <span>₹{(parseFloat(selectedBill.totalAmount) + parseFloat(selectedBill.discount)).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-500 mb-3 pb-3 border-b border-slate-200 border-dashed">
                    <span>Discount</span>
                    <span>-₹{parseFloat(selectedBill.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-indigo-600">₹{parseFloat(selectedBill.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase text-right">Paid via {selectedBill.paymentMethod}</p>
              </div>

              {/* Configurable Footer */}
              <div className="text-center pt-6 border-t border-slate-100 border-dashed">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {billSettings?.billFooter || 'Thank you for your business!'}
                </p>
              </div>

              {/* Actions (Hidden in print) */}
              <div className="grid grid-cols-2 gap-3 mt-8 no-print">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 py-3.5 border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <Printer size={18} /> Print Bill
                </button>
                <button 
                  onClick={() => alert('Redirecting to Secure Payment Gateway...')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  <ExternalLink size={18} /> Pay Online
                </button>
                {selectedBill.status === 'paid' && (
                  <>
                    <button 
                      onClick={() => updateBillStatus(selectedBill.id, 'refunded')}
                      className="col-span-1 flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all border border-amber-200"
                    >
                      Process Refund
                    </button>
                    <button 
                      onClick={() => updateBillStatus(selectedBill.id, 'cancelled')}
                      className="col-span-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all border border-rose-200"
                    >
                      Cancel Bill
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default BillsPage;
