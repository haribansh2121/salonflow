'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { publicAPI } from '../lib/api';
import {
  Scissors, Calendar, Clock, User, Phone,
  Sparkles, CheckCircle, Loader2, ChevronRight, ArrowLeft
} from 'lucide-react';

const PublicBookingPage = () => {
  const params = useParams();
  const tenantId = params.tenantId as string;

  const [salonInfo, setSalonInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceId: '',
    staffId: '',
    branchId: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await publicAPI.getInfo(tenantId);
        setSalonInfo(response.data);
        if (response.data.branches && response.data.branches.length === 1) {
          setFormData(prev => ({ ...prev, branchId: String(response.data.branches[0].id) }));
        }
      } catch (error) {
        console.error('Error fetching salon info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [tenantId]);

  const handleBook = async () => {
    setBookingStatus('booking');
    try {
      await publicAPI.book(tenantId, formData);
      setBookingStatus('success');
    } catch (error) {
      setBookingStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!salonInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col p-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Salon Not Found</h2>
        <p className="text-slate-500">The booking link seems to be invalid or expired.</p>
      </div>
    );
  }

  if (bookingStatus === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-8">
            Thank you for choosing {salonInfo.salon.name}. We've received your booking for {formData.date} at {formData.time}.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const selectedService = salonInfo.services.find((s: any) => s.id === parseInt(formData.serviceId));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <div className="max-w-xl w-full mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl mb-4 shadow-xl shadow-indigo-200">
          <Sparkles size={24} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">{salonInfo.salon.name}</h1>
        <p className="text-slate-500">Book your next appointment in seconds.</p>
      </div>

      {/* Booking Card */}
      <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-white overflow-hidden">
        {/* Progress Bar */}
        <div className="flex h-1.5 bg-slate-100">
          <div
            className="bg-indigo-600 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10">
          {step === 1 && (
            <div className="animate-fadeIn">
              {salonInfo.branches?.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Location</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-indigo-100 outline-none"
                  >
                    <option value="" disabled>Choose a branch...</option>
                    {salonInfo.branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name} - {b.address}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Scissors size={20} className="text-indigo-600" />
                Select a Service
              </h3>
              <div className="space-y-3">
                {salonInfo.services.map((service: any) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (salonInfo.branches?.length > 1 && !formData.branchId) {
                        alert("Please select a location first.");
                        return;
                      }
                      setFormData({ ...formData, serviceId: String(service.id) });
                      setStep(2);
                    }}
                    className={`w-full text-left p-4 border rounded-2xl transition-all flex items-center justify-between group ${formData.serviceId === String(service.id)
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{service.name}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">
                        {service.durationMinutes} mins · {service.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600">₹{parseFloat(service.price).toLocaleString()}</span>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-6 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Services
              </button>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Choose Date & Time
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Select Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Preferred Time</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                      <button
                        key={time}
                        onClick={() => setFormData({ ...formData, time })}
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${formData.time === time
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  Continue to Details <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-6 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Schedule
              </button>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-indigo-600" />
                Your Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-indigo-100 outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-indigo-100 outline-none"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium focus:ring-4 focus:ring-indigo-100 outline-none"
                    placeholder="Enter your phone"
                  />
                </div>

                {/* Booking Summary Card */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white mt-8 mb-6">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Booking Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Service</span>
                      <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Date & Time</span>
                      <span className="font-bold">{formData.date} at {formData.time}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-3">
                      <span className="text-slate-300">Total Price</span>
                      <span className="text-xl font-black text-indigo-400">₹{parseFloat(selectedService?.price || '0').toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={bookingStatus === 'booking' || !formData.customerName || !formData.customerPhone}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-200 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50"
                >
                  {bookingStatus === 'booking' ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-slate-400 text-sm font-medium">
        Powered by <span className="text-indigo-500 font-bold">SalonFlow</span>
      </p>
    </div>
  );
};

export default PublicBookingPage;
