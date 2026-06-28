import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, Tag, Settings, LogOut, Percent, Grid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { currentUser, cart, wishlist, products, categories, websiteSettings, logout } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const [shouldPulse, setShouldPulse] = useState(false);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 450);
      return () => clearTimeout(timer);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  // Handle outside click for search suggestions & profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setIsSuggesting(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions while typing
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const filtered = products
      .filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(filtered);
    setIsSuggesting(true);
  }, [searchQuery, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSuggesting(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const selectSuggestion = (prodId: string) => {
    setIsSuggesting(false);
    setSearchQuery('');
    navigate(`/product/${prodId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed: ', err);
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)] saturate-150 transition-all duration-500"
      style={{
        boxShadow: '0 4px 30px rgba(0,0,0,0.02), 0 8px 30px -4px var(--navbar-reflection, transparent)'
      }}
    >
      {/* Dynamic bottom ambient reflection line reflecting active carousel slide */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[var(--navbar-reflection,transparent)] to-transparent opacity-90 blur-[0.5px] transition-all duration-700 pointer-events-none" 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo with Modern Interactive Hover Shine & Grains */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group relative">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="relative overflow-hidden rounded-full shrink-0 shadow-sm"
              >
                {websiteSettings?.logo && (websiteSettings.logo.startsWith('http') || websiteSettings.logo.startsWith('data:')) ? (
                  <img 
                    src={websiteSettings.logo} 
                    alt={websiteSettings?.name || 'Sethi Electronics'} 
                    className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-full border border-blue-100 bg-white shadow-sm transition-all group-hover:border-blue-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-sans font-extrabold text-sm sm:text-base shadow-md shadow-blue-500/20 shrink-0">
                    SE
                  </div>
                )}
                {/* Micro-shine over logo */}
                <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                  <span className="absolute -inset-y-4 -inset-x-12 w-8 bg-white/30 blur-sm transform rotate-30 animate-[sweep_2.5s_infinite_ease-in-out]" />
                </span>
              </motion.div>
              
              <div className="flex flex-col">
                <span className="font-sans font-black text-lg sm:text-xl md:text-2xl tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 relative leading-none">
                  {websiteSettings?.name || 'Sethi Electronics'}
                  {/* Subtle active indicator dot */}
                  <span className="absolute -right-3 top-1 h-1.5 w-1.5 bg-blue-500 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 shadow-sm shadow-blue-500/50" />
                </span>
                <span className="hidden sm:inline-block text-[9px] font-sans font-extrabold text-blue-600 uppercase tracking-widest mt-1 opacity-85 group-hover:opacity-100 transition-opacity">
                  Home Appliances & Electronics
                </span>
              </div>
            </Link>
          </div>

          {/* Real-time Search Bar with Glass Glow */}
          <div className="hidden md:flex flex-1 max-w-lg relative" ref={suggestionRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative group">
              <input
                type="text"
                placeholder="Search premium appliances, fans, geysers, mixers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setIsSuggesting(true)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-full border border-gray-200/80 bg-gray-50/50 backdrop-blur-md font-sans text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {isSuggesting && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto"
                >
                  <div className="p-2.5 border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-4">
                    Suggestions Match
                  </div>
                  {suggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => selectSuggestion(prod.id)}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50/40 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                    >
                      <img
                        src={prod.images?.[0] || null}
                        alt={prod.name}
                        className="w-10 h-10 object-contain p-1 rounded-lg bg-white border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-sans font-bold text-[10px] text-gray-400 uppercase tracking-wider">{prod.brand}</div>
                        <div className="font-sans text-xs sm:text-sm font-medium text-gray-800 truncate">{prod.name}</div>
                        <div className="font-mono text-xs font-bold text-blue-600">{formatINR(prod.price)}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation Links with Sliding Underline */}
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Products', path: '/products' },
              { label: 'About Us', path: '/about' },
              { label: 'Contact', path: '/contact' }
            ].map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="font-sans text-sm font-bold text-gray-600 hover:text-blue-600 transition-all duration-200 relative py-1.5 group"
              >
                <span>{link.label}</span>
                {/* Smooth sliding bottom line animation */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300 rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Right Icons: Wishlist, Cart, Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Wishlist */}
            <Link to="/profile?tab=wishlist" className="hidden sm:inline-flex relative p-2 text-gray-600 hover:text-red-500 hover:bg-red-50/50 rounded-full transition-all">
              <Heart className="h-5.5 w-5.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white font-sans text-xxs font-bold rounded-full flex items-center justify-center border border-white animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart with Reflective Shine badge */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-all">
              <motion.div
                animate={shouldPulse ? { scale: [1, 1.4, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] } : { scale: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <ShoppingCart className="h-5.5 w-5.5" />
              </motion.div>
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white font-sans text-xxs font-bold rounded-full flex items-center justify-center border border-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              {currentUser ? (
                <div>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 p-1.5 sm:p-2 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-full cursor-pointer transition-all"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 bg-blue-600 text-white font-sans font-bold text-sm rounded-full flex items-center justify-center shadow-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline font-sans text-xs font-semibold text-gray-700 pr-1 truncate max-w-24">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </button>

                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-50">
                          <p className="font-sans font-semibold text-sm text-gray-800">{currentUser.name}</p>
                          <p className="font-mono text-xs text-gray-400 mt-0.5">{currentUser.mobile}</p>
                        </div>
                        {currentUser.isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 font-sans text-sm font-semibold text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 font-sans text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                        <Link
                          to="/profile?tab=orders"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 font-sans text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Percent className="h-4 w-4" />
                          My Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 font-sans text-sm text-red-600 hover:bg-red-50/50 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-sans font-semibold text-xs sm:text-sm rounded-full shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button (lg:hidden) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-full"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Animated Mobile Dropdown Menu (Secondary Links) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-gray-50 bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-100 bg-gray-50 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                >
                  <Grid className="h-4 w-4 text-blue-600" />
                  All Products
                </Link>
                <Link
                  to="/profile?tab=wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-red-50 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                >
                  <Heart className="h-4 w-4 text-red-500" />
                  Wishlist
                </Link>
              </div>

              <div className="border-t border-gray-50 pt-2 space-y-1">
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Contact & Store Location
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
