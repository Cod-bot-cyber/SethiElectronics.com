import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';

export default function FloatingWhatsApp() {
  const { websiteSettings, cart } = useApp();
  const location = useLocation();

  // Extract WhatsApp number
  const rawWhatsApp = websiteSettings?.contactNumbers?.[1] || '+91 93197 84706';
  const cleanWhatsApp = rawWhatsApp.replace(/[^\d]/g, ''); // keeps only digits
  const whatsappText = `Hello Sethi Electronics, I have a query regarding your products. Please help me.`;
  const waUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(whatsappText)}`;

  // Determine if FloatingCart is currently active to prevent overlap
  const isCartPage = location.pathname === '/cart';
  const isCheckoutPage = location.pathname === '/checkout';
  const isCartEmpty = cart.length === 0;
  const isCartFloatingActive = !isCartPage && !isCheckoutPage && !isCartEmpty;

  // Render on all customer-facing pages
  const isAdminPage = location.pathname.startsWith('/admin');
  if (isAdminPage) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 1 }}
      className={`fixed z-45 transition-all duration-300 ${
        isCartFloatingActive
          ? 'bottom-32 md:bottom-24 right-4 md:right-5'
          : 'bottom-18 md:bottom-5 right-4 md:right-5'
      }`}
    >
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-emerald-500/80 hover:bg-emerald-500/90 text-white border border-emerald-400/35 backdrop-blur-xs shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all duration-300 relative group"
        aria-label="Chat on WhatsApp"
        id="floating-whatsapp-btn"
      >
        {/* Soft pulse ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none scale-105" />
        
        {/* Hover Tooltip */}
        <span className="absolute right-13 bg-gray-900/90 text-white font-sans text-xxs font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md border border-gray-800 opacity-0 scale-95 origin-right translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none">
          WhatsApp Helpline
        </span>
        
        <MessageCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
      </a>
    </motion.div>
  );
}
