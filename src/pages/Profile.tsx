import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Heart, ShoppingBag, LogOut, ChevronRight, 
  Trash2, Plus, Edit2, CheckCircle2, Circle, Clock, Info 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { formatINR, formatDate } from '../lib/utils';

type ActiveTab = 'profile' | 'orders' | 'addresses' | 'wishlist';

export default function Profile() {
  const { 
    currentUser, loadingAuth, login, register, logout, 
    products, wishlist, toggleWishlist, addToCart,
    addAddress, editAddress, deleteAddress, showToast
  } = useApp();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Auth Forms State
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({ mobile: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', mobile: '', password: '' });

  // Address Modal States
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    mobileNumber: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
  });

  // User Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Parse search tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'orders', 'addresses', 'wishlist'].includes(tabParam)) {
      setActiveTab(tabParam as ActiveTab);
    }
  }, [searchParams]);

  // Load user orders once authenticated
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // Sort by date descending
        setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error('Failed to load orders: ', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  if (loadingAuth) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  // --- AUTH SUBMISSIONS ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginForm.mobile.trim() || !loginForm.password.trim()) {
      setAuthError('All fields are required.');
      return;
    }
    setAuthLoading(true);
    try {
      await login(loginForm.mobile, loginForm.password);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!registerForm.name.trim() || !registerForm.mobile.trim() || !registerForm.password.trim()) {
      setAuthError('All fields are required.');
      return;
    }
    if (!/^\d{10}$/.test(registerForm.mobile.trim())) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthLoading(true);
    try {
      await register(registerForm.name, registerForm.mobile, registerForm.password);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // --- ADDRESS FORM HANDLERS ---
  const handleOpenAddressModal = (addrId: string | null = null) => {
    if (addrId && currentUser) {
      const addr = currentUser.addresses.find(a => a.id === addrId);
      if (addr) {
        setAddressForm({
          fullName: addr.fullName,
          mobileNumber: addr.mobileNumber,
          houseNumber: addr.houseNumber,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landmark: addr.landmark || '',
          isDefault: addr.isDefault || false
        });
        setEditingAddressId(addrId);
      }
    } else {
      setAddressForm({
        fullName: currentUser?.name || '',
        mobileNumber: currentUser?.mobile || '',
        houseNumber: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
      });
      setEditingAddressId(null);
    }
    setShowAddressModal(true);
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName.trim() || !addressForm.mobileNumber.trim() || !addressForm.houseNumber.trim() || !addressForm.pincode.trim()) {
      showToast('Incomplete address details. Name, mobile, house number and pin code are mandatory.', 'error');
      return;
    }

    try {
      if (editingAddressId) {
        await editAddress(editingAddressId, addressForm);
      } else {
        await addAddress(addressForm);
      }
      setShowAddressModal(false);
    } catch (err) {
      console.error('Failed to save address: ', err);
    }
  };

  // If NOT LOGGED IN, show Auth Gate
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-gray-800 tracking-tight">
              {isRegistering ? 'Create User Profile' : 'Access Your Profile'}
            </h2>
            <p className="font-sans text-xs text-gray-400 mt-1">
              Sethi Electronics direct login. No emails, no OTPs. Simple.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 font-sans text-xs rounded-xl mb-4 text-center">
              {authError}
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hardik Sethi"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={registerForm.mobile}
                  onChange={(e) => setRegisterForm({ ...registerForm, mobile: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Create Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {authLoading ? 'Creating Profile...' : 'Sign Up'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={loginForm.mobile}
                  onChange={(e) => setLoginForm({ ...loginForm, mobile: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {authLoading ? 'Logging In...' : 'Login'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-gray-50 pt-5 text-xs font-sans text-gray-400">
            {isRegistering ? (
              <p>Already have a profile? <button onClick={() => setIsRegistering(false)} className="text-blue-600 font-bold hover:underline">Log In</button></p>
            ) : (
              <p>New customer? <button onClick={() => setIsRegistering(true)} className="text-blue-600 font-bold hover:underline">Register Now</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER LOGGED IN CUSTOMER DASHBOARD ---
  // Wishlisted Products matching wishlist IDs
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100 mb-6">
            <div className="h-11 w-11 bg-blue-600 text-white rounded-full flex items-center justify-center font-sans font-bold text-lg">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans font-bold text-sm text-gray-800 truncate">{currentUser.name}</h3>
              <p className="font-mono text-xxs text-gray-400 mt-0.5">{currentUser.mobile}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('profile'); setSearchParams({ tab: 'profile' }); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-sans text-sm font-semibold transition-colors text-left ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <User className="h-4.5 w-4.5" />
                <span>Personal Info</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setActiveTab('orders'); setSearchParams({ tab: 'orders' }); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-sans text-sm font-semibold transition-colors text-left ${
                activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>My Orders</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setActiveTab('addresses'); setSearchParams({ tab: 'addresses' }); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-sans text-sm font-semibold transition-colors text-left ${
                activeTab === 'addresses' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5" />
                <span>Saved Addresses</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setActiveTab('wishlist'); setSearchParams({ tab: 'wishlist' }); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl font-sans text-sm font-semibold transition-colors text-left ${
                activeTab === 'wishlist' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Heart className="h-4.5 w-4.5" />
                <span>Wishlist</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 p-3 text-red-600 hover:bg-red-50/50 rounded-xl font-sans text-sm font-semibold transition-colors text-left mt-4"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Dashboard Panels Area */}
        <main className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm h-fit">
          
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Personal Profile Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm font-sans">
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Full Name</div>
                  <div className="font-semibold text-gray-800 mt-1 bg-gray-50 p-3 border border-gray-50 rounded-xl">{currentUser.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Registered Mobile Number</div>
                  <div className="font-mono text-gray-800 mt-1 bg-gray-50 p-3 border border-gray-50 rounded-xl">{currentUser.mobile}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase font-bold">Date Registered</div>
                  <div className="font-semibold text-gray-800 mt-1 bg-gray-50 p-3 border border-gray-50 rounded-xl">{formatDate(currentUser.createdAt)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS WITH STATUS TIMELINES */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Order History & Timelines</h2>
              
              {loadingOrders ? (
                <div className="space-y-4">
                  <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                  <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                </div>
              ) : orders.length === 0 ? (
                <p className="font-sans text-sm text-gray-400">You haven't submitted any orders yet.</p>
              ) : (
                <div className="space-y-5">
                  {orders.map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    const getStatusColor = (status: string) => {
                      if (status === 'pending_verification') return 'text-amber-500 bg-amber-50';
                      if (status === 'confirmed' || status === 'payment_verified' || status === 'delivered') return 'text-emerald-500 bg-emerald-50';
                      if (status === 'cancelled' || status === 'rejected') return 'text-red-500 bg-red-50';
                      return 'text-blue-500 bg-blue-50'; // shipped, packed
                    };

                    return (
                      <div key={ord.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                        {/* Summary Header */}
                        <div 
                          onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 sm:p-5 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        >
                          <div className="font-sans text-sm">
                            <span className="font-mono font-bold text-blue-600 block sm:inline mr-2">{ord.orderNumber}</span>
                            <span className="text-gray-400 block sm:inline sm:before:content-['•'] sm:before:mr-2">{formatDate(ord.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-sm text-gray-800">{formatINR(ord.amount)}</span>
                            <span className={`px-3 py-1 font-sans text-xxs font-extrabold uppercase tracking-wider rounded-full ${getStatusColor(ord.status)}`}>
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Expanded details timeline */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 border-t border-gray-50 bg-gray-50/20 space-y-6">
                            
                            {/* Order items lists */}
                            <div className="space-y-3 border-b border-gray-50 pb-5">
                              <h4 className="font-sans font-bold text-xs text-gray-500 uppercase">Items Ordered</h4>
                              {ord.items.map((it: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-sm font-sans">
                                  <img src={it.image || null} alt="" className="h-10 w-10 object-contain bg-white border border-gray-100 rounded-lg p-1 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{it.name}</p>
                                    <p className="font-mono text-xs text-gray-400">Qty: {it.quantity} • {formatINR(it.price)} each</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Tracking Timeline */}
                            <div className="space-y-4">
                              <h4 className="font-sans font-bold text-xs text-gray-500 uppercase">Tracking Timeline</h4>
                              
                              <div className="relative pl-6 space-y-4 border-l border-gray-200">
                                {ord.statusTimeline && ord.statusTimeline.map((timeEvent: any, idx: number) => (
                                  <div key={idx} className="relative">
                                    {/* Timeline Dot */}
                                    <span className="absolute -left-8.5 top-1.5 h-5 w-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                                      <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                    </span>
                                    <div className="font-sans text-xs">
                                      <div className="font-bold text-gray-800">{timeEvent.status}</div>
                                      <div className="text-gray-400 font-mono text-[10px] mt-0.5">{formatDate(timeEvent.time)}</div>
                                      {timeEvent.note && <div className="text-gray-500 bg-white border border-gray-100 rounded-xl p-2.5 mt-1.5 text-xxs leading-relaxed max-w-lg shadow-xs">{timeEvent.note}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h2 className="font-sans font-extrabold text-lg text-gray-800">Saved Addresses</h2>
                <button
                  onClick={() => handleOpenAddressModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 font-sans font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Address</span>
                </button>
              </div>

              {currentUser.addresses.length === 0 ? (
                <p className="font-sans text-sm text-gray-400">You haven't saved any addresses yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentUser.addresses.map((addr) => (
                    <div key={addr.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-100 shadow-sm bg-white relative">
                      <div className="space-y-1.5 text-sm font-sans text-gray-600">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-gray-800 font-bold">{addr.fullName}</strong>
                          {addr.isDefault && <span className="font-sans font-bold text-xxs uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        <p className="text-xs font-mono">{addr.mobileNumber}</p>
                        <p className="text-xs leading-relaxed">{addr.houseNumber}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>

                      <div className="border-t border-gray-50 pt-3 mt-4 flex justify-end gap-3 font-sans text-xs font-bold text-gray-400">
                        <button onClick={() => handleOpenAddressModal(addr.id)} className="hover:text-blue-600 flex items-center gap-1.5">
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => deleteAddress(addr.id)} className="hover:text-red-500 flex items-center gap-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">My Saved Wishlist</h2>
              {wishlistedProducts.length === 0 ? (
                <p className="font-sans text-sm text-gray-400">Your wishlist is empty.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedProducts.map((prod) => (
                    <div key={prod.id} className="flex flex-col min-[440px]:flex-row justify-between items-start min-[440px]:items-center gap-3.5 p-4 bg-white border border-gray-150/60 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-3 w-full min-[440px]:w-auto">
                        <img 
                          src={prod.images?.[0] || null} 
                          alt="" 
                          className="w-14 h-14 object-contain bg-gray-50 border border-gray-100 rounded-xl shrink-0 p-1" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-sans font-bold text-xs sm:text-sm text-gray-800 truncate" title={prod.name}>{prod.name}</h4>
                          <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">{formatINR(prod.price)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs font-sans font-bold w-full min-[440px]:w-auto justify-end border-t min-[440px]:border-t-0 border-gray-100 pt-3 min-[440px]:pt-0">
                        <button 
                          onClick={() => {
                            addToCart(prod, 1);
                            toggleWishlist(prod.id);
                          }}
                          className="px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-center flex-1 min-[440px]:flex-initial transition-all active:scale-95"
                        >
                          Move to Cart
                        </button>
                        <button 
                          onClick={() => toggleWishlist(prod.id)}
                          className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-center flex-1 min-[440px]:flex-initial transition-all active:scale-95"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Save / Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-2xl max-w-md w-full relative">
            <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-6">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
            
            <form onSubmit={handleAddressSave} className="space-y-4">
              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Contact Number</label>
                <input
                  type="tel"
                  required
                  value={addressForm.mobileNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">House / Flat</label>
                  <input
                    type="text"
                    required
                    value={addressForm.houseNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Street / Locality</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Pincode (6-Digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-bold text-gray-500 uppercase mb-1.5">Landmark</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="font-sans text-xs text-gray-500 font-bold">Set as Default Address</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 font-sans font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 active:scale-95"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
