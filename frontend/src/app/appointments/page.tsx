'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { appointmentsAPI, servicesAPI, staffAPI } from '../lib/api';
import {
  Plus, X, Loader2, CalendarDays, Clock, ChevronLeft, ChevronRight,
  Check, XCircle, UserCircle, List, LayoutGrid
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  'no-show': 'bg-slate-100 text-slate-500 border-slate-200',
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const [customerType, setCustomerType] = useState<'registered' | 'walk-in'>('registered');
  const [formData, setFormData] = useState({
    customerId: '', customerName: '', customerPhone: '', customerEmail: '', serviceId: '', staffId: '', date: '', time: '10:00', duration: '30', notes: ''
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await appointmentsAPI.getAll({ date: selectedDate });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchMeta = useCallback(async () => {
    try {
      const [svcRes, staffRes, custRes] = await Promise.all([
        servicesAPI.getAll(), 
        staffAPI.getAll(),
        fetch('http://localhost:5005/api/customers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json())
      ]);
      setServices(svcRes.data);
      setStaffList(staffRes.data.filter((s: any) => s.role === 'STAFF'));
      setCustomersList(Array.isArray(custRes) ? custRes : custRes.data || []);
    } catch (error) {
      console.error('Error fetching meta:', error);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const openModal = () => {
    setCustomerType('registered');
    setFormData({
      customerId: '', customerName: '', customerPhone: '', customerEmail: '', serviceId: '', staffId: '',
      date: selectedDate, time: '10:00', duration: '30', notes: ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentsAPI.create({
        customerType,
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        serviceId: formData.serviceId ? parseInt(formData.serviceId) : undefined,
        staffId: formData.staffId ? parseInt(formData.staffId) : undefined,
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration) || 30,
        notes: formData.notes,
      });
      setShowModal(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const displayDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Scheduler Constants
  const START_HOUR = 9;
  const END_HOUR = 21;
  const SLOT_DURATION = 30; // minutes

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT_DURATION) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const getAppointmentStyle = (appt: any) => {
    const [h, m] = (appt.time || '00:00').split(':').map(Number);
    const top = ((h - START_HOUR) * 60 + m) * 2; // 2px per minute
    const height = (appt.duration || 30) * 2;
    return { top: `${top}px`, height: `${height}px` };
  };

  const timeSlots = generateTimeSlots();

  const scheduledCount = appointments.filter(a => a.status === 'scheduled').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const inProgressCount = appointments.filter(a => a.status === 'in-progress').length;

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>
            <p className="text-slate-500 mt-1">Schedule and manage salon appointments.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Timeline View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 text-sm"
            >
              <Plus size={18} />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center">
            <p className="text-2xl font-black text-blue-600">{scheduledCount}</p>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Scheduled</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl text-center">
            <p className="text-2xl font-black text-purple-600">{appointments.filter(a => a.status === 'confirmed').length}</p>
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Confirmed</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center">
            <p className="text-2xl font-black text-amber-600">{inProgressCount}</p>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">In Progress</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
            <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Completed</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-center">
            <p className="text-2xl font-black text-rose-600">{appointments.filter(a => a.status === 'cancelled').length}</p>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Cancelled</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-center">
            <p className="text-2xl font-black text-slate-500">{appointments.filter(a => a.status === 'no-show').length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Show</p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
            <div className="px-4 flex items-center gap-2 border-x border-slate-100">
              <CalendarDays size={16} className="text-indigo-500" />
              <span className="font-bold text-slate-700 text-sm">{displayDate}</span>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18} /></button>
          </div>
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            Today
          </button>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isToday ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Today
          </button>
          {[-1, 1, 2, 3].map(d => {
            const dt = new Date();
            dt.setDate(dt.getDate() + d);
            const dtStr = dt.toISOString().split('T')[0];
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(dtStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedDate === dtStr ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {d === -1 ? 'Yesterday' : dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </button>
            );
          })}
        </div>

        {/* Content View */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
          </div>
        ) : viewMode === 'timeline' ? (
          /* Timeline Grid */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[700px]">
            {/* Grid Header (Staff) */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <div className="w-20 border-r border-slate-100" />
              {staffList.map(staff => (
                <div key={staff.id} className="flex-1 p-4 text-center border-r border-slate-100 last:border-r-0">
                  <p className="font-black text-slate-800 text-xs uppercase tracking-tighter">{staff.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{staff.specialization || 'Stylist'}</p>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
              <div className="flex">
                <div className="w-20 bg-slate-50/30 border-r border-slate-100 sticky left-0 z-10">
                  {timeSlots.map(time => (
                    <div key={time} className="h-[60px] border-b border-slate-50 flex items-start justify-center pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{time}</span>
                    </div>
                  ))}
                </div>

                {staffList.map(staff => (
                  <div key={staff.id} className="flex-1 border-r border-slate-100 last:border-r-0 relative min-h-[1440px]">
                    {timeSlots.map(time => (
                      <div key={time} className="h-[60px] border-b border-slate-50/50" />
                    ))}
                    {appointments
                      .filter(a => a.staffId === staff.id)
                      .map(appt => (
                        <div
                          key={appt.id}
                          style={getAppointmentStyle(appt)}
                          className={`absolute left-1 right-1 rounded-xl border-l-4 p-3 shadow-sm cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] z-20 overflow-hidden ${
                            statusColors[appt.status] || 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <p className="font-black text-[11px] leading-tight truncate">{appt.customerName}</p>
                              <p className="text-[9px] opacity-70 font-bold uppercase truncate">{appt.Service?.name}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[9px] font-black">{appt.time}</span>
                              {appt.status === 'scheduled' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'completed'); }}
                                  className="p-1 bg-white/50 hover:bg-white rounded-md transition-colors"
                                >
                                  <Check size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-700">{appt.time}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{appt.customerName}</p>
                      <p className="text-[10px] text-slate-400">{appt.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-lg text-slate-600">{appt.Service?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{appt.assignedStaff?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={appt.status}
                        onChange={(e) => updateStatus(appt.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${statusColors[appt.status]}`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No Show</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <XCircle size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm">No appointments for this day</div>
            )}
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Book Appointment</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Customer Selection Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setCustomerType('registered')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${customerType === 'registered' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Registered
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('walk-in');
                    setFormData({ ...formData, customerId: '', customerName: '', customerPhone: '', customerEmail: '' });
                  }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${customerType === 'walk-in' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Walk-in (New)
                </button>
              </div>

              {customerType === 'registered' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Select Customer *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => {
                      const cust = customersList.find(c => c.id.toString() === e.target.value);
                      setFormData({ 
                        ...formData, 
                        customerId: e.target.value,
                        customerName: cust ? cust.name : '',
                        customerPhone: cust ? cust.phone : '',
                        customerEmail: cust ? cust.email : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    required
                  >
                    <option value="">Choose an existing customer...</option>
                    {customersList.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Customer Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Walk-in name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
                      <input
                        type="text"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Email (optional)"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Service</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => {
                    const svc = services.find((s: any) => s.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      serviceId: e.target.value,
                      duration: svc ? String(svc.durationMinutes) : formData.duration
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Select a service</option>
                  {services.map((svc: any) => (
                    <option key={svc.id} value={svc.id}>{svc.name} - ₹{svc.price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Assign Staff</label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Any available</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    {[15, 20, 30, 45, 60, 90, 120, 180].map(d => (
                      <option key={d} value={d}>{d} mins</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  placeholder="Any special requests..."
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
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default AppointmentsPage;
