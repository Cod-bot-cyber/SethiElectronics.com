import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Heart, User, Sparkles, Grid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function MobileNavigation() {
  const { cart, wishlist } = useApp();
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

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 py-2 px-4 flex justify-around items-center z-40 shadow-lg pb-safe">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-colors py-1 px-3 rounded-xl min-w-16 min-h-12",
            isActive && "text-blue-600 font-medium"
          )
        }
      >
        <Home className="h-5 w-5" />
        <span className="font-sans text-xxs tracking-wide">Home</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-colors py-1 px-3 rounded-xl min-w-16 min-h-12",
            isActive && "text-blue-600 font-medium"
          )
        }
      >
        <Grid className="h-5 w-5" />
        <span className="font-sans text-xxs tracking-wide">Products</span>
      </NavLink>

      <NavLink
        to="/cart"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-colors py-1 px-3 rounded-xl min-w-16 min-h-12 relative",
            isActive && "text-blue-600 font-medium"
          )
        }
      >
        <div className="relative">
          <motion.div
            animate={shouldPulse ? { scale: [1, 1.4, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <ShoppingCart className="h-5 w-5" />
          </motion.div>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 h-4.5 w-4.5 bg-blue-600 text-white font-sans text-xxs font-bold rounded-full flex items-center justify-center border border-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className="font-sans text-xxs tracking-wide">Cart</span>
      </NavLink>

      <NavLink
        to="/profile?tab=wishlist"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-colors py-1 px-3 rounded-xl min-w-16 min-h-12 relative",
            isActive && "text-blue-600 font-medium"
          )
        }
      >
        <div className="relative">
          <Heart className="h-5 w-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1.5 -right-2 h-4.5 w-4.5 bg-red-500 text-white font-sans text-xxs font-bold rounded-full flex items-center justify-center border border-white">
              {wishlistCount}
            </span>
          )}
        </div>
        <span className="font-sans text-xxs tracking-wide">Wishlist</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-colors py-1 px-3 rounded-xl min-w-16 min-h-12",
            isActive && "text-blue-600 font-medium"
          )
        }
      >
        <User className="h-5 w-5" />
        <span className="font-sans text-xxs tracking-wide">Profile</span>
      </NavLink>
    </div>
  );
}
