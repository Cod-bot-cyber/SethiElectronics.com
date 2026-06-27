import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { seedDatabase } from '../lib/dbSeed';
import { hashPassword } from '../lib/utils';
import { Product, Category, CartItem, UserProfile, Address, WebsiteSettings, Offer, Order, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: UserProfile | null;
  loadingAuth: boolean;
  categories: Category[];
  products: Product[];
  offers: Offer[];
  websiteSettings: WebsiteSettings | null;
  cart: CartItem[];
  wishlist: string[]; // array of product IDs
  loadingData: boolean;
  login: (mobile: string, password: string) => Promise<UserProfile>;
  register: (name: string, mobile: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  editAddress: (id: string, address: Omit<Address, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  refreshSettings: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Initialize and seed database if empty
  useEffect(() => {
    const initDb = async () => {
      try {
        await seedDatabase();
      } catch (err) {
        console.error('Failed to run seed: ', err);
      } finally {
        setLoadingData(false);
      }
    };
    initDb();
  }, []);

  // Sync Categories, Products, Offers, and Settings
  useEffect(() => {
    // Sync Categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Category);
      });
      // Sort by display order
      setCategories(list.sort((a, b) => a.displayOrder - b.displayOrder));
    }, (error) => {
      console.error('Error listening to categories: ', error);
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    // Sync Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(list);
    }, (error) => {
      console.error('Error listening to products: ', error);
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Sync Offers
    const unsubOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Offer);
      });
      setOffers(list);
    }, (error) => {
      console.error('Error listening to offers: ', error);
      handleFirestoreError(error, OperationType.GET, 'offers');
    });

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'website'), (docSnap) => {
      if (docSnap.exists()) {
        setWebsiteSettings(docSnap.data() as WebsiteSettings);
      }
    }, (error) => {
      console.error('Error listening to settings: ', error);
      handleFirestoreError(error, OperationType.GET, 'settings/website');
    });

    return () => {
      unsubCategories();
      unsubProducts();
      unsubOffers();
      unsubSettings();
    };
  }, []);

  // Listen to Auth State (using localStorage-backed custom authentication)
  useEffect(() => {
    const checkAuth = async () => {
      setLoadingAuth(true);
      const savedUserId = localStorage.getItem('sethi_session_userId');
      if (savedUserId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', savedUserId));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setCurrentUser(profile);
            
            // Load persistent cart and wishlist from profile
            // @ts-ignore
            if (profile.cart) {
              // @ts-ignore
              setCart(profile.cart);
            }
            // @ts-ignore
            if (profile.wishlist) {
              // @ts-ignore
              setWishlist(profile.wishlist);
            }
          } else {
            localStorage.removeItem('sethi_session_userId');
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error loading user profile: ', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setCart([]);
        setWishlist([]);
      }
      setLoadingAuth(false);
    };

    checkAuth();
  }, []);

  // Save Cart and Wishlist to Firestore whenever they change
  useEffect(() => {
    if (currentUser && !loadingAuth) {
      const syncUserData = async () => {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            cart,
            wishlist
          });
        } catch (error) {
          console.error('Failed to sync cart/wishlist to Firestore:', error);
        }
      };
      
      const timeoutId = setTimeout(syncUserData, 1000); // Debounce to save writes
      return () => clearTimeout(timeoutId);
    }
  }, [cart, wishlist, currentUser, loadingAuth]);

  // Keep Admin session dynamically synchronized when websiteSettings changes
  useEffect(() => {
    if (currentUser && currentUser.uid === 'admin_sethi_account' && websiteSettings) {
      const targetAdminMobile = websiteSettings.adminMobile || '7060784706';
      const targetAdminName = websiteSettings.adminName || 'Admin';
      if (currentUser.name !== targetAdminName || currentUser.mobile !== targetAdminMobile) {
        setCurrentUser(prev => prev ? {
          ...prev,
          name: targetAdminName,
          mobile: targetAdminMobile
        } : null);
      }
    }
  }, [websiteSettings, currentUser]);

  // Actions
  const login = async (mobile: string, password: string): Promise<UserProfile> => {
    // Check for special admin bootstrap
    const targetAdminMobile = websiteSettings?.adminMobile || '7060784706';
    const targetAdminName = websiteSettings?.adminName || 'Admin';
    if (mobile === targetAdminMobile && password === 'AdminPass2026!') {
      try {
        const adminDoc = await getDoc(doc(db, 'users', 'admin_sethi_account'));
        if (adminDoc.exists()) {
          const profile = adminDoc.data() as UserProfile;
          // Sync with the latest settings
          profile.mobile = targetAdminMobile;
          profile.name = targetAdminName;
          await setDoc(doc(db, 'users', 'admin_sethi_account'), profile);
          
          localStorage.setItem('sethi_session_userId', 'admin_sethi_account');
          setCurrentUser(profile);
          return profile;
        } else {
          const adminProfile: UserProfile = {
            uid: 'admin_sethi_account',
            name: targetAdminName,
            mobile: targetAdminMobile,
            passwordHash: await hashPassword('AdminPass2026!'),
            addresses: [],
            isAdmin: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', 'admin_sethi_account'), adminProfile);
          localStorage.setItem('sethi_session_userId', 'admin_sethi_account');
          setCurrentUser(adminProfile);
          return adminProfile;
        }
      } catch (error: any) {
        console.error('Error logging in admin: ', error);
        throw error;
      }
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobile', '==', mobile));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid mobile number or password.');
      }

      let matchedUser: UserProfile | null = null;
      const inputHash = await hashPassword(password);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        if (data.passwordHash === inputHash) {
          matchedUser = { ...data, uid: docSnap.id };
        }
      });

      if (!matchedUser) {
        throw new Error('Invalid mobile number or password.');
      }

      const userProfile: UserProfile = matchedUser;
      localStorage.setItem('sethi_session_userId', userProfile.uid);
      setCurrentUser(userProfile);

      // Load cart and wishlist from profile
      // @ts-ignore
      if (userProfile.cart) setCart(userProfile.cart);
      // @ts-ignore
      if (userProfile.wishlist) setWishlist(userProfile.wishlist);

      return userProfile;
    } catch (error: any) {
      console.error('Login error: ', error);
      throw error;
    }
  };

  const register = async (name: string, mobile: string, password: string): Promise<UserProfile> => {
    // 1. Prevent duplicates by checking mobile collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('mobile', '==', mobile));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('This mobile number is already registered.');
    }

    // 2. Hash password and generate UID
    const passwordHash = await hashPassword(password);
    const uid = crypto.randomUUID();

    const profile: UserProfile = {
      uid,
      name,
      mobile,
      passwordHash,
      addresses: [],
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    // 3. Save to Firestore
    try {
      await setDoc(doc(db, 'users', uid), profile);
      localStorage.setItem('sethi_session_userId', uid);
      setCurrentUser(profile);
      return profile;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('sethi_session_userId');
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Not logged in');
    const docRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(docRef, updates);
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Address Management
  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!currentUser) throw new Error('Not logged in');
    const newAddress: Address = {
      ...address,
      id: crypto.randomUUID(),
      isDefault: currentUser.addresses.length === 0 ? true : address.isDefault
    };

    let updatedAddresses = [...currentUser.addresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    }
    updatedAddresses.push(newAddress);

    await updateProfile({ addresses: updatedAddresses });
  };

  const editAddress = async (id: string, updatedAddress: Omit<Address, 'id'>) => {
    if (!currentUser) throw new Error('Not logged in');
    let updatedAddresses = currentUser.addresses.map(addr => {
      if (addr.id === id) {
        return { ...addr, ...updatedAddress, id };
      }
      if (updatedAddress.isDefault && addr.id !== id) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    await updateProfile({ addresses: updatedAddresses });
  };

  const deleteAddress = async (id: string) => {
    if (!currentUser) throw new Error('Not logged in');
    const addressToDelete = currentUser.addresses.find(addr => addr.id === id);
    let updatedAddresses = currentUser.addresses.filter(addr => addr.id !== id);
    
    // If we deleted the default address, make another one default
    if (addressToDelete?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    await updateProfile({ addresses: updatedAddresses });
  };

  // Cart Management
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const newCart = [...prev];
        const newQty = newCart[existingIndex].quantity + quantity;
        newCart[existingIndex].quantity = Math.min(newQty, product.stock);
        return newCart;
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.min(Math.max(1, quantity), item.product.stock) };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist Management
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Manual refreshes if needed
  const refreshSettings = async () => {
    const docSnap = await getDoc(doc(db, 'settings', 'website'));
    if (docSnap.exists()) {
      setWebsiteSettings(docSnap.data() as WebsiteSettings);
    }
  };

  const refreshProducts = async () => {
    const snap = await getDocs(collection(db, 'products'));
    const list: Product[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Product));
    setProducts(list);
  };

  const refreshCategories = async () => {
    const snap = await getDocs(collection(db, 'categories'));
    const list: Category[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Category));
    setCategories(list.sort((a, b) => a.displayOrder - b.displayOrder));
  };

  const refreshOffers = async () => {
    const snap = await getDocs(collection(db, 'offers'));
    const list: Offer[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Offer));
    setOffers(list);
  };

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const refreshData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        refreshSettings(),
        refreshProducts(),
        refreshCategories(),
        refreshOffers()
      ]);
    } catch (err) {
      console.error('Error refreshing all data: ', err);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      loadingAuth,
      categories,
      products,
      offers,
      websiteSettings,
      cart,
      wishlist,
      loadingData,
      login,
      register,
      logout,
      updateProfile,
      addAddress,
      editAddress,
      deleteAddress,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      refreshSettings,
      refreshProducts,
      refreshCategories,
      refreshOffers,
      refreshData,
      showToast
    }}>
      {children}
      
      {/* Elegantly animated custom Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100%-3rem)] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-sans font-bold ${
                t.type === 'success'
                  ? 'bg-emerald-500/95 backdrop-blur-md text-white border-emerald-400/20'
                  : t.type === 'error'
                  ? 'bg-rose-500/95 backdrop-blur-md text-white border-rose-400/20'
                  : 'bg-blue-600/95 backdrop-blur-md text-white border-blue-500/20'
              }`}
            >
              <span>{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                className="opacity-75 hover:opacity-100 font-extrabold text-sm ml-2 select-none h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
};
