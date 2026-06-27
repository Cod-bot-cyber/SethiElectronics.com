import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShieldCheck, Heart, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import SEO from '../components/SEO';
import { getBreadcrumbSchema } from '../lib/seoData';

export default function Cart() {
  const { cart, updateCartQuantity, removeFromCart, toggleWishlist, isInWishlist } = useApp();
  const navigate = useNavigate();

  // Save for later local array state
  const [saveForLater, setSaveForLater] = useState<any[]>([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartOriginalTotal = cart.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const totalSavings = cartOriginalTotal - cartTotal;

  const handleMoveToSaveForLater = (item: any) => {
    setSaveForLater(prev => [...prev, item]);
    removeFromCart(item.product.id);
  };

  const handleMoveToCart = (item: any) => {
    updateCartQuantity(item.product.id, item.quantity);
    setSaveForLater(prev => prev.filter(i => i.product.id !== item.product.id));
  };

  const handleRemoveFromSaveForLater = (productId: string) => {
    setSaveForLater(prev => prev.filter(i => i.product.id !== productId));
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Cart', url: '/cart' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <SEO
        title="Shopping Cart | SethiElectronicsOnline"
        description="Review your shopping cart at SethiElectronicsOnline. Complete your purchase of authentic Bajaj, Philips, Havells home appliances safely."
        keywords="Sethi Electronics, shopping cart, buy home appliances, secure checkout"
        jsonLd={[
          getBreadcrumbSchema(breadcrumbs)
        ]}
      />
      <h1 className="font-sans font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight mb-8">
        Your Shopping Cart ({cart.length} Items)
      </h1>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="font-sans font-bold text-lg text-gray-800">Your Cart is Empty</h2>
          <p className="font-sans text-xs text-gray-500 mt-1 max-w-sm">
            Looks like you haven't added any premium electronics to your cart yet. Explore our latest appliances!
          </p>
          <Link
            to="/products"
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
              {cart.map((item) => {
                const isWishlisted = isInWishlist(item.product.id);
                return (
                  <div 
                    key={item.product.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img 
                        src={item.product.images?.[0] || null} 
                        alt={item.product.name} 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-gray-50 border border-gray-100 rounded-xl"
                      />
                      <div className="min-w-0">
                        <span className="font-sans font-extrabold text-xxs text-blue-600 uppercase tracking-widest">{item.product.brand}</span>
                        <Link to={`/product/${item.product.id}`} className="block font-sans font-semibold text-sm text-gray-800 hover:text-blue-600 transition-colors truncate">
                          {item.product.name}
                        </Link>
                        
                        {/* Prices */}
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="font-mono font-bold text-sm text-blue-600">{formatINR(item.product.price)}</span>
                          {item.product.originalPrice > item.product.price && (
                            <span className="font-mono text-xs text-gray-400 line-through">{formatINR(item.product.originalPrice)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions row */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                      <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg p-0.5 font-mono text-xs">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 font-bold"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 font-bold"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 text-xs font-sans text-gray-400">
                        <button 
                          onClick={() => handleMoveToSaveForLater(item)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          Save For Later
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="hover:text-red-600 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing breakdown Order Summary */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-sans font-extrabold text-base text-gray-800 border-b border-gray-50 pb-3">Price Details</h3>
              
              <div className="space-y-2.5 font-sans text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Price ({cart.length} Items)</span>
                  <span className="font-mono text-gray-800">{formatINR(cartOriginalTotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Savings</span>
                    <span className="font-mono">- {formatINR(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping charges</span>
                  <span className="text-emerald-600 font-medium uppercase text-xs">FREE</span>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4 flex justify-between items-baseline">
                <span className="font-sans font-bold text-sm text-gray-800">Estimated Total</span>
                <span className="font-mono font-extrabold text-xl text-blue-600">{formatINR(cartTotal)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="p-3 bg-emerald-50 text-emerald-700 font-sans text-xs font-semibold rounded-xl text-center border border-emerald-100">
                  Yay! You are saving {formatINR(totalSavings)} on this order!
                </div>
              )}

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xxs font-sans text-gray-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>UPI Direct Payment Verification - Trusted by Sethi Electronics</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Save For Later Section */}
      {saveForLater.length > 0 && (
        <div className="mt-12 bg-gray-50/50 border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-6">Saved For Later ({saveForLater.length} Items)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {saveForLater.map((item) => (
              <div key={item.product.id} className="flex flex-col min-[440px]:flex-row justify-between items-start min-[440px]:items-center gap-3.5 p-4 bg-white border border-gray-150/60 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3 w-full min-[440px]:w-auto">
                  <img 
                    src={item.product.images?.[0] || null} 
                    alt="" 
                    className="w-14 h-14 object-contain bg-gray-50 border border-gray-100 rounded-xl shrink-0 p-1" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-800 truncate" title={item.product.name}>{item.product.name}</h4>
                    <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">{formatINR(item.product.price)}</p>
                  </div>
                </div>

                <div className="flex gap-2 text-xs font-sans font-bold w-full min-[440px]:w-auto justify-end border-t min-[440px]:border-t-0 border-gray-100 pt-3 min-[440px]:pt-0">
                  <button 
                    onClick={() => handleMoveToCart(item)}
                    className="px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-center flex-1 min-[440px]:flex-initial transition-all active:scale-95"
                  >
                    Move to Cart
                  </button>
                  <button 
                    onClick={() => handleRemoveFromSaveForLater(item.product.id)}
                    className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-center flex-1 min-[440px]:flex-initial transition-all active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
