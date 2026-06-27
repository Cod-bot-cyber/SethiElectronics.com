import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { getBreadcrumbSchema, getLocalBusinessSchema } from '../lib/seoData';

export default function Contact() {
  const { websiteSettings, showToast } = useApp();
  const [form, setForm] = useState({ name: '', mobile: '', message: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'queries'), {
        name: form.name,
        mobile: form.mobile,
        message: form.message,
        createdAt: new Date().toISOString(),
        status: 'pending',
        reply: ''
      });

      setForm({ name: '', mobile: '', message: '' });
      setSuccess('Your query has been sent directly to Sethi Electronics. We will call you back shortly!');
      showToast('Your query has been sent successfully!', 'success');
    } catch (err) {
      console.error('Failed to submit contact query: ', err);
      showToast('Failed to send query. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact Us', url: '/contact' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <SEO
        title="Contact Us | SethiElectronicsOnline"
        description="Get in touch with Sethi Electronics. Contact us for queries, wholesale pricing, or direct support. Call us at +91 70607 84706 or visit our showroom."
        keywords="contact sethi electronics, sethi electronics phone number, modinagar showroom location"
        jsonLd={[
          getBreadcrumbSchema(breadcrumbs),
          getLocalBusinessSchema()
        ]}
      />
      
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="font-sans font-extrabold text-3xl text-gray-900 tracking-tight">Contact Sethi Electronics</h1>
        <p className="font-sans text-xs sm:text-sm text-gray-500 mt-2">Have a question about shipping, wholesale orders, or warranties? Get in touch with us!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        
        {/* Contact Info column */}
        <div className="space-y-8 font-sans">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-sans font-extrabold text-lg text-gray-800">Showroom Details</h3>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-800">Main Office & Showroom</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {websiteSettings?.storeAddress || 'Civil Lines, Near Harvansh Hall, Modinagar, Uttar Pradesh, Pin - 201204, India.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-800">Phone Support Helpline</h4>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {websiteSettings?.contactNumbers?.[0] || '+91 7060784706'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {websiteSettings?.storeTimings || 'Available (9:00 AM - 8:30 PM)'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-800">Direct Email Support</h4>
                <p className="text-xs text-gray-500 mt-1 font-mono">sethielectronics@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Submission Column */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm h-fit">
          <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-6">Send Direct Query</h3>
          
          {success ? (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 space-y-3 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-sans text-xs font-semibold">{success}</p>
              <button 
                onClick={() => setSuccess('')}
                className="text-xxs font-bold text-blue-600 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyanshu Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Your Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">How can we help you?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter details about bulk orders, replacement requests, or tracking queries..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Sending Query...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
