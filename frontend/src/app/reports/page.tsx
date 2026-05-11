'use client';
import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { reportsAPI } from '../lib/api';
import { 
  TrendingUp, Users, Scissors, Package, IndianRupee, 
  Calendar, Download, ArrowUpRight, ArrowDownRight, Loader2,
  PieChart, BarChart, CreditCard
} from 'lucide-react';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [staffRevenue, setStaffRevenue] = useState<any[]>([]);
  const [serviceRevenue, setServiceRevenue] = useState<any[]>([]);
  const [productRevenue, setProductRevenue] = useState<any[]>([]);
  const [customerRevenue, setCustomerRevenue] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any[]>([]);
  const [apptStats, setApptStats] = useState<any[]>([]);
  const [exportType, setExportType] = useState('service');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [summaryRes, staffRes, serviceRes, productRes, customerRes, paymentRes, apptRes] = await Promise.all([
        reportsAPI.getSummary({ startDate: dateRange.start, endDate: dateRange.end }),
        reportsAPI.getStaffWise({ startDate: dateRange.start, endDate: dateRange.end }),
        reportsAPI.getServiceWise(),
        reportsAPI.getProductWise(),
        reportsAPI.getCustomerWise(),
        reportsAPI.getPaymentStats(),
        reportsAPI.getAppointmentStats()
      ]);
      setSummary(summaryRes.data);
      setStaffRevenue(staffRes.data);
      setServiceRevenue(serviceRes.data);
      setProductRevenue(productRes.data);
      setCustomerRevenue(customerRes.data);
      setPaymentStats(paymentRes.data);
      setApptStats(apptRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let data: any[] = [];
    let filename = 'Report';

    switch (exportType) {
      case 'service':
        headers = ['Service Name', 'Bookings', 'Revenue (₹)'];
        data = serviceRevenue.map(s => [s.name, s.count, s.revenue]);
        filename = 'Service_Revenue';
        break;
      case 'staff':
        headers = ['Staff Name', 'Bookings', 'Revenue (₹)'];
        data = staffRevenue.map(s => [s.name, s.count, s.revenue]);
        filename = 'Staff_Performance';
        break;
      case 'product':
        headers = ['Product Name', 'Sales Qty', 'Revenue (₹)'];
        data = productRevenue.map(p => [p.name, p.count, p.revenue]);
        filename = 'Product_Sales';
        break;
      case 'customer':
        headers = ['Customer Name', 'Phone', 'Visits', 'Total Spent (₹)'];
        data = customerRevenue.map(c => [c.customerName, c.customerPhone, c.visitCount, c.totalSpent]);
        filename = 'Top_Customers';
        break;
      case 'payment':
        headers = ['Payment Method', 'Transactions', 'Amount (₹)'];
        data = paymentStats.map(p => [p.paymentMethod, p.count, p.revenue]);
        filename = 'Payment_Methods';
        break;
    }

    if (!data.length) {
      alert('No data available for this report type.');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SalonFlow_${filename}_${dateRange.start}_to_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !summary) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Business Intelligence Reports</h2>
            <p className="text-slate-500 mt-1">Real-time revenue and profit analysis.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                className="text-xs font-bold text-slate-600 outline-none"
              />
              <span className="text-slate-300 mx-1">→</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                className="text-xs font-bold text-slate-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
              <select 
                value={exportType}
                onChange={e => setExportType(e.target.value)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border-none focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="service">Services</option>
                <option value="staff">Staff</option>
                <option value="product">Products</option>
                <option value="customer">Customers</option>
                <option value="payment">Payments</option>
              </select>
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={80} className="text-indigo-600" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">₹{summary?.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} /> 12.5% increase
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <PieChart size={80} className="text-rose-600" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Costs</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">₹{summary?.totalCost.toLocaleString('en-IN')}</span>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Inventory Cost</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden group bg-gradient-to-br from-white to-indigo-50/30">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={80} className="text-indigo-600" />
            </div>
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Net Profit</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-indigo-600">₹{summary?.totalProfit.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-indigo-600 font-bold text-xs bg-indigo-100/50 w-fit px-2 py-1 rounded-lg">
              Margin: {((summary?.totalProfit / summary?.totalRevenue) * 100 || 0).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package size={80} className="text-purple-600" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Bills Generated</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{summary?.billCount}</span>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Across all locations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staff Wise */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Users size={18} />
                </div>
                <h3 className="font-bold text-slate-800">Staff Performance</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {staffRevenue.map((staff, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{staff.performer?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{staff.itemCount} Items Served</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600 text-sm">₹{parseFloat(staff.revenue).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(parseFloat(staff.revenue) / (summary?.totalRevenue || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {staffRevenue.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-sm">No data for selected range</div>
                )}
              </div>
            </div>
          </div>

          {/* Service Wise */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                  <Scissors size={18} />
                </div>
                <h3 className="font-bold text-slate-800">Top Services</h3>
              </div>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <th className="pb-4">Service</th>
                    <th className="pb-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {serviceRevenue.slice(0, 8).map((svc, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-3 font-bold text-slate-700">{svc.name}</td>
                      <td className="py-3 text-right font-black text-slate-900 text-xs">₹{parseFloat(svc.revenue).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Wise */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Package size={18} />
                </div>
                <h3 className="font-bold text-slate-800">Product Sales</h3>
              </div>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <th className="pb-4">Product</th>
                    <th className="pb-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productRevenue.slice(0, 8).map((prod, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-3 font-bold text-slate-700">{prod.name}</td>
                      <td className="py-3 text-right font-black text-slate-900 text-xs">₹{parseFloat(prod.revenue).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Reports Section: Customers & Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Top Customers */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <h3 className="font-bold text-slate-800">Loyal Customers (Top Spenders)</h3>
              </div>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Visits</th>
                    <th className="pb-4 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customerRevenue.map((c, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-3">
                        <p className="font-bold text-slate-700">{c.customerName}</p>
                        <p className="text-[10px] text-slate-400">{c.customerPhone}</p>
                      </td>
                      <td className="py-3 text-slate-500 font-medium">{c.visitCount}</td>
                      <td className="py-3 text-right font-black text-slate-900">₹{parseFloat(c.totalSpent).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-1 gap-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CreditCard size={18} className="text-blue-500" />
                Payment Method Mix
              </h3>
              <div className="space-y-4">
                {paymentStats.map((p, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-tight">
                      <span className="text-slate-500">{p.paymentMethod}</span>
                      <span className="text-slate-800">₹{parseFloat(p.revenue).toLocaleString('en-IN')} ({p.count} bills)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(parseFloat(p.revenue) / (summary?.totalRevenue || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Conversion */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-purple-500" />
                Appointment Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {apptStats.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.status}</p>
                    <p className="text-xl font-black text-slate-800">{s.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="mt-8 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <BarChart size={200} />
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Service Revenue</p>
              <h4 className="text-4xl font-black mb-2">₹{summary?.serviceRevenue.toLocaleString('en-IN')}</h4>
              <div className="flex items-center gap-2 text-indigo-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Primary Income Stream
              </div>
            </div>
            <div>
              <p className="text-purple-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Product Sales</p>
              <h4 className="text-4xl font-black mb-2">₹{summary?.productRevenue.toLocaleString('en-IN')}</h4>
              <div className="flex items-center gap-2 text-purple-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Retail Inventory
              </div>
            </div>
            <div>
              <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Net Profit After COGS</p>
              <h4 className="text-4xl font-black mb-2 text-emerald-400">₹{summary?.totalProfit.toLocaleString('en-IN')}</h4>
              <div className="flex items-center gap-2 text-emerald-300 text-sm">
                <ArrowUpRight size={16} />
                Calculated dynamically
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ReportsPage;
