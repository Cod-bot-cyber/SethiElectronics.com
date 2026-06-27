import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FloatingCart() {
  const { cart } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on cart and checkout pages, or if cart is empty
  const isCartPage = location.pathname === '/cart';
  const isCheckoutPage = location.pathname === '/checkout';
  const isCartEmpty = cart.length === 0;

  if (isCartPage || isCheckoutPage || isCartEmpty) {
    return null;
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-45"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/cart')}
          className="w-full bg-blue-600/90 hover:bg-blue-600 border border-blue-500/30 text-white backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 flex items-center justify-between shadow-[0_12px_40px_rgba(37,99,235,0.25)] hover:shadow-[0_16px_48px_rgba(37,99,235,0.35)] transition-all duration-300 group"
          id="floating-cart-bar"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 relative shrink-0">
              <ShoppingCart className="h-5 w-5 text-white" />
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white font-sans text-xxs font-black rounded-full flex items-center justify-center border-2 border-blue-600 shadow-sm animate-pulse">
                {cartCount}
              </span>
            </div>
            <div className="text-left">
              <p className="font-sans font-bold text-sm tracking-tight">
                {cartCount} {cartCount === 1 ? 'Item' : 'Items'} in Cart
              </p>
              <p className="font-mono text-xs font-semibold text-blue-100 mt-0.5">
                {formatINR(totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-sans font-extrabold shadow-sm transition-all group-hover:translate-x-0.5">
            <span>View Cart</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
