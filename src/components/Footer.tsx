import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Shield, RotateCcw, FileText, Mail, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Footer() {
  const { websiteSettings } = useApp();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 pt-12 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div>
            <h3 className="font-sans font-bold text-lg text-white mb-4">
              {websiteSettings?.name || 'Sethi Electronics'}
            </h3>
            <p className="font-sans text-sm text-gray-400 leading-relaxed mb-6">
              Your premium destination for high-quality consumer electronics, home appliances, cooktops, lightings, and more. Bringing real value to Indian homes since 1979.
            </p>
            <div className="flex flex-wrap gap-4">
              {/* Custom dynamic social links */}
              {[
                { name: 'Facebook', url: websiteSettings?.socialLinks?.facebook || 'https://facebook.com/sethielectronics' },
                { name: 'Instagram', url: websiteSettings?.socialLinks?.instagram || 'https://instagram.com/sethielectronics' },
                { name: 'Twitter', url: websiteSettings?.socialLinks?.twitter || 'https://twitter.com/sethielectronics' },
                { name: 'YouTube', url: websiteSettings?.socialLinks?.youtube || 'https://youtube.com' }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs font-semibold text-gray-400 hover:text-white hover:underline transition-all"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span>Contact & Store</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <span>Return Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Terms & Conditions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Info */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-white uppercase tracking-wider mb-4">Store Location</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-gray-400">
                  {websiteSettings?.storeAddress || 'Sethi Electronics, Civil Lines, Opposite Railway Crossing, Modinagar, Uttar Pradesh - 201204'}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="text-gray-400">
                  {websiteSettings?.storeTimings || '10:00 AM - 08:30 PM (Sunday Closed)'}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-white uppercase tracking-wider mb-4">Contact Sales</h4>
            <p className="font-sans text-xs text-gray-400 mb-4 leading-relaxed">
              Have questions about products, availability, or orders? Give us a call directly.
            </p>
            <div className="space-y-3.5">
              <a
                href={`tel:${(websiteSettings?.contactNumbers?.[0] || '+91 70607 84706').replace(/\s+/g, '')}`}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all group"
              >
                <Phone className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-sans text-xxs text-gray-400 uppercase">Sales Call</div>
                  <div className="font-mono text-sm font-semibold text-white">
                    {websiteSettings?.contactNumbers?.[0] || '+91 70607 84706'}
                  </div>
                </div>
              </a>
              <a
                href={`tel:${(websiteSettings?.contactNumbers?.[1] || '+91 93197 84706').replace(/\s+/g, '')}`}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all group"
              >
                <Phone className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-sans text-xxs text-gray-400 uppercase">WhatsApp / Helpline</div>
                  <div className="font-mono text-sm font-semibold text-white">
                    {websiteSettings?.contactNumbers?.[1] || '+91 93197 84706'}
                  </div>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-sans">
            &copy; {new Date().getFullYear()} Sethi Electronics. All Rights Reserved. Modinagar, UP, India.
          </p>
          <p className="font-mono flex items-center gap-1.5">
            <span>Production Ready Static Application</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </p>
        </div>
      </div>
    </footer>
  );
}
