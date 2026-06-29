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
import { db, handleFirestoreError, OperationType, isPermissionError } from '../lib/firebase';
import { seedDatabase, SEED_CATEGORIES, SEED_PRODUCTS } from '../lib/dbSeed';
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
  quotaExceeded: boolean;
  quotaErrorMsg: string | null;
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

  const [catsLoaded, setCatsLoaded] = useState(false);
  const [prodsLoaded, setProdsLoaded] = useState(false);
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaErrorMsg, setQuotaErrorMsg] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState<string | null>(null);

  const checkAndSetQuotaError = (error: any) => {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Quota exceeded') || msg.includes('Quota limit exceeded') || msg.includes('quota') || msg.includes('Quota') || msg.includes('QUOTA') || msg.includes('QUOTA_EXCEEDED')) {
      setQuotaExceeded(true);
      setQuotaErrorMsg(msg);
      return true;
    }
    return false;
  };

  const checkAndSetPermissionError = (error: any) => {
    if (isPermissionError(error)) {
      setPermissionError(true);
      setPermissionErrorMsg(error instanceof Error ? error.message : String(error));
      return true;
    }
    return false;
  };

  // Initialize and seed database if empty
  useEffect(() => {
    const initDb = async () => {
      try {
        await seedDatabase();
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('QUOTA_EXCEEDED') || errMsg.includes('Quota') || errMsg.includes('quota') || errMsg.includes('QUOTA')) {
          setQuotaExceeded(true);
          setQuotaErrorMsg(errMsg);
          console.warn('Database seeding paused due to Firebase quota limits.');
        } else if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('permission') || errMsg.includes('Permission') || errMsg.includes('insufficient permissions')) {
          setPermissionError(true);
          setPermissionErrorMsg(errMsg);
          console.warn('Database seeding paused due to Firebase permission rules.');
        } else {
          console.error('Failed to run seed: ', err);
        }
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
      const sorted = list.sort((a, b) => a.displayOrder - b.displayOrder);
      setCategories(sorted);
      setCatsLoaded(true);
    }, (error) => {
      setCatsLoaded(true);
      if (checkAndSetQuotaError(error)) {
        console.warn('Categories listener paused due to quota limit.');
      } else if (checkAndSetPermissionError(error)) {
        console.warn('Categories listener paused due to permission limit.');
      } else {
        console.error('Error listening to categories: ', error);
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    });

    // Sync Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(list);
      setProdsLoaded(true);
    }, (error) => {
      setProdsLoaded(true);
      if (checkAndSetQuotaError(error)) {
        console.warn('Products listener paused due to quota limit.');
      } else if (checkAndSetPermissionError(error)) {
        console.warn('Products listener paused due to permission limit.');
      } else {
        console.error('Error listening to products: ', error);
        handleFirestoreError(error, OperationType.GET, 'products');
      }
    });

    // Sync Offers
    const unsubOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Offer);
      });
      setOffers(list);
      setOffersLoaded(true);
    }, (error) => {
      setOffersLoaded(true);
      if (checkAndSetQuotaError(error)) {
        console.warn('Offers listener paused due to quota limit.');
      } else if (checkAndSetPermissionError(error)) {
        console.warn('Offers listener paused due to permission limit.');
      } else {
        console.error('Error listening to offers: ', error);
        handleFirestoreError(error, OperationType.GET, 'offers');
      }
    });

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'website'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WebsiteSettings;
        setWebsiteSettings(data);
      }
      setSettingsLoaded(true);
    }, (error) => {
      setSettingsLoaded(true);
      if (checkAndSetQuotaError(error)) {
        console.warn('Website settings listener paused due to quota limit.');
      } else if (checkAndSetPermissionError(error)) {
        console.warn('Website settings listener paused due to permission limit.');
      } else {
        console.error('Error listening to settings: ', error);
        handleFirestoreError(error, OperationType.GET, 'settings/website');
      }
    });

    return () => {
      unsubCategories();
      unsubProducts();
      unsubOffers();
      unsubSettings();
    };
  }, []);

  // Track loader completion
  useEffect(() => {
    if (catsLoaded && prodsLoaded && offersLoaded && settingsLoaded) {
      setLoadingData(false);
    }
  }, [catsLoaded, prodsLoaded, offersLoaded, settingsLoaded]);

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
        } catch (err: any) {
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || errMsg.includes('QUOTA') || errMsg.includes('QUOTA_EXCEEDED')) {
            setQuotaExceeded(true);
            setQuotaErrorMsg(errMsg);
            console.warn('Auth state fetch paused due to Firebase quota limits. Defaulting to local guest/cached profile.');
          } else if (errMsg.includes('permission') || errMsg.includes('Permission') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('insufficient permissions')) {
            setPermissionError(true);
            setPermissionErrorMsg(errMsg);
            console.warn('Auth state fetch paused due to Firebase permission rules. Defaulting to local guest/cached profile.');
          } else {
            console.error('Error loading user profile: ', err);
          }
          
          // Try to load user profile from local users fallback if possible
          try {
            const localUsersStr = localStorage.getItem('sethi_local_users');
            if (localUsersStr) {
              const localUsers: UserProfile[] = JSON.parse(localUsersStr);
              const matched = localUsers.find(u => u.uid === savedUserId);
              if (matched) {
                setCurrentUser(matched);
                // @ts-ignore
                if (matched.cart) setCart(matched.cart);
                // @ts-ignore
                if (matched.wishlist) setWishlist(matched.wishlist);
              } else {
                setCurrentUser(null);
              }
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
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
        } catch (error: any) {
          const errMsg = error instanceof Error ? error.message : String(error);
          if (errMsg.includes('Quota') || errMsg.includes('quota') || errMsg.includes('QUOTA') || errMsg.includes('QUOTA_EXCEEDED')) {
            setQuotaExceeded(true);
            setQuotaErrorMsg(errMsg);
            console.warn('Failed to sync cart/wishlist to Firestore due to quota limits.');
          } else if (errMsg.includes('permission') || errMsg.includes('Permission') || errMsg.includes('PERMISSION') || errMsg.includes('insufficient permissions')) {
            setPermissionError(true);
            setPermissionErrorMsg(errMsg);
            console.warn('Failed to sync cart/wishlist to Firestore due to permission limits.');
          } else {
            console.error('Failed to sync cart/wishlist to Firestore:', error);
          }
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
        console.warn('Error logging in admin from Firestore, using local bypass: ', error);
        const adminProfile: UserProfile = {
          uid: 'admin_sethi_account',
          name: targetAdminName,
          mobile: targetAdminMobile,
          passwordHash: await hashPassword('AdminPass2026!'),
          addresses: [],
          isAdmin: true,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('sethi_session_userId', 'admin_sethi_account');
        setCurrentUser(adminProfile);
        return adminProfile;
      }
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobile', '==', mobile));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Fallback to local storage users
        const localUsersStr = localStorage.getItem('sethi_local_users');
        if (localUsersStr) {
          const localUsers: UserProfile[] = JSON.parse(localUsersStr);
          const matched = localUsers.find(u => u.mobile === mobile);
          if (matched) {
            const inputHash = await hashPassword(password);
            if (matched.passwordHash === inputHash) {
              localStorage.setItem('sethi_session_userId', matched.uid);
              setCurrentUser(matched);
              // @ts-ignore
              if (matched.cart) setCart(matched.cart);
              // @ts-ignore
              if (matched.wishlist) setWishlist(matched.wishlist);
              return matched;
            }
          }
        }
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

      // Save to local storage users registry as well for offline fallback
      try {
        const localUsersStr = localStorage.getItem('sethi_local_users');
        const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
        if (!localUsers.some(u => u.uid === userProfile.uid)) {
          localUsers.push(userProfile);
          localStorage.setItem('sethi_local_users', JSON.stringify(localUsers));
        }
      } catch {}

      // Load cart and wishlist from profile
      // @ts-ignore
      if (userProfile.cart) setCart(userProfile.cart);
      // @ts-ignore
      if (userProfile.wishlist) setWishlist(userProfile.wishlist);

      return userProfile;
    } catch (error: any) {
      console.warn('Login Firestore failed, trying local fallback:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const isDbErr = errMsg.includes('permission') || errMsg.includes('Permission') || errMsg.includes('quota') || errMsg.includes('Quota') || errMsg.includes('insufficient permissions');
      
      if (isDbErr) {
        const localUsersStr = localStorage.getItem('sethi_local_users');
        if (localUsersStr) {
          const localUsers: UserProfile[] = JSON.parse(localUsersStr);
          const matched = localUsers.find(u => u.mobile === mobile);
          if (matched) {
            const inputHash = await hashPassword(password);
            if (matched.passwordHash === inputHash) {
              localStorage.setItem('sethi_session_userId', matched.uid);
              setCurrentUser(matched);
              // @ts-ignore
              if (matched.cart) setCart(matched.cart);
              // @ts-ignore
              if (matched.wishlist) setWishlist(matched.wishlist);
              return matched;
            }
          }
        }
      }
      throw error;
    }
  };

  const register = async (name: string, mobile: string, password: string): Promise<UserProfile> => {
    // Generate UID and Hash password first
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

    try {
      // 1. Prevent duplicates by checking mobile collection in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobile', '==', mobile));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('This mobile number is already registered.');
      }

      // 3. Save to Firestore
      await setDoc(doc(db, 'users', uid), profile);
    } catch (err: any) {
      console.warn('Registration Firestore failed, performing local registration:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isDbErr = errMsg.includes('permission') || errMsg.includes('Permission') || errMsg.includes('quota') || errMsg.includes('Quota') || errMsg.includes('insufficient permissions');
      
      if (isDbErr) {
        // Prevent duplicate check locally
        const localUsersStr = localStorage.getItem('sethi_local_users');
        const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
        if (localUsers.some(u => u.mobile === mobile)) {
          throw new Error('This mobile number is already registered.');
        }
      } else {
        throw err;
      }
    }

    // Always register locally too as a fallback cache
    try {
      const localUsersStr = localStorage.getItem('sethi_local_users');
      const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      if (!localUsers.some(u => u.uid === profile.uid)) {
        localUsers.push(profile);
        localStorage.setItem('sethi_local_users', JSON.stringify(localUsers));
      }
    } catch {}

    localStorage.setItem('sethi_session_userId', uid);
    setCurrentUser(profile);
    return profile;
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
    } catch (err: any) {
      console.warn('Failed to update profile to Firestore, saving locally:', err);
    }
    
    // Always update locally
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    try {
      const localUsersStr = localStorage.getItem('sethi_local_users');
      const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      const index = localUsers.findIndex(u => u.uid === currentUser.uid);
      if (index !== -1) {
        localUsers[index] = { ...localUsers[index], ...updates };
        localStorage.setItem('sethi_local_users', JSON.stringify(localUsers));
      } else {
        localUsers.push(updatedUser);
        localStorage.setItem('sethi_local_users', JSON.stringify(localUsers));
      }
    } catch {}
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
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'website'));
      if (docSnap.exists()) {
        setWebsiteSettings(docSnap.data() as WebsiteSettings);
      }
    } catch (err) {
      console.warn('Manual settings refresh paused due to database permission or quota limits:', err);
    }
  };

  const refreshProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list: Product[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
    } catch (err) {
      console.warn('Manual products refresh paused due to database permission or quota limits:', err);
    }
  };

  const refreshCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list: Category[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Category));
      setCategories(list.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      console.warn('Manual categories refresh paused due to database permission or quota limits:', err);
    }
  };

  const refreshOffers = async () => {
    try {
      const snap = await getDocs(collection(db, 'offers'));
      const list: Offer[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Offer));
      setOffers(list);
    } catch (err) {
      console.warn('Manual offers refresh paused due to database permission or quota limits:', err);
    }
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
      quotaExceeded,
      quotaErrorMsg,
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
