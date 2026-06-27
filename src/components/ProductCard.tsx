import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Star, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  isFeatured?: boolean;
}

export default function ProductCard({ product, isFeatured = false }: ProductCardProps) {
  const { toggleWishlist, isInWishlist, addToCart, cart, updateCartQuantity, removeFromCart } = useApp();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const discountAmount = product.originalPrice - product.price;
  const isWishlisted = isInWishlist(product.id);
  const cartItem = cart.find(item => item.product.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/cart');
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickViewOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative flex flex-col bg-white/95 hover:bg-white border border-gray-150/70 hover:border-blue-200/60 shadow-[0_3px_15px_-3px_rgba(0,0,0,0.015)] hover:shadow-[0_16px_36px_rgba(37,99,235,0.07)] rounded-3xl transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {/* Reflective sweep effect for featured items */}
        {isFeatured && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <div className="absolute -inset-y-12 -inset-x-20 w-16 bg-white/20 blur-md transform rotate-30 animate-[sweep_4s_infinite_ease-in-out]" />
          </div>
        )}

        {/* Product Image Stage */}
        <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
          {/* Discount Badge */}
          {product.discount > 0 && (
            <span className="absolute top-3 left-3 z-20 bg-gradient-to-r from-red-500 to-amber-500 text-white font-sans text-xxs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
              {product.discount}% OFF
            </span>
          )}

          {/* Out of stock cover */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center gap-1.5 p-4">
              <AlertTriangle className="h-7 w-7 text-amber-500 animate-bounce" />
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                Out of stock
              </span>
            </div>
          )}

          {/* Zoom Image */}
          <img
            src={product.images?.[0] || null}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform duration-700 ease-out group-hover:scale-108"
          />

          {/* Floating Actions on Hover */}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-all z-10 duration-300" />
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-25 p-2 rounded-full bg-white hover:bg-gray-50 shadow-md border border-gray-50 active:scale-90 transition-all"
          >
            <Heart
              className={`h-4.5 w-4.5 transition-all ${
                isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'
              }`}
            />
          </button>

          {/* Quick actions overlay at bottom of stage */}
          <div className="absolute bottom-3 left-3 right-3 z-25 flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={handleQuickViewOpen}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 font-sans font-bold text-xs rounded-xl shadow-md border border-gray-100 active:scale-95 transition-all"
            >
              <Eye className="h-4 w-4 text-blue-500" />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Product Meta */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          {/* Brand & Stock Status */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-sans font-extrabold text-xxs text-gray-400 uppercase tracking-wider">
              {product.brand}
            </span>
            {product.stock > 0 && product.stock <= 3 && (
              <span className="font-sans font-semibold text-xxs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Only {product.stock} Left!
              </span>
            )}
            {product.stock > 3 && (
              <span className="font-sans font-semibold text-xxs text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" />
                <span>In Stock</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="font-sans font-medium text-sm text-gray-800 line-clamp-2 leading-snug hover:text-blue-600 mb-2 min-h-10">
            {product.name}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-sans font-bold text-xxs text-gray-500 pl-0.5">
              {product.rating}
            </span>
            <span className="font-sans text-xxs text-gray-400">
              ({product.reviewsCount})
            </span>
          </div>

          {/* Prices & Action Button Area */}
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-lg text-blue-600">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="font-mono text-xs text-gray-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Direct Add to Cart / Buy Now Trigger Button row */}
            {product.stock > 0 ? (
              <AnimatePresence mode="wait">
                {cartItem ? (
                  <motion.div
                    key="quantity-selector"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="flex items-center justify-between bg-blue-600 text-white font-sans font-bold text-xs rounded-xl shadow-md h-[34px] mt-1 overflow-hidden"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (cartItem.quantity === 1) {
                          removeFromCart(product.id);
                        } else {
                          updateCartQuantity(product.id, cartItem.quantity - 1);
                        }
                      }}
                      className="h-full px-3 hover:bg-blue-700 active:scale-95 transition-all text-sm font-sans flex items-center justify-center shrink-0 border-r border-blue-500/20 w-10"
                    >
                      −
                    </button>
                    <motion.span
                      key={cartItem.quantity}
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="font-mono text-xs select-none"
                    >
                      {cartItem.quantity} in Cart
                    </motion.span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (cartItem.quantity < product.stock) {
                          updateCartQuantity(product.id, cartItem.quantity + 1);
                        }
                      }}
                      className="h-full px-3 hover:bg-blue-700 active:scale-95 transition-all text-sm font-sans flex items-center justify-center shrink-0 border-l border-blue-500/20 w-10"
                    >
                      +
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add-buy-buttons"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="grid grid-cols-2 gap-2 mt-1"
                  >
                    <button
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-sans font-bold text-xs rounded-xl transition-all active:scale-95"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Buy</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <button
                disabled
                className="w-full py-2 bg-gray-100 text-gray-400 font-sans font-semibold text-xs rounded-xl cursor-not-allowed text-center"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick View Modal Overlay */}
      <AnimatePresence>
        {showQuickView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickView(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowQuickView(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                Close
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image panel */}
                <div className="bg-gray-50 aspect-square flex items-center justify-center p-6">
                  <img
                    src={product.images?.[0] || null}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                </div>

                {/* Details panel */}
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="font-sans font-extrabold text-xs text-blue-600 uppercase tracking-wider">{product.brand}</span>
                    <h3 className="font-sans font-bold text-xl text-gray-800 mt-1.5 leading-snug">{product.name}</h3>
                    
                    {/* Price and discount */}
                    <div className="flex items-baseline gap-2 mt-4 mb-4">
                      <span className="font-mono font-extrabold text-2xl text-blue-600">{formatINR(product.price)}</span>
                      {product.originalPrice > product.price && (
                        <>
                          <span className="font-mono text-sm text-gray-400 line-through">{formatINR(product.originalPrice)}</span>
                          <span className="font-sans font-bold text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            Save {formatINR(discountAmount)} ({product.discount}% OFF)
                          </span>
                        </>
                      )}
                    </div>

                    <p className="font-sans text-sm text-gray-500 leading-relaxed line-clamp-4">{product.description}</p>
                    
                    <div className="border-t border-gray-100 pt-4 mt-4 text-xs font-sans text-gray-400 space-y-2">
                      <div><strong className="text-gray-700">Category:</strong> <span className="capitalize">{product.category}</span></div>
                      <div><strong className="text-gray-700">Warranty:</strong> {product.warranty}</div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={(e) => {
                        handleAddToCart(e);
                        setShowQuickView(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-sans font-bold text-sm rounded-xl transition-all"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={(e) => {
                        handleBuyNow(e);
                        setShowQuickView(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                    >
                      <Zap className="h-5 w-5" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
