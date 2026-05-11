'use client';
import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { 
  Settings, Save, FileText, Share2, CreditCard, 
  CheckCircle, Loader2, Sparkles, Layout, MessageSquare,
  Users, Image as ImageIcon, Trash2, Plus, Mail, Shield, Smartphone, X, MapPin, Hash, Printer, Lock, Edit2
} from 'lucide-react';
import api, { staffAPI, branchesAPI, settingsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('bill');

  // Staff management state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffFormData, setStaffFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'STAFF', branchId: '', roleId: null as number | null });

  // Branches state
  const [branches, setBranches] = useState<any[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [branchFormData, setBranchFormData] = useState({ name: '', address: '', gstNumber: '', phone: '', email: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, staffRes, branchesRes] = await Promise.all([
        settingsAPI.get(),
        staffAPI.getAll(),
        branchesAPI.getAll()
      ]);
      setSettings(settingsRes.data);
      setStaffList(staffRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      alert('Settings updated successfully!');
    } catch (error) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const res = await settingsAPI.testEmail();
      alert(res.data.message);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await staffAPI.update(editingStaff.id, staffFormData);
      } else {
        await staffAPI.create(staffFormData);
      }
      setShowStaffModal(false);
      setEditingStaff(null);
      setStaffFormData({ name: '', email: '', phone: '', password: '', role: 'STAFF', branchId: '', roleId: null });
      fetchData();
    } catch (error) {
      alert('Failed to save staff member');
    }
  };

  const deleteStaff = async (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await staffAPI.delete(id);
      fetchData();
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleFormData);
      } else {
        await api.post('/roles', roleFormData);
      }
      const response = await api.get('/roles');
      setRoles(Array.isArray(response.data) ? response.data : []);
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleFormData({ name: '', permissions: [] });
      alert('Role saved successfully');
    } catch (error) {
      console.error('Failed to save role');
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/roles/${id}`);
      setRoles(roles.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete role');
    }
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await branchesAPI.update(editingBranch.id, branchFormData);
      } else {
        await branchesAPI.create(branchFormData);
      }
      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchFormData({ name: '', address: '', gstNumber: '', phone: '', email: '' });
      fetchData();
    } catch (error) {
      alert('Failed to save branch');
    }
  };

  const deleteBranch = async (id: number) => {
    if (confirm('Are you sure you want to deactivate this branch?')) {
      await branchesAPI.delete(id);
      fetchData();
    }
  };

  // Registration state
  const [regData, setRegData] = useState({ salonName: '', name: '', email: '', password: '' });
  const [registering, setRegistering] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', permissions: [] as string[] });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles');
        setRoles(response.data);
      } catch (error) {
        console.error('Failed to fetch roles');
      }
    };
    fetchRoles();
  }, []);
  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </PageLayout>
    );
  }

  // Permission Check
  if (user?.role !== 'ADMIN' && !user?.permissions?.includes('settings')) {
    return (
      <PageLayout>
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center mb-6 text-rose-500 border border-slate-100">
            <Lock size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
            Sorry, you don't have permission to access the settings module. 
            Please contact your administrator to request access.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Go Back
          </button>
        </div>
      </PageLayout>
    );
  }

  const tabs = [
    { id: 'bill', name: 'Bill & Print', icon: <FileText size={18} /> },
    { id: 'branches', name: 'Salon Branches', icon: <MapPin size={18} /> },
    { id: 'staff', name: 'Users & Staff', icon: <Users size={18} /> },
    { id: 'comms', name: 'Messaging API', icon: <Share2 size={18} /> },
    { id: 'payments', name: 'Payment Gateway', icon: <CreditCard size={18} /> },
    { id: 'auto', name: 'Automation', icon: <Sparkles size={18} /> },
    { id: 'roles', name: 'Roles & Permissions', icon: <Lock size={18} /> },
    { id: 'master', name: 'Setup New Salon', icon: <Shield size={18} />, adminOnly: true },
  ];

  const handleRegisterSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const { authAPI } = await import('../lib/api');
      await authAPI.register(regData);
      alert('New Salon registered successfully!');
      setRegData({ salonName: '', name: '', email: '', password: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to register salon');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Settings & Configuration</h2>
            <p className="text-slate-500 mt-1">Configure your salon's branding and integrations.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>

        <div className="flex gap-8">
          {/* Tabs Sidebar */}
          <div className="w-64 space-y-1">
            {tabs.filter(t => !t.adminOnly || user?.role === 'ADMIN').map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {activeTab === 'bill' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Bill Print Master</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-2">Logo URL (Public Image Link)</label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={settings?.logoUrl || ''}
                          onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      {settings?.logoUrl && (
                        <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center p-1">
                          <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Salon Name (Brand Name)</label>
                    <input
                      type="text"
                      value={settings?.salonName || ''}
                      onChange={(e) => setSettings({...settings, salonName: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="My Awesome Salon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">GST Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={settings?.gstNumber || ''}
                        onChange={(e) => setSettings({...settings, gstNumber: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="GSTIN1234567890"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-2">Office/Store Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                      <textarea
                        value={settings.address || ''}
                        onChange={(e) => setSettings({...settings, address: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none h-20"
                        placeholder="123 Salon Street, Business District, City..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Bill Header Text</label>
                    <textarea
                      value={settings.billHeader || ''}
                      onChange={(e) => setSettings({...settings, billHeader: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none h-24"
                      placeholder="Enter additional header info..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Bill Footer Text</label>
                    <textarea
                      value={settings.billFooter || ''}
                      onChange={(e) => setSettings({...settings, billFooter: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none h-24"
                      placeholder="Thank you message, terms & conditions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Bill Layout (Page Size)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Thermal80', name: 'Thermal 80mm' },
                        { id: 'Thermal58', name: 'Thermal 58mm' },
                        { id: 'A4', name: 'A4 Paper' },
                        { id: 'A5', name: 'A5 Paper' }
                      ].map(size => (
                        <button
                          key={size.id}
                          onClick={() => setSettings({...settings, pageSize: size.id})}
                          className={`p-3 border rounded-xl flex items-center justify-center gap-2 transition-all ${
                            settings.pageSize === size.id 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Printer size={16} />
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Design Template</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['classic', 'modern', 'minimal'].map(design => (
                        <button
                          key={design}
                          onClick={() => setSettings({...settings, billDesign: design})}
                          className={`p-3 border rounded-xl text-center capitalize transition-all ${
                            settings.billDesign === design 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {design}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-indigo-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Branch Management</h3>
                  </div>
                  <button 
                    onClick={() => { setEditingBranch(null); setBranchFormData({ name: '', address: '', gstNumber: '', phone: '', email: '' }); setShowBranchModal(true); }}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                  >
                    <Plus size={16} /> Add New Branch
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <MapPin className="mx-auto text-slate-300 mb-2" size={40} />
                      <p className="text-slate-500 font-medium">No branches added yet.</p>
                      <button 
                        onClick={() => setShowBranchModal(true)}
                        className="text-indigo-600 text-sm font-bold mt-2"
                      >
                        Create your first branch
                      </button>
                    </div>
                  ) : (
                    branches.map(branch => (
                      <div key={branch.id} className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-base">{branch.name}</h4>
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-start gap-2 text-slate-500 text-sm">
                                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{branch.address || 'No address set'}</span>
                              </div>
                              {branch.gstNumber && (
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                  <Hash size={14} />
                                  <span>GST: {branch.gstNumber}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Smartphone size={14} />
                                <span>{branch.phone || 'No phone'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => { 
                                setEditingBranch(branch); 
                                setBranchFormData({ 
                                  name: branch.name || '', 
                                  address: branch.address || '', 
                                  gstNumber: branch.gstNumber || '', 
                                  phone: branch.phone || '', 
                                  email: branch.email || '' 
                                }); 
                                setShowBranchModal(true); 
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Settings size={18} />
                            </button>
                            <button 
                              onClick={() => deleteBranch(branch.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comms' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Messaging Integration (Plug & Play)</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">WhatsApp API Key (Meta Graph)</label>
                    <input
                      type="password"
                      value={settings.whatsappApiKey || ''}
                      onChange={(e) => setSettings({...settings, whatsappApiKey: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="EAAW..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">SMS API Key (Twilio/Provider)</label>
                    <input
                      type="password"
                      value={settings.smsApiKey || ''}
                      onChange={(e) => setSettings({...settings, smsApiKey: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="Your SMS gateway key..."
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-700">Custom Domain Email (SMTP / Hostinger)</h4>
                      <button
                        onClick={handleTestEmail}
                        disabled={testing || !settings.smtpHost}
                        className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                      >
                        {testing ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SMTP Host</label>
                        <input
                          type="text"
                          value={settings.smtpHost || ''}
                          onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                          placeholder="smtp.hostinger.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SMTP Port</label>
                        <input
                          type="number"
                          value={settings.smtpPort ?? ''}
                          onChange={(e) => setSettings({...settings, smtpPort: e.target.value ? parseInt(e.target.value) : null})}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                          placeholder="465"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SMTP Username</label>
                        <input
                          type="email"
                          value={settings.smtpUser || ''}
                          onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                          placeholder="info@yourdomain.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">SMTP Password</label>
                        <input
                          type="password"
                          value={settings.smtpPass || ''}
                          onChange={(e) => setSettings({...settings, smtpPass: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Payment Gateway Setup</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Stripe Publishable Key</label>
                    <input
                      type="text"
                      value={settings.stripePublishableKey || ''}
                      onChange={(e) => setSettings({...settings, stripePublishableKey: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Stripe Secret Key</label>
                    <input
                      type="password"
                      value={settings.stripeSecretKey || ''}
                      onChange={(e) => setSettings({...settings, stripeSecretKey: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="sk_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Currency</label>
                    <select
                      value={settings.currency || 'INR'}
                      onChange={(e) => setSettings({...settings, currency: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auto' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Automation Settings</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Automated Birthday Wishes</h4>
                      <p className="text-xs text-slate-500">Send WhatsApp wishes to customers on their birthday.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!settings.autoBirthdayWish} 
                        onChange={(e) => setSettings({...settings, autoBirthdayWish: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  {settings.autoBirthdayWish && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Birthday Message Template</label>
                      <textarea
                        value={settings.birthdayMessage || ''}
                        onChange={(e) => setSettings({...settings, birthdayMessage: e.target.value})}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none h-24"
                        placeholder="Happy Birthday {name}! We have a special gift for you..."
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Use {`{name}`} to insert customer's name.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Booking Confirmation</h4>
                      <p className="text-xs text-slate-500">Auto-send confirmation via WhatsApp after booking.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!settings.autoBookingConfirm} 
                        onChange={(e) => setSettings({...settings, autoBookingConfirm: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="text-indigo-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">User & Staff Management</h3>
                  </div>
                  <button 
                    onClick={() => { setEditingStaff(null); setStaffFormData({ name: '', email: '', phone: '', password: '', role: 'STAFF', branchId: '', roleId: null }); setShowStaffModal(true); }}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                  >
                    <Plus size={16} /> Add Staff
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffList.map(staff => (
                    <div key={staff.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{staff.name}</h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">{staff.role}</span>
                            <span className="text-[10px] text-slate-400">{staff.phone}</span>
                            {staff.branchId && (
                              <span className="text-[10px] text-slate-500 italic">
                                @ {branches.find(b => b.id === staff.branchId)?.name || 'Branch'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { 
                            setEditingStaff(staff); 
                            setStaffFormData({ 
                              name: staff.name || '', 
                              email: staff.email || '', 
                              phone: staff.phone || '', 
                              password: '', 
                              role: staff.role || 'STAFF',
                              branchId: staff.branchId || '',
                              roleId: staff.roleId || null
                            }); 
                            setShowStaffModal(true); 
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                        >
                          <Shield size={16} />
                        </button>
                        <button 
                          onClick={() => deleteStaff(staff.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Roles & Permissions</h2>
                    <p className="text-sm text-slate-500">Define custom roles and their access levels</p>
                  </div>
                  <button 
                    onClick={() => { setEditingRole(null); setRoleFormData({ name: '', permissions: [] }); setShowRoleModal(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} />
                    Create New Role
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => (
                    <div key={role.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Lock size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 capitalize">{role.name}</h3>
                            <p className="text-xs text-slate-500">{role.permissions?.length || 0} Permissions Assigned</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingRole(role); setRoleFormData({ name: role.name, permissions: role.permissions || [] }); setShowRoleModal(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteRole(role.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions?.slice(0, 3).map((p: string) => (
                          <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium uppercase tracking-wider">{p.replace(/_/g, ' ')}</span>
                        ))}
                        {(role.permissions?.length || 0) > 3 && (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[10px] font-medium italic">+{role.permissions.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {roles.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Lock className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-slate-600 font-bold">No custom roles defined</h3>
                    <p className="text-slate-400 text-sm mb-6">Create roles to give staff specific access to modules.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'master' && user?.role === 'ADMIN' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Setup New Salon (SaaS Master)</h3>
                </div>
                
                {/* Platform Registration Feature (Toggleable) */}
                {settings?.enableRegistration === 1 && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-sm text-slate-500 mb-6">
                    As an administrator, you can initialize a completely new salon tenant. This will create a separate database entry for the new salon.
                  </p>
                  
                  <form onSubmit={handleRegisterSalon} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Salon Name</label>
                      <input
                        type="text"
                        required
                        value={regData.salonName}
                        onChange={e => setRegData({...regData, salonName: e.target.value})}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        placeholder="E.g. Royal Unisex Salon"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Admin Name</label>
                        <input
                          type="text"
                          required
                          value={regData.name}
                          onChange={e => setRegData({...regData, name: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Admin Email</label>
                        <input
                          type="email"
                          required
                          value={regData.email}
                          onChange={e => setRegData({...regData, email: e.target.value})}
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                          placeholder="admin@newsalon.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Initial Password</label>
                      <input
                        type="password"
                        required
                        value={regData.password}
                        onChange={e => setRegData({...regData, password: e.target.value})}
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={registering}
                      className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      {registering ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      Initialize New Salon Tenant
                    </button>
                  </form>
                </div>
                )}

                <div className="mt-12 pt-12 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="text-indigo-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Role & Feature Privilege Mapping</h3>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-left font-bold text-slate-700">Module / Feature</th>
                          <th className="px-6 py-4 text-center font-bold text-slate-700">Admin Role</th>
                          <th className="px-6 py-4 text-center font-bold text-slate-700">Staff Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { id: 'billing', name: 'Billing & Invoicing' },
                          { id: 'appointments', name: 'Appointment Scheduling' },
                          { id: 'products', name: 'Inventory & Products' },
                          { id: 'services', name: 'Service Management' },
                          { id: 'customers', name: 'Customer Database' },
                          { id: 'staff', name: 'Staff Management' },
                          { id: 'reports', name: 'Analytics & Reports' },
                          { id: 'marketing', name: 'Marketing Campaigns' },
                        ].map(feature => (
                          <tr key={feature.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4 font-medium text-slate-600">{feature.name}</td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={true} 
                                disabled 
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 bg-slate-100 cursor-not-allowed" 
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={settings?.rolePermissions?.STAFF?.includes(feature.id)}
                                onChange={(e) => {
                                  const current = settings.rolePermissions?.STAFF || [];
                                  const updated = e.target.checked 
                                    ? [...current, feature.id] 
                                    : current.filter((id: string) => id !== feature.id);
                                  setSettings({
                                    ...settings,
                                    rolePermissions: {
                                      ...settings.rolePermissions,
                                      STAFF: updated
                                    }
                                  });
                                }}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400 italic">
                    * Admin roles always have full access to all modules. Staff access can be granularly controlled here for the current salon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{editingStaff ? 'Edit Staff member' : 'Add Staff Member'}</h3>
              <button onClick={() => setShowStaffModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={staffFormData.name || ''}
                    onChange={e => setStaffFormData({...staffFormData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={staffFormData.phone || ''}
                      onChange={e => setStaffFormData({...staffFormData, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                  <select
                    value={staffFormData.role || 'STAFF'}
                    onChange={e => {
                      const selectedRole = roles.find(r => r.name === e.target.value);
                      setStaffFormData({
                        ...staffFormData, 
                        role: e.target.value,
                        roleId: selectedRole ? selectedRole.id : null
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="STAFF">Staff (Default)</option>
                    <option value="ADMIN">Admin</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Assigned Branch</label>
                <select
                  value={staffFormData.branchId || ''}
                  onChange={e => setStaffFormData({...staffFormData, branchId: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Main / All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email / Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={staffFormData.email || ''}
                    onChange={e => setStaffFormData({...staffFormData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="john@salon.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">{editingStaff ? 'New Password (Leave blank to keep)' : 'Password'}</label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={staffFormData.password || ''}
                  onChange={e => setStaffFormData({...staffFormData, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
              >
                {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-slideUp flex flex-col max-h-[90vh]">

            {/* Header — fixed */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MapPin className="text-indigo-600" size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{editingBranch ? 'Edit Branch Details' : 'Add New Branch'}</h3>
                  <p className="text-xs text-slate-400">Configure branch-specific settings below</p>
                </div>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <form onSubmit={handleBranchSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-5 space-y-5">

                {/* Section 1: Basic Info */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Information</p>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch Name <span className="text-red-400">*</span></label>
                      <input
                        type="text" required
                        value={branchFormData.name || ''}
                        onChange={e => setBranchFormData({...branchFormData, name: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        placeholder="e.g. Downtown Branch"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address <span className="text-red-400">*</span></label>
                      <textarea
                        required
                        value={branchFormData.address || ''}
                        onChange={e => setBranchFormData({...branchFormData, address: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none bg-white"
                        placeholder="Floor, Building, Street, Area, City..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                        <input
                          type="text"
                          value={branchFormData.phone || ''}
                          onChange={e => setBranchFormData({...branchFormData, phone: e.target.value})}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          placeholder="9876543210"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">GST Number</label>
                        <input
                          type="text"
                          value={branchFormData.gstNumber || ''}
                          onChange={e => setBranchFormData({...branchFormData, gstNumber: e.target.value})}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          placeholder="GSTIN..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Timing */}
                <div className="bg-blue-50/50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operating Hours</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Opening Time <span className="text-red-400">*</span></label>
                      <input
                        type="time" required
                        value={branchFormData.openingTime || '09:00'}
                        onChange={e => setBranchFormData({...branchFormData, openingTime: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Closing Time <span className="text-red-400">*</span></label>
                      <input
                        type="time" required
                        value={branchFormData.closingTime || '21:00'}
                        onChange={e => setBranchFormData({...branchFormData, closingTime: e.target.value})}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Appointments outside these hours will be blocked from this branch.</p>
                </div>

                {/* Section 3: APIs & Payments */}
                <div className="bg-purple-50/50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">APIs & Payment Gateway <span className="text-slate-300 font-normal normal-case">(Leave blank to use main salon keys)</span></p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">WhatsApp API Key</label>
                      <input
                        type="password"
                        value={branchFormData.whatsappApiKey || ''}
                        onChange={e => setBranchFormData({...branchFormData, whatsappApiKey: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMS API Key</label>
                      <input
                        type="password"
                        value={branchFormData.smsApiKey || ''}
                        onChange={e => setBranchFormData({...branchFormData, smsApiKey: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stripe Publishable Key</label>
                      <input
                        type="password"
                        value={branchFormData.stripePublishableKey || ''}
                        onChange={e => setBranchFormData({...branchFormData, stripePublishableKey: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stripe Secret Key</label>
                      <input
                        type="password"
                        value={branchFormData.stripeSecretKey || ''}
                        onChange={e => setBranchFormData({...branchFormData, stripeSecretKey: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        placeholder="sk_test_..."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Automation */}
                <div className="bg-emerald-50/50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Automation</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={branchFormData.enableAutomation !== false}
                        onChange={e => setBranchFormData({...branchFormData, enableAutomation: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition-all peer-focus:ring-2 peer-focus:ring-indigo-300"></div>
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Enable Automated Campaigns & SMS</p>
                      <p className="text-xs text-slate-400">Birthday wishes, booking confirmations, and follow-ups for this branch</p>
                    </div>
                  </label>
                </div>

              </div>

              {/* Footer — fixed */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  {editingBranch ? '✓ Save Branch Changes' : '+ Create Branch'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slideUp overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              <button onClick={() => setShowRoleModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Role Name</label>
                <input
                  type="text"
                  required
                  value={roleFormData.name}
                  onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g., Manager, Accountant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Module Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'billing', name: 'Billing' },
                    { id: 'appointments', name: 'Appointments' },
                    { id: 'products', name: 'Inventory & Products' },
                    { id: 'services', name: 'Services' },
                    { id: 'customers', name: 'Customers' },
                    { id: 'reports', name: 'Reports' },
                    { id: 'marketing', name: 'Marketing' },
                    { id: 'staff', name: 'Staff Management' },
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox"
                        checked={roleFormData.permissions.includes(p.id)}
                        onChange={(e) => {
                          const current = roleFormData.permissions;
                          if (e.target.checked) {
                            setRoleFormData({...roleFormData, permissions: [...current, p.id]});
                          } else {
                            setRoleFormData({...roleFormData, permissions: current.filter((id: string) => id !== p.id)});
                          }
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-700">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default SettingsPage;
