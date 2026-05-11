'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Scissors, 
  Package, 
  Receipt, 
  Users, 
  CalendarDays, 
  LogOut,
  Sparkles,
  Settings,
  Megaphone,
  BarChart3,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { settingsAPI, branchesAPI } from '../lib/api';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout, currentBranchId, switchBranch } = useAuth();
  const [salonName, setSalonName] = useState('SalonFlow');
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      settingsAPI.get().then(res => {
        if (res.data?.salonName) {
          setSalonName(res.data.salonName);
        }
      }).catch(err => console.error('Failed to load salon name:', err));

      branchesAPI.getAll().then(res => {
        setBranches(res.data);
      }).catch(err => console.error('Failed to load branches:', err));
    }
  }, [user]);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', permission: null },
    { name: 'Appointments', icon: <CalendarDays size={20} />, path: '/appointments', permission: 'appointments' },
    { name: 'Billing', icon: <Receipt size={20} />, path: '/bills', permission: 'billing' },
    { name: 'Services', icon: <Scissors size={20} />, path: '/services', permission: 'services' },
    { name: 'Products', icon: <Package size={20} />, path: '/products', permission: 'products' },
    { name: 'Customers', icon: <Users size={20} />, path: '/customers', permission: 'customers' },
    { name: 'Marketing', icon: <Megaphone size={20} />, path: '/marketing', permission: 'marketing' },
    { name: 'Reports', icon: <BarChart3 size={20} />, path: '/reports', permission: 'reports' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings', permission: 'settings' },
  ];

  const allowedMenuItems = menuItems.filter(item => 
    user?.role === 'ADMIN' || !item.permission || user?.permissions?.includes(item.permission)
  );

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      {/* Brand & Branch Switcher */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight truncate">{salonName}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</p>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
            <MapPin size={14} />
          </div>
          <select
            value={currentBranchId || ''}
            onChange={(e) => switchBranch(e.target.value || null)}
            className="w-full pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 hover:bg-slate-800 transition-all appearance-none cursor-pointer"
          >
            {/* Only admins or unassigned staff can see 'All Branches' */}
            {(!user?.branchId || user?.role === 'ADMIN') && <option value="">All Branches</option>}
            
            {branches
              .filter(b => !user?.branchId || user?.role === 'ADMIN' || b.id === user.branchId)
              .map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))
            }
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {allowedMenuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              pathname === item.path
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className={`${pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800/50 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@salon.com'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-400/10 transition-all text-sm font-medium"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
