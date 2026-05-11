'use client';
import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { marketingAPI, customersAPI } from '../lib/api';
import { 
  Megaphone, Send, History, MessageSquare, 
  Mail, Phone, Loader2, CheckCircle, Clock
} from 'lucide-react';

const MarketingPage = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    type: 'whatsapp',
    content: '',
    targetAudience: 'all',
    customerId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, customersRes] = await Promise.all([
          marketingAPI.getCampaigns(),
          customersAPI.getAll()
        ]);
        setCampaigns(campaignsRes.data);
        setCustomers(customersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSend = async () => {
    if (!formData.content) return alert('Please enter message content');
    setSending(true);
    try {
      await marketingAPI.sendCampaign(formData);
      alert('Campaign started successfully!');
      const response = await marketingAPI.getCampaigns();
      setCampaigns(response.data);
      setFormData({...formData, content: '', customerId: ''});
    } catch (error) {
      alert('Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex-1 overflow-auto p-8 bg-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Marketing & Promotions</h2>
            <p className="text-slate-500 mt-1">Connect with your customers and grow your business.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Campaign */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="text-indigo-600" size={24} />
              <h3 className="text-lg font-bold text-slate-800">Start New Campaign</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">Channel</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'whatsapp', name: 'WhatsApp', icon: <MessageSquare size={18} /> },
                    { id: 'sms', name: 'SMS', icon: <Phone size={18} /> },
                    { id: 'email', name: 'Email', icon: <Mail size={18} /> },
                  ].map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setFormData({...formData, type: channel.id})}
                      className={`flex items-center justify-center gap-2 p-4 border rounded-xl transition-all ${
                        formData.type === channel.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-500'
                      }`}
                    >
                      {channel.icon}
                      {channel.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                >
                  <option value="all">All Customers</option>
                  <option value="individual">Individual Customer</option>
                  <option value="frequent">Frequent Visitors</option>
                  <option value="lapsed">Lapsed (Not visited in 30 days)</option>
                </select>
              </div>

              {formData.targetAudience === 'individual' && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Select Customer</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No Phone'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Message Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none h-48 resize-none"
                  placeholder={`Hi {name}, we have a special offer for you...`}
                />
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  Note: Actual delivery depends on your Messaging API configuration in Settings.
                </p>
              </div>

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50"
              >
                {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                Send Campaign Now
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <History className="text-slate-400" size={24} />
              <h3 className="text-lg font-bold text-slate-800">Campaign History</h3>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
              ) : campaigns.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm italic">No campaigns sent yet.</p>
              ) : campaigns.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="capitalize text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {c.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 mb-2 font-medium">{c.content}</p>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    {c.status === 'sent' ? (
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={10} /> Delivered</span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1"><Clock size={10} /> {c.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MarketingPage;
