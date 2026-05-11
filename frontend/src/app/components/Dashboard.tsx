'use client';
import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Users,
  CalendarDays,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Search,
  Bell,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await analyticsAPI.get();
        setData(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${(data?.summary?.totalRevenue || 0).toLocaleString('en-IN')}`,
      change: '+12.5%',
      positive: true,
      icon: <DollarSign size={22} />,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      href: '/reports'
    },
    {
      label: 'Customers',
      value: data?.summary?.totalCustomers || 0,
      change: '+18.2%',
      positive: true,
      icon: <Users size={22} />,
      gradient: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/20',
      href: '/customers'
    },
    {
      label: 'Total Bills',
      value: data?.summary?.totalBills || 0,
      change: '+5.4%',
      positive: true,
      icon: <TrendingUp size={22} />,
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/20',
      href: '/bills'
    },
    {
      label: 'Appointments',
      value: data?.summary?.totalAppointments || 0,
      change: 'Today',
      positive: true,
      icon: <CalendarDays size={22} />,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      href: '/appointments'
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-slate-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋
          </h2>
          <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening at your salon today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all w-56 text-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors relative">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full pulse-dot" />
          </button>
          <Link
            href="/appointments"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
          >
            <Plus size={18} />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href} className="block">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm card-hover h-full transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow}`}>
                  {stat.icon}
                </div>
                <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-full ${
                  stat.positive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                }`}>
                  {stat.change}
                  {stat.change !== 'Today' && <ArrowUpRight size={12} />}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts + Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Revenue Overview</h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg font-medium">Last 30 Days</span>
          </div>
          <div className="h-72">
            {Array.isArray(data?.revenueByDay) && data.revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueByDay}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p>No revenue data yet. Create some bills to see charts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Top Services</h3>
          <div className="space-y-5">
            {(Array.isArray(data?.topServices) ? data.topServices : []).map((service: any, i: number) => {
              const maxCount = Math.max(...(Array.isArray(data?.topServices) ? data.topServices : []).map((s: any) => s.count || 0), 1);
              const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500'];
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{service.name}</span>
                    <span className="text-slate-400 font-medium">{service.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${colors[i % colors.length]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${(service.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!Array.isArray(data?.topServices) || data.topServices.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">No service data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Bills + Today's Appointments + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800">Recent Sales</h3>
            <Link href="/bills" className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.recentBills || []).map((bill: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {bill.customerName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{bill.customerName}</p>
                    <p className="text-xs text-slate-400">{bill.staff?.name || 'Staff'} · {new Date(bill.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm">₹{parseFloat(bill.totalAmount).toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    bill.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-600' :
                    bill.paymentMethod === 'UPI' ? 'bg-purple-50 text-purple-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {bill.paymentMethod}
                  </span>
                </div>
              </div>
            ))}
            {(!Array.isArray(data?.recentBills) || data.recentBills.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-6">No recent sales</p>
            )}
          </div>
        </div>

        {/* Today's Appointments + Low Stock */}
        <div className="space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                Today&apos;s Appointments
              </h3>
              <Link href="/appointments" className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold">
                View All →
              </Link>
            </div>
            <div className="space-y-2">
              {(data?.todayAppointments || []).map((appt: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {appt.time?.slice(0, 5)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{appt.customerName}</p>
                      <p className="text-xs text-slate-400">{appt.Service?.name || 'Service'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    appt.status === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                    appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              ))}
              {(!Array.isArray(data?.todayAppointments) || data.todayAppointments.length === 0) && (
                <p className="text-slate-400 text-sm text-center py-4">No appointments today</p>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                Low Stock Alert
              </h3>
              <div className="space-y-2">
                {(Array.isArray(data?.lowStockProducts) ? data.lowStockProducts : []).map((product: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2">
                    <span className="text-sm text-slate-600">{product.name}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      product.stock <= 2 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
