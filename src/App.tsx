import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import MobileNavigation from './components/MobileNavigation';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import FloatingCart from './components/FloatingCart';
import FloatingWhatsApp from './components/FloatingWhatsApp';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Search from './pages/Search';
import About from './pages/About';
import Contact from './pages/Contact';
import Policies from './pages/Policies';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function AppContent() {
  const { websiteSettings } = useApp();

  if (!websiteSettings) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-full border-4 border-blue-500/10 border-t-blue-600 animate-spin" />
          <div className="absolute font-sans font-black text-xs text-blue-600">
            SE
          </div>
        </div>
        <p className="mt-4 text-xs font-sans font-extrabold text-gray-400 uppercase tracking-widest animate-pulse">
          Loading Sethi Electronics...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-gray-50/50 text-gray-800">
        {/* Main Desktop + Mobile Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-grow pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/category/:categoryId" element={<Products />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/products/:productId" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/admin" element={<Admin />} />
            
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Site Footer */}
        <Footer />

        {/* Sticky Mobile Bottom Navigation Panel */}
        <FloatingCart />
        <FloatingWhatsApp />
        <MobileNavigation />
      </div>
    </BrowserRouter>
  );
}
