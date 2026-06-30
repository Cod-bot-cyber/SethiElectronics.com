import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Users, ShoppingBag, FolderHeart, Star, 
  BarChart3, Plus, Edit, Copy, Trash2, CheckCircle2, 
  XCircle, ArrowUpDown, Eye, Image as ImageIcon, MessageCircle, QrCode,
  Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, doc, getDocs, addDoc, updateDoc, 
  deleteDoc, query, where 
} from 'firebase/firestore';
import { formatINR, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type AdminTab = 'metrics' | 'products' | 'categories' | 'orders' | 'customers' | 'reviews' | 'settings' | 'queries';

export default function Admin() {
  const { currentUser, products, categories, websiteSettings, refreshData, showToast } = useApp();
  const navigate = useNavigate();

  // Guard access
  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
          <XCircle className="h-10 w-10" />
        </div>
        <h2 className="font-sans font-extrabold text-xl text-gray-800">Access Denied</h2>
        <p className="font-sans text-xs text-gray-500">
          You must be logged in as an administrator to view the control panel dashboard.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md"
        >
          Go to Auth Gate
        </button>
      </div>
    );
  }

  // --- ADMIN STATE ---
  const [activeTab, setActiveTab] = useState<AdminTab>('metrics');
  const [deleteConfirmProductId, setDeleteConfirmProductId] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [allQueries, setAllQueries] = useState<any[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState<boolean>(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Modals / Editors state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // --- PRODUCT FORM STATE ---
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    price: 0,
    originalPrice: 0,
    discount: 0,
    stock: 0,
    description: '',
    category: '',
    features: '',
    specifications: '',
    warranty: '',
    imageUrl: '',
    additionalImages: [] as string[],
    isFeatured: false,
    isBestSeller: false,
    isTrending: false
  });

  // --- CATEGORY FORM STATE ---
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image: '',
    enabled: true
  });

  // --- WEBSITE SETTINGS FORM ---
  const [settingsForm, setSettingsForm] = useState({
    name: websiteSettings?.name || '',
    logo: websiteSettings?.logo || '',
    upiId: websiteSettings?.upiId || '',
    upiName: websiteSettings?.upiName || '',
    upiQrCode: websiteSettings?.upiQrCode || '',
    promoCards: websiteSettings?.promoCards || [] as any[],
    transactionNote: websiteSettings?.transactionNote || '',
    homepageBanners: websiteSettings?.homepageBanners?.join('\n') || '',
    storeAddress: websiteSettings?.storeAddress || '',
    storeTimings: websiteSettings?.storeTimings || '',
    salesCallNumber: websiteSettings?.contactNumbers?.[0] || '',
    whatsappNumber: websiteSettings?.contactNumbers?.[1] || '',
    popularBrands: websiteSettings?.popularBrands?.join(', ') || '',
    socialFacebook: websiteSettings?.socialLinks?.facebook || '',
    socialInstagram: websiteSettings?.socialLinks?.instagram || '',
    socialYoutube: websiteSettings?.socialLinks?.youtube || '',
    socialTwitter: websiteSettings?.socialLinks?.twitter || '',
    highlightCard1Title: websiteSettings?.highlightCards?.[0]?.title || '',
    highlightCard1Desc: websiteSettings?.highlightCards?.[0]?.description || '',
    highlightCard1Icon: websiteSettings?.highlightCards?.[0]?.iconType || 'truck',
    highlightCard2Title: websiteSettings?.highlightCards?.[1]?.title || '',
    highlightCard2Desc: websiteSettings?.highlightCards?.[1]?.description || '',
    highlightCard2Icon: websiteSettings?.highlightCards?.[1]?.iconType || 'shield',
    highlightCard3Title: websiteSettings?.highlightCards?.[2]?.title || '',
    highlightCard3Desc: websiteSettings?.highlightCards?.[2]?.description || '',
    highlightCard3Icon: websiteSettings?.highlightCards?.[2]?.iconType || 'award',
    adminMobile: websiteSettings?.adminMobile || '7060784706',
    adminName: websiteSettings?.adminName || 'Admin'
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);

  // Sync settings when loaded
  useEffect(() => {
    if (websiteSettings) {
      setSettingsForm({
        name: websiteSettings.name || '',
        logo: websiteSettings.logo || '',
        upiId: websiteSettings.upiId || '',
        upiName: websiteSettings.upiName || '',
        upiQrCode: websiteSettings.upiQrCode || '',
        promoCards: websiteSettings.promoCards || [] as any[],
        transactionNote: websiteSettings.transactionNote || '',
        homepageBanners: websiteSettings.homepageBanners?.join('\n') || '',
        storeAddress: websiteSettings.storeAddress || '',
        storeTimings: websiteSettings.storeTimings || '',
        salesCallNumber: websiteSettings.contactNumbers?.[0] || '',
        whatsappNumber: websiteSettings.contactNumbers?.[1] || '',
        popularBrands: websiteSettings.popularBrands?.join(', ') || '',
        socialFacebook: websiteSettings.socialLinks?.facebook || '',
        socialInstagram: websiteSettings.socialLinks?.instagram || '',
        socialYoutube: websiteSettings.socialLinks?.youtube || '',
        socialTwitter: websiteSettings.socialLinks?.twitter || '',
        highlightCard1Title: websiteSettings.highlightCards?.[0]?.title || '',
        highlightCard1Desc: websiteSettings.highlightCards?.[0]?.description || '',
        highlightCard1Icon: websiteSettings.highlightCards?.[0]?.iconType || 'truck',
        highlightCard2Title: websiteSettings.highlightCards?.[1]?.title || '',
        highlightCard2Desc: websiteSettings.highlightCards?.[1]?.description || '',
        highlightCard2Icon: websiteSettings.highlightCards?.[1]?.iconType || 'shield',
        highlightCard3Title: websiteSettings.highlightCards?.[2]?.title || '',
        highlightCard3Desc: websiteSettings.highlightCards?.[2]?.description || '',
        highlightCard3Icon: websiteSettings.highlightCards?.[2]?.iconType || 'award',
        adminMobile: websiteSettings.adminMobile || '7060784706',
        adminName: websiteSettings.adminName || 'Admin'
      });
    }
  }, [websiteSettings]);

  // --- FETCH MASTER LISTS ---
  const fetchAdminData = async () => {
    setLoadingAdminData(true);
    try {
      // 1. Fetch Orders
      const orderSnap = await getDocs(collection(db, 'orders'));
      const ordersList: any[] = [];
      orderSnap.forEach(d => ordersList.push({ id: d.id, ...d.data() }));
      setAllOrders(ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      // 2. Fetch Customers
      const custSnap = await getDocs(collection(db, 'users'));
      const custList: any[] = [];
      custSnap.forEach(d => {
        const u = d.data();
        if (!u.isAdmin) custList.push({ id: d.id, ...u });
      });
      setAllCustomers(custList);

      // 3. Fetch Reviews
      const revSnap = await getDocs(collection(db, 'reviews'));
      const revList: any[] = [];
      revSnap.forEach(d => revList.push({ id: d.id, ...d.data() }));
      setAllReviews(revList);

      // 4. Fetch Contact Queries
      const querySnap = await getDocs(collection(db, 'queries'));
      const queryList: any[] = [];
      querySnap.forEach(d => queryList.push({ id: d.id, ...d.data() }));
      setAllQueries(queryList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    } catch (err) {
      console.error('Failed to load admin logs: ', err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- DYNAMIC CALCULATIONS ---
  const totalSales = allOrders
    .filter(o => o.status === 'delivered' || o.status === 'confirmed' || o.status === 'payment_verified')
    .reduce((sum, o) => sum + o.amount, 0);

  const pendingVerificationOrders = allOrders.filter(o => o.status === 'pending_verification');

  // --- PRODUCT CRUD OPERATIONS ---
  const handleOpenProductModal = (prod: any | null = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        brand: prod.brand,
        price: prod.price,
        originalPrice: prod.originalPrice,
        discount: prod.discount,
        stock: prod.stock,
        description: prod.description,
        category: prod.category,
        features: prod.features.join('\n'),
        specifications: Object.entries(prod.specifications).map(([k, v]) => `${k}:${v}`).join('\n'),
        warranty: prod.warranty,
        imageUrl: prod.images?.[0] || '',
        additionalImages: prod.images && prod.images.length > 1 ? prod.images.slice(1) : [],
        isFeatured: prod.isFeatured || false,
        isBestSeller: prod.isBestSeller || false,
        isTrending: prod.isTrending || false
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        brand: '',
        price: 0,
        originalPrice: 0,
        discount: 0,
        stock: 5,
        description: '',
        category: categories[0]?.id || '',
        features: 'Multi-directional air throw\nSilent heavy copper motor\nCastor wheels',
        specifications: 'Power Consumption: 150W\nAir Delivery: 3200 m3/hr\nWater Tank: 50 Liters',
        warranty: '1 Year Manufacturer Brand Warranty',
        imageUrl: '',
        additionalImages: [],
        isFeatured: false,
        isBestSeller: false,
        isTrending: false
      });
    }
    setShowProductModal(true);
  };

  const handleProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse specs and features
    const featuresArr = productForm.features.split('\n').filter(f => f.trim() !== '');
    const specsObj: any = {};
    productForm.specifications.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        specsObj[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });

    const finalImages = [
      productForm.imageUrl,
      ...(productForm.additionalImages || [])
    ].map(u => u.trim()).filter(Boolean);

    const parsedProduct = {
      name: productForm.name,
      brand: productForm.brand,
      price: Number(productForm.price),
      originalPrice: Number(productForm.originalPrice),
      discount: Number(productForm.discount),
      stock: Number(productForm.stock),
      description: productForm.description,
      category: productForm.category,
      features: featuresArr,
      specifications: specsObj,
      warranty: productForm.warranty,
      images: finalImages,
      isFeatured: productForm.isFeatured,
      isBestSeller: productForm.isBestSeller,
      isTrending: productForm.isTrending,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        // Edit
        await updateDoc(doc(db, 'products', editingProduct.id), parsedProduct);
      } else {
        // Add new
        const newProd = {
          ...parsedProduct,
          rating: 5.0,
          reviewsCount: 0,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'products'), newProd);
      }
      setShowProductModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to save product: ', err);
    }
  };

  const handleProductDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setDeleteConfirmProductId(null);
      showToast('Product deleted successfully!', 'success');
      refreshData();
    } catch (err) {
      console.error('Failed to delete product: ', err);
      showToast('Failed to delete product.', 'error');
    }
  };

  const handleDuplicateProduct = async (prod: any) => {
    try {
      const duplicated = {
        ...prod,
        name: `${prod.name} (Copy)`,
        createdAt: new Date().toISOString()
      };
      delete duplicated.id;
      await addDoc(collection(db, 'products'), duplicated);
      refreshData();
    } catch (err) {
      console.error('Failed to duplicate product: ', err);
    }
  };

  // --- CATEGORY CRUD OPERATIONS ---
  const handleOpenCategoryModal = (cat: any | null = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name, image: cat.image, enabled: cat.enabled });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', image: '', enabled: true });
    }
    setShowCategoryModal(true);
  };

  const handleCategorySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      const slug = categoryForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const catData = {
        name: categoryForm.name,
        image: categoryForm.image,
        enabled: categoryForm.enabled
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), catData);
      } else {
        await addDoc(collection(db, 'categories'), { ...catData, id: slug });
      }
      setShowCategoryModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to save category: ', err);
    }
  };

  // --- ORDER MANAGEMENT ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, note: string) => {
    const orderDoc = allOrders.find(o => o.id === orderId);
    if (!orderDoc) return;

    const updatedTimeline = [
      ...orderDoc.statusTimeline,
      { status: nextStatus.replace('_', ' '), time: new Date().toISOString(), note }
    ];

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        statusTimeline: updatedTimeline
      });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to update order status: ', err);
    }
  };

  // --- REVIEW MODERATION ---
  const handleModerateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'rejected') {
        await deleteDoc(doc(db, 'reviews', reviewId));
      } else {
        await updateDoc(doc(db, 'reviews', reviewId), { status });
      }
      fetchAdminData();
    } catch (err) {
      console.error('Failed to moderate review: ', err);
    }
  };

  // --- QUERY / HELPLINE REPLIES ---
  const handleReplyToQuery = async (queryId: string, replyMessage: string) => {
    if (!replyMessage.trim()) return;
    try {
      await updateDoc(doc(db, 'queries', queryId), {
        status: 'replied',
        reply: replyMessage
      });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to reply query: ', err);
    }
  };

  const compressAndResizeImage = (file: File, maxW: number, maxH: number, quality: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  // --- ROBUST UNIVERSAL IMAGE UPLOAD HELPER ---
  const uploadImageOrGetBase64 = async (file: File, path: string): Promise<string> => {
    // Determine compression parameters based on target type
    let maxW = 1200;
    let maxH = 1200;
    let quality = 0.85;

    if (path === 'settings') {
      // Logos can be quite small but need high crispness
      maxW = 400;
      maxH = 400;
      quality = 0.9;
    } else if (path === 'banners') {
      // Banners are wide hero slide images, optimized for laptop & phone screens
      maxW = 1920;
      maxH = 1080;
      quality = 0.85;
    } else if (path === 'categories') {
      // Categories can be 500x500 for crisp thumbnail displays
      maxW = 500;
      maxH = 500;
      quality = 0.85;
    } else if (path === 'qrcodes') {
      // UPI QR Code needs to be extremely clear for scanning
      maxW = 800;
      maxH = 800;
      quality = 0.95;
    }

    // 1. Compress the image first
    let uploadTarget: Blob | File = file;
    try {
      if (file.type.startsWith('image/')) {
        uploadTarget = await compressAndResizeImage(file, maxW, maxH, quality);
      }
    } catch (compressErr) {
      console.warn('Image compression failed, using original file:', compressErr);
    }

    // 2. Try Firebase Storage upload first with a fast 1.5-second timeout
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadPromise = uploadBytes(storageRef, uploadTarget);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage upload timed out')), 1500)
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase Storage upload failed or timed out, falling back to local Base64 URL:', err);
      // 3. Fall back to reading as Base64 DataURL (absolutely guaranteed to work!)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to Base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(uploadTarget);
      });
    }
  };

  // --- UPLOAD LOGO FILE ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingLogo(true);
      try {
        const downloadUrl = await uploadImageOrGetBase64(file, 'settings');
        setSettingsForm(prev => ({ ...prev, logo: downloadUrl }));
        showToast('Logo image uploaded successfully!', 'success');
      } catch (err) {
        console.error('Error uploading logo: ', err);
        showToast('Failed to upload logo. Please try again.', 'error');
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  // --- UPLOAD QR CODE FILE ---
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingQr(true);
      try {
        const downloadUrl = await uploadImageOrGetBase64(file, 'qrcodes');
        setSettingsForm(prev => ({ ...prev, upiQrCode: downloadUrl }));
        showToast('Custom QR code image uploaded successfully!', 'success');
      } catch (err) {
        console.error('Error uploading QR code: ', err);
        showToast('Failed to upload QR code. Please try again.', 'error');
      } finally {
        setUploadingQr(false);
      }
    }
  };

  // --- UPLOAD PRODUCT IMAGE ---
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingProductImage(true);
      try {
        const downloadUrl = await uploadImageOrGetBase64(file, 'products');
        setProductForm(prev => ({ ...prev, imageUrl: downloadUrl }));
        showToast('Product image uploaded successfully!', 'success');
      } catch (err) {
        console.error('Error uploading product image: ', err);
        showToast('Failed to upload product image.', 'error');
      } finally {
        setUploadingProductImage(false);
      }
    }
  };

  // --- UPLOAD ADDITIONAL PRODUCT IMAGE ---
  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingAdditional(true);
      try {
        const downloadUrl = await uploadImageOrGetBase64(file, 'products');
        setProductForm(prev => ({
          ...prev,
          additionalImages: [...(prev.additionalImages || []), downloadUrl]
        }));
        showToast('Additional image uploaded successfully!', 'success');
      } catch (err) {
        console.error('Error uploading additional image: ', err);
        showToast('Failed to upload additional image.', 'error');
      } finally {
        setUploadingAdditional(false);
      }
    }
  };

  // --- UPLOAD CATEGORY IMAGE ---
  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingCategoryImage(true);
      try {
        const downloadUrl = await uploadImageOrGetBase64(file, 'categories');
        setCategoryForm(prev => ({ ...prev, image: downloadUrl }));
        showToast('Category image uploaded successfully!', 'success');
      } catch (err) {
        console.error('Error uploading category image: ', err);
        showToast('Failed to upload category image.', 'error');
      } finally {
        setUploadingCategoryImage(false);
      }
    }
  };

  // --- UPLOAD CAROUSEL BANNER ---
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingBanner(true);
      try {
        const downloadUrl = await uploadImageOrGetBase64(file, 'banners');
        const currentBanners = settingsForm.homepageBanners ? settingsForm.homepageBanners.split('\n').filter(b => b.trim()) : [];
        currentBanners.push(downloadUrl);
        setSettingsForm(prev => ({ ...prev, homepageBanners: currentBanners.join('\n') }));
        showToast('Carousel banner uploaded and appended successfully!', 'success');
      } catch (err) {
        console.error('Error uploading banner: ', err);
        showToast('Failed to upload carousel banner.', 'error');
      } finally {
        setUploadingBanner(false);
      }
    }
  };

  // --- SAVE SYSTEM SETTINGS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.name.trim()) {
      showToast('Application name cannot be empty.', 'error');
      return;
    }
    const parsedBanners = settingsForm.homepageBanners.split('\n').filter(b => b.trim() !== '');
    const parsedBrands = settingsForm.popularBrands.split(',').map(b => b.trim()).filter(b => b.length > 0);
    const parsedContactNumbers = [settingsForm.salesCallNumber.trim(), settingsForm.whatsappNumber.trim()];
    const parsedSocialLinks = {
      facebook: settingsForm.socialFacebook.trim(),
      instagram: settingsForm.socialInstagram.trim(),
      youtube: settingsForm.socialYoutube.trim(),
      twitter: settingsForm.socialTwitter.trim()
    };
    const parsedHighlightCards = [
      { title: settingsForm.highlightCard1Title.trim(), description: settingsForm.highlightCard1Desc.trim(), iconType: settingsForm.highlightCard1Icon },
      { title: settingsForm.highlightCard2Title.trim(), description: settingsForm.highlightCard2Desc.trim(), iconType: settingsForm.highlightCard2Icon },
      { title: settingsForm.highlightCard3Title.trim(), description: settingsForm.highlightCard3Desc.trim(), iconType: settingsForm.highlightCard3Icon }
    ];

    try {
      await updateDoc(doc(db, 'settings', 'website'), {
        name: settingsForm.name,
        logo: settingsForm.logo,
        upiId: settingsForm.upiId,
        upiName: settingsForm.upiName,
        upiQrCode: settingsForm.upiQrCode,
        promoCards: settingsForm.promoCards,
        transactionNote: settingsForm.transactionNote,
        homepageBanners: parsedBanners,
        storeAddress: settingsForm.storeAddress.trim(),
        storeTimings: settingsForm.storeTimings.trim(),
        contactNumbers: parsedContactNumbers,
        socialLinks: parsedSocialLinks,
        popularBrands: parsedBrands,
        highlightCards: parsedHighlightCards,
        adminMobile: settingsForm.adminMobile.trim(),
        adminName: settingsForm.adminName.trim()
      });
      showToast('Website settings saved successfully!', 'success');
      refreshData();
    } catch (err) {
      console.error('Failed to update website settings: ', err);
      showToast('Failed to save settings: ' + (err as Error).message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Admin Glass Top Navbar with Notification Bell */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-white/80 border border-white/50 backdrop-blur-xl rounded-3xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        {/* Shiny reflection accent */}
        <div className="absolute -inset-y-12 -inset-x-20 w-32 bg-white/10 blur-xl transform rotate-30 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="font-sans font-extrabold text-[10px] sm:text-xs text-indigo-600 uppercase tracking-wider">Live System Connected</p>
          </div>
          <h1 className="font-sans font-black text-lg sm:text-2xl text-gray-900 tracking-tight mt-1">
            Sethi Electronics Command Center
          </h1>
          <p className="font-sans text-xxs sm:text-xs text-gray-500 mt-0.5">
            Monitor real-time sales, order verifications, catalog stock, and reviews
          </p>
        </div>

        {/* Action Controls - Notification Bell & Sync */}
        <div className="flex items-center gap-3 self-end sm:self-auto relative z-20">
          <button
            onClick={() => {
              fetchAdminData();
              showToast('System synchronization completed!', 'success');
            }}
            className="p-2.5 bg-white/80 hover:bg-white text-gray-600 hover:text-indigo-600 border border-gray-150 hover:border-indigo-100 rounded-2xl shadow-xs transition-all active:scale-95 text-xs font-sans font-bold flex items-center gap-1.5"
            title="Refresh Data"
          >
            <span>Sync Live</span>
          </button>

          {/* Bell Notification Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`p-3 rounded-2xl relative transition-all active:scale-95 ${
                isNotificationOpen 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-150'
              }`}
            >
              <Bell className={`h-5 w-5 ${pendingVerificationOrders.length > 0 ? 'animate-bounce' : ''}`} />
              
              {pendingVerificationOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5.5 w-5.5 bg-red-500 text-white font-sans text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {pendingVerificationOrders.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Portal Popup */}
            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-sans font-extrabold text-sm text-gray-800">New Pending Verifications</h4>
                      <p className="font-sans text-[10px] text-gray-400 mt-0.5">Requires payment receipt confirmation</p>
                    </div>
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 font-sans text-xxs font-extrabold rounded-full">
                      {pendingVerificationOrders.length} Pending
                    </span>
                  </div>

                  {/* Body List */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                    {pendingVerificationOrders.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="font-sans font-bold text-xs text-gray-800">All caught up!</p>
                        <p className="font-sans text-[10px] text-gray-400 max-w-xs mx-auto">
                          There are no new orders waiting for payment verification at this moment.
                        </p>
                      </div>
                    ) : (
                      pendingVerificationOrders.map((ord) => (
                        <div 
                          key={ord.id}
                          className="p-4 hover:bg-gray-50/50 transition-colors flex gap-3 items-start cursor-pointer text-left"
                          onClick={() => {
                            setActiveTab('orders');
                            setIsNotificationOpen(false);
                            // Scroll or highlight the order
                            setTimeout(() => {
                              const el = document.getElementById(`order-card-${ord.id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('ring-2', 'ring-blue-500/20', 'bg-blue-50/10');
                                setTimeout(() => {
                                  el.classList.remove('ring-2', 'ring-blue-500/20', 'bg-blue-50/10');
                                }, 3000);
                              }
                            }, 300);
                          }}
                        >
                          <div className="h-9 w-9 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 shrink-0 mt-0.5 font-bold text-xs">
                            ₹
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono text-xs font-bold text-gray-800 block truncate">{ord.orderNumber}</span>
                              <span className="shrink-0 font-sans text-[9px] text-gray-400">{formatDate(ord.createdAt)}</span>
                            </div>
                            <p className="font-sans text-xs text-gray-600 truncate mt-0.5">
                              Customer: <span className="font-bold text-gray-700">{ord.address?.fullName || 'Guest'}</span>
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="font-mono text-xs font-extrabold text-blue-600">{formatINR(ord.amount)}</span>
                              <span className="font-sans text-xxs font-extrabold text-amber-600 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full">
                                Verify Now &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {pendingVerificationOrders.length > 0 && (
                    <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                      <button
                        onClick={() => {
                          setActiveTab('orders');
                          setIsNotificationOpen(false);
                        }}
                        className="font-sans font-extrabold text-[11px] text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                      >
                        View All Orders &rarr;
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Admin Controls Drawer */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-gray-100 rounded-2xl lg:rounded-3xl p-3 sm:p-5 shadow-sm h-fit">
          <div className="hidden lg:flex items-center gap-3 pb-5 border-b border-gray-100 mb-5">
            <Settings className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="font-sans font-extrabold text-sm text-gray-800 uppercase tracking-wider">Admin Panel</span>
          </div>

          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:space-y-1 gap-1.5 pb-1 lg:pb-0 scrollbar-none font-sans text-xs font-bold shrink-0 w-full">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'metrics' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              <span>Metrics & Sales</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>Manage Products</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <FolderHeart className="h-4.5 w-4.5" />
              <span>Manage Categories</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left relative whitespace-nowrap ${
                activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>Manage Orders</span>
              {pendingVerificationOrders.length > 0 && (
                <span className="ml-1 lg:absolute lg:right-3 lg:top-1/2 lg:-translate-y-1/2 bg-amber-500 text-white text-[10px] h-4.5 w-4.5 rounded-full flex items-center justify-center">
                  {pendingVerificationOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'customers' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Manage Customers</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'reviews' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Star className="h-4.5 w-4.5" />
              <span>Manage Reviews</span>
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'queries' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="h-4.5 w-4.5" />
              <span>Showroom Queries</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`shrink-0 lg:w-full flex items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-colors text-left whitespace-nowrap ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>Website Settings</span>
            </button>
          </nav>
        </aside>

        {/* Master Control Board panels */}
        <main className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden h-fit">
          
          {/* TAB 1: DASHBOARD OVERVIEW METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-8">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Website Sales & Performance Summary</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="font-sans text-xxs font-bold text-gray-400 uppercase">Gross Revenue</div>
                  <div className="font-mono text-2xl font-extrabold text-blue-600 mt-1">{formatINR(totalSales)}</div>
                </div>
                <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="font-sans text-xxs font-bold text-gray-400 uppercase">Pending Verification</div>
                  <div className="font-mono text-2xl font-extrabold text-amber-600 mt-1">{pendingVerificationOrders.length} Orders</div>
                </div>
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="font-sans text-xxs font-bold text-gray-400 uppercase">Total Catalog Items</div>
                  <div className="font-mono text-2xl font-extrabold text-emerald-600 mt-1">{products.length} Products</div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="space-y-4">
                <h3 className="font-sans font-bold text-xs text-gray-500 uppercase">Recent Submissions</h3>
                <div className="border border-gray-100 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-bold">
                      <tr>
                        <th className="p-3">Order No</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allOrders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td className="p-3 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                          <td className="p-3 font-semibold text-gray-700">{o.customerName}</td>
                          <td className="p-3 font-mono">{formatINR(o.amount)}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gray-100 text-gray-500">
                              {o.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h2 className="font-sans font-extrabold text-lg text-gray-800">Products Inventory</h2>
                <button
                  onClick={() => handleOpenProductModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(prod => (
                      <tr key={prod.id}>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img src={prod.images?.[0] || null} alt="" className="h-8 w-8 object-contain bg-gray-50 border rounded-lg" />
                            <div className="min-w-0">
                              <span className="font-bold text-gray-800 block truncate max-w-[180px]">{prod.name}</span>
                              <span className="text-[10px] text-gray-400 capitalize">{prod.brand} • {prod.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-gray-800">{formatINR(prod.price)}</td>
                        <td className="p-3 font-mono font-bold">
                          <span className={prod.stock === 0 ? 'text-red-500' : 'text-emerald-600'}>{prod.stock}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2 font-bold text-gray-400">
                            <button onClick={() => handleOpenProductModal(prod)} className="p-1 hover:text-blue-600" title="Edit Product">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDuplicateProduct(prod)} className="p-1 hover:text-amber-500" title="Duplicate">
                              <Copy className="h-4 w-4" />
                            </button>
                            {deleteConfirmProductId === prod.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-100">
                                <button
                                  onClick={() => handleProductDelete(prod.id)}
                                  className="text-[9px] px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded"
                                  title="Confirm Delete"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmProductId(null)}
                                  className="text-[9px] px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold rounded"
                                  title="Cancel"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirmProductId(prod.id)} className="p-1 hover:text-red-500" title="Delete Product">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h2 className="font-sans font-extrabold text-lg text-gray-800">Categories Listing</h2>
                <button
                  onClick={() => handleOpenCategoryModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-xs bg-white">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img src={cat.image} alt="" className="h-10 w-10 object-cover bg-gray-50 border rounded-full" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-sans font-extrabold text-xs text-blue-600">
                          {cat.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-sans font-bold text-sm text-gray-800">{cat.name}</h4>
                        <span className={`text-[10px] font-extrabold uppercase ${cat.enabled ? 'text-emerald-500' : 'text-red-500'}`}>
                          {cat.enabled ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <button onClick={() => handleOpenCategoryModal(cat)} className="p-1 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE ORDERS WITH TIMELINES UPDATES */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Master Orders Manager</h2>
              
              <div className="space-y-4">
                {allOrders.map(ord => (
                  <div key={ord.id} id={`order-card-${ord.id}`} className="border border-gray-150 rounded-2xl p-5 bg-white shadow-sm space-y-4 transition-all duration-500">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="font-mono font-extrabold text-sm text-blue-600 block sm:inline mr-2">{ord.orderNumber}</span>
                        <span className="text-gray-400 text-xxs font-mono block sm:inline">{formatDate(ord.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-gray-800">{formatINR(ord.amount)}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gray-100 text-gray-600">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-gray-500 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <p><strong className="text-gray-700">Customer:</strong> {ord.customerName} ({ord.mobile})</p>
                        <p className="mt-1"><strong className="text-gray-700">Address:</strong> {ord.address.houseNumber}, {ord.address.street}, {ord.address.city}, {ord.address.state} - {ord.address.pincode}</p>
                      </div>

                      {/* Payment Verification credentials */}
                      <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-gray-250 sm:pl-4">
                        <p><strong className="text-gray-700">UTR No:</strong> <span className="font-mono font-bold text-gray-800">{ord.utr}</span></p>
                        {ord.paymentScreenshot && (
                          <button
                            type="button"
                            onClick={() => setViewingScreenshotUrl(ord.paymentScreenshot)}
                            className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                          >
                            <ImageIcon className="h-4 w-4" />
                            <span>View Screenshot</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Operational action button controls for order lifecycle */}
                    <div className="flex flex-wrap gap-2.5 pt-1.5 font-sans text-xs font-bold">
                      {ord.status === 'pending_verification' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed', 'Payment verified and approved by administrator. Order confirmed.')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                          >
                            Approve Payment (Confirm)
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'rejected', 'Order rejected. Payment verification failed or screenshot is invalid.')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md"
                          >
                            Reject Order
                          </button>
                        </>
                      )}
                      {ord.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'shipped', 'Order packed and handed over to courier. Shipment tracking active.')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                        >
                          Ship Order
                        </button>
                      )}
                      {ord.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', 'Order successfully delivered to customer destination.')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MANAGE CUSTOMERS REGISTER LIST */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Registered Customer Directory</h2>
              
              <div className="border border-gray-100 rounded-2xl overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-bold">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Registered Mobile</th>
                      <th className="p-3">Joined On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allCustomers.map(cust => (
                      <tr key={cust.id}>
                        <td className="p-3 font-semibold text-gray-800">{cust.name}</td>
                        <td className="p-3 font-mono font-bold text-gray-700">{cust.mobile}</td>
                        <td className="p-3 font-mono text-gray-400">{formatDate(cust.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: MANAGE REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Product Reviews Moderation</h2>
              
              <div className="space-y-4">
                {allReviews.map(rev => (
                  <div key={rev.id} className="border border-gray-100 rounded-2xl p-4 bg-white flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1.5 flex-1 font-sans">
                      <div className="flex items-center gap-2">
                        <strong className="text-gray-800 font-bold">{rev.userName}</strong>
                        <span className="text-gray-400 text-xxs font-mono">{formatDate(rev.createdAt)}</span>
                      </div>
                      <p className="text-xs text-blue-600 font-semibold truncate max-w-sm">Product: {rev.productName}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{rev.comment}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 font-sans text-xs font-bold">
                      {rev.status === 'approved' ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xxs uppercase tracking-wider">Approved</span>
                      ) : (
                        <button
                          onClick={() => handleModerateReview(rev.id, 'approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleModerateReview(rev.id, 'rejected')}
                        className="px-3.5 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SHOWROOM CONTACT QUERIES SUBMISSIONS */}
          {activeTab === 'queries' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Customer Helpline submissions</h2>
              
              <div className="space-y-4">
                {allQueries.map(qry => (
                  <div key={qry.id} className="border border-gray-100 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-sans">
                        <h4 className="font-bold text-sm text-gray-800">{qry.name}</h4>
                        <p className="font-mono text-xxs text-gray-400 mt-0.5">Mobile: {qry.mobile} • Sent: {formatDate(qry.createdAt)}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${qry.status === 'replied' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                        {qry.status}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-50 leading-relaxed">
                      {qry.message}
                    </p>

                    {qry.status === 'replied' ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs font-sans">
                        <strong className="text-emerald-800 font-bold block mb-1">Administrative Reply:</strong>
                        <p className="text-emerald-700">{qry.reply}</p>
                      </div>
                    ) : (
                      <div className="pt-2 font-sans">
                        <textarea
                          placeholder="Type answer or response to call back..."
                          id={`reply-input-${qry.id}`}
                          className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none mb-2"
                        />
                        <button
                          onClick={() => {
                            const inputEl = document.getElementById(`reply-input-${qry.id}`) as HTMLTextAreaElement;
                            if (inputEl) {
                              handleReplyToQuery(qry.id, inputEl.value);
                              inputEl.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md"
                        >
                          Send Call-back Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="font-sans font-extrabold text-lg text-gray-800 border-b border-gray-50 pb-3">Website & Brand Settings</h2>
              
              <form onSubmit={handleSaveSettings} className="space-y-5 font-sans text-xs">
                {/* Brand Details */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h3 className="font-sans font-bold text-sm text-gray-700">Identity & Logo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Store / Brand Name</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Brand Logo Image</label>
                      <div className="flex items-center gap-3">
                        {settingsForm.logo ? (
                          <div className="h-12 w-12 border border-gray-200 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                            <img src={settingsForm.logo || null} alt="Preview Logo" className="h-full w-full object-contain p-1" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <label htmlFor="logo-file-upload" className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1">
                              {uploadingLogo ? 'Uploading...' : 'Upload Logo File'}
                            </label>
                            <input
                              type="file"
                              id="logo-file-upload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              disabled={uploadingLogo}
                            />
                            {settingsForm.logo && (
                              <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, logo: '' })}
                                className="text-red-500 font-bold hover:underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <p className="text-xxs text-gray-400">Directly upload high-quality PNG or SVG logo.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Access Settings */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h3 className="font-sans font-bold text-sm text-gray-700">Admin Account Credentials</h3>
                  <p className="text-gray-500 text-[10px] -mt-2">
                    Configure the credentials used to log in to the admin panel. The default admin password is <code className="font-mono bg-white px-1 py-0.5 rounded text-gray-800 border border-gray-100">AdminPass2026!</code>.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Admin Display Name</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.adminName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, adminName: e.target.value })}
                        placeholder="e.g. Admin"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Admin Login Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.adminMobile}
                        onChange={(e) => setSettingsForm({ ...settingsForm, adminMobile: e.target.value })}
                        placeholder="e.g. 7060784706"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-500 uppercase mb-1.5">Showroom UPI Address</label>
                    <input
                      type="text"
                      value={settingsForm.upiId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-500 uppercase mb-1.5">Registered Receiver Name</label>
                    <input
                      type="text"
                      value={settingsForm.upiName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiName: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Custom QR Code Image Upload */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-3">
                  <label className="block font-sans font-bold text-sm text-gray-700">Custom Showroom UPI QR Code Image (Optional)</label>
                  <p className="text-gray-500 text-[10px] -mt-1">
                    Upload your printed QR code (e.g. Google Pay, PhonePe, Paytm, or BHIM QR). If uploaded, customers will scan this static image on checkout instead of a dynamically generated code.
                  </p>
                  <div className="flex items-center gap-4 bg-white border border-gray-200/60 p-3.5 rounded-xl">
                    {settingsForm.upiQrCode ? (
                      <div className="h-16 w-16 border border-gray-200 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
                        <img src={settingsForm.upiQrCode || null} alt="Custom QR Preview" className="h-full w-full object-contain p-1" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                        <QrCode className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor="qr-file-upload" className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1">
                          {uploadingQr ? 'Uploading...' : 'Upload QR Image'}
                        </label>
                        <input
                          type="file"
                          id="qr-file-upload"
                          accept="image/*"
                          onChange={handleQrUpload}
                          className="hidden"
                          disabled={uploadingQr}
                        />
                        {settingsForm.upiQrCode && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, upiQrCode: '' })}
                            className="text-red-500 font-bold hover:underline text-xs"
                          >
                            Clear QR Image
                          </button>
                        )}
                      </div>
                      <p className="text-xxs text-gray-400">Directly upload high-quality PNG, JPG, or SVG static QR image.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Transaction verification Instructions</label>
                  <textarea
                    rows={3}
                    value={settingsForm.transactionNote}
                    onChange={(e) => setSettingsForm({ ...settingsForm, transactionNote: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Sliding Carousel Banners</label>
                  <div className="space-y-4">
                    {/* File Upload Button */}
                    <div className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-100 rounded-xl">
                      <label htmlFor="banner-file-upload" className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xxs rounded-lg cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1">
                        {uploadingBanner ? 'Uploading...' : 'Upload & Append Banner File'}
                      </label>
                      <input
                        type="file"
                        id="banner-file-upload"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                        disabled={uploadingBanner}
                      />
                      <p className="text-[10px] text-gray-400">Directly upload banner files to insert them into your sliding carousel!</p>
                    </div>

                    {/* Banner list with preview and delete buttons */}
                    {(() => {
                      const parsedBanners = settingsForm.homepageBanners.split('\n').filter(b => b.trim() !== '');
                      if (parsedBanners.length === 0) {
                        return (
                          <p className="text-xs text-gray-400 italic">No banners uploaded yet. Upload your banner files above.</p>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {parsedBanners.map((bannerUrl, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-12 w-20 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={bannerUrl} 
                                    alt={`Banner ${index + 1}`} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { 
                                      (e.target as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
                                    }} 
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-gray-750">Slide #{index + 1}</p>
                                  <p className="text-[9px] text-gray-400 truncate font-mono">{bannerUrl}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedBanners = parsedBanners.filter((_, i) => i !== index);
                                  setSettingsForm({ ...settingsForm, homepageBanners: updatedBanners.join('\n') });
                                  showToast('Banner removed successfully!', 'info');
                                }}
                                className="text-red-500 hover:text-red-700 font-bold text-xs shrink-0 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Showroom & Store Details */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h3 className="font-sans font-bold text-sm text-gray-700">Showroom Address & Timings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Showroom Address</label>
                      <textarea
                        rows={2}
                        required
                        value={settingsForm.storeAddress}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Store Timings</label>
                      <textarea
                        rows={2}
                        required
                        value={settingsForm.storeTimings}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeTimings: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Helpline / Contact Details */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h3 className="font-sans font-bold text-sm text-gray-700">Phone Helplines</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">Sales Call Number</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.salesCallNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, salesCallNumber: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1.5">WhatsApp Helpline</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Popular Brands & Socials */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h3 className="font-sans font-bold text-sm text-gray-700">Popular Brands & Social Links</h3>
                  <div>
                    <label className="block font-bold text-gray-500 uppercase mb-1.5">Popular Brands (comma separated)</label>
                    <input
                      type="text"
                      placeholder="LG, SAMSUNG, SONY, WHIRLPOOL, DIXON, BAJAJ"
                      value={settingsForm.popularBrands}
                      onChange={(e) => setSettingsForm({ ...settingsForm, popularBrands: e.target.value })}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1">Facebook URL</label>
                      <input
                        type="url"
                        value={settingsForm.socialFacebook}
                        onChange={(e) => setSettingsForm({ ...settingsForm, socialFacebook: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={settingsForm.socialInstagram}
                        onChange={(e) => setSettingsForm({ ...settingsForm, socialInstagram: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1">YouTube URL</label>
                      <input
                        type="url"
                        value={settingsForm.socialYoutube}
                        onChange={(e) => setSettingsForm({ ...settingsForm, socialYoutube: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 uppercase mb-1">Twitter URL</label>
                      <input
                        type="url"
                        value={settingsForm.socialTwitter}
                        onChange={(e) => setSettingsForm({ ...settingsForm, socialTwitter: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Highlight Cards */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <h3 className="font-sans font-bold text-sm text-gray-700">Homepage Highlights (3 Promotion Cards)</h3>
                  
                  {/* Card 1 */}
                  <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="font-bold text-gray-700 text-xs">Highlight Card 1</span>
                      <select
                        value={settingsForm.highlightCard1Icon}
                        onChange={(e: any) => setSettingsForm({ ...settingsForm, highlightCard1Icon: e.target.value })}
                        className="p-1 bg-gray-50 border border-gray-100 rounded font-sans text-xxs"
                      >
                        <option value="truck">Delivery (Truck Icon)</option>
                        <option value="shield">Authenticity (Shield Icon)</option>
                        <option value="award">Support (Award Icon)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settingsForm.highlightCard1Title}
                          onChange={(e) => setSettingsForm({ ...settingsForm, highlightCard1Title: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card Description</label>
                        <input
                          type="text"
                          value={settingsForm.highlightCard1Desc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, highlightCard1Desc: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="font-bold text-gray-700 text-xs">Highlight Card 2</span>
                      <select
                        value={settingsForm.highlightCard2Icon}
                        onChange={(e: any) => setSettingsForm({ ...settingsForm, highlightCard2Icon: e.target.value })}
                        className="p-1 bg-gray-50 border border-gray-100 rounded font-sans text-xxs"
                      >
                        <option value="truck">Delivery (Truck Icon)</option>
                        <option value="shield">Authenticity (Shield Icon)</option>
                        <option value="award">Support (Award Icon)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settingsForm.highlightCard2Title}
                          onChange={(e) => setSettingsForm({ ...settingsForm, highlightCard2Title: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card Description</label>
                        <input
                          type="text"
                          value={settingsForm.highlightCard2Desc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, highlightCard2Desc: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <span className="font-bold text-gray-700 text-xs">Highlight Card 3</span>
                      <select
                        value={settingsForm.highlightCard3Icon}
                        onChange={(e: any) => setSettingsForm({ ...settingsForm, highlightCard3Icon: e.target.value })}
                        className="p-1 bg-gray-50 border border-gray-100 rounded font-sans text-xxs"
                      >
                        <option value="truck">Delivery (Truck Icon)</option>
                        <option value="shield">Authenticity (Shield Icon)</option>
                        <option value="award">Support (Award Icon)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settingsForm.highlightCard3Title}
                          onChange={(e) => setSettingsForm({ ...settingsForm, highlightCard3Title: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Card Description</label>
                        <input
                          type="text"
                          value={settingsForm.highlightCard3Desc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, highlightCard3Desc: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home Screen Promo Cards Editor */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-sans font-bold text-sm text-gray-700">Home Screen Promo Banner Cards (Horizontal Carousel)</h3>
                      <p className="text-gray-400 text-[10px]">
                        Add, edit, or remove cards displayed horizontally in an auto-scrolling carousel on the Home page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newPromo = {
                          badge: 'LIMITED OFFER',
                          title: 'New Dynamic Offer Card',
                          description: 'Edit this description to display on your homepage banner.',
                          buttonText: 'Order Online',
                          buttonLink: '/products',
                          gradientFrom: 'from-blue-600',
                          gradientTo: 'to-indigo-600'
                        };
                        setSettingsForm(prev => ({
                          ...prev,
                          promoCards: [...(prev.promoCards || []), newPromo]
                        }));
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-blue-600 font-bold hover:bg-gray-50 text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-sm shrink-0 self-start sm:self-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Promo Card</span>
                    </button>
                  </div>

                  {(!settingsForm.promoCards || settingsForm.promoCards.length === 0) ? (
                    <div className="text-center py-8 bg-white border border-dashed border-gray-250 rounded-xl">
                      <p className="text-xs text-gray-400 font-sans">No promotional cards configured yet. Click "Add Promo Card" to build one!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {settingsForm.promoCards.map((card, index) => (
                        <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 relative shadow-xs">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...settingsForm.promoCards];
                              updated.splice(index, 1);
                              setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                            }}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove Card"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="font-bold text-gray-700 text-xs flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-mono text-[10px]">{index + 1}</span>
                            <span>Promo Card Configuration</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Badge Text</label>
                              <input
                                type="text"
                                value={card.badge || ''}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], badge: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                placeholder="e.g. LIMITED TIME OFFER"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Title Text</label>
                              <input
                                type="text"
                                value={card.title || ''}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], title: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                placeholder="e.g. Up to 50% Off On Induction Cooktops"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description / Subtitle Text</label>
                              <input
                                type="text"
                                value={card.description || ''}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], description: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                placeholder="e.g. Order online to claim your special kitchen appliance gift bundle."
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs text-gray-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Button Text</label>
                              <input
                                type="text"
                                value={card.buttonText || ''}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], buttonText: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                placeholder="e.g. Shop Now"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Button Redirect URL / Route Path</label>
                              <input
                                type="text"
                                value={card.buttonLink || ''}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], buttonLink: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                placeholder="e.g. /products"
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gradient Start Color</label>
                              <select
                                value={card.gradientFrom || 'from-blue-600'}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], gradientFrom: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-700"
                              >
                                <option value="from-blue-600">Ocean Blue (Blue 600)</option>
                                <option value="from-emerald-500">Emerald Green (Emerald 500)</option>
                                <option value="from-indigo-600">Royal Indigo (Indigo 600)</option>
                                <option value="from-rose-500">Rose Coral (Rose 500)</option>
                                <option value="from-amber-500">Amber Gold (Amber 500)</option>
                                <option value="from-violet-600">Deep Violet (Violet 600)</option>
                                <option value="from-cyan-500">Cyan Teal (Cyan 500)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gradient End Color</label>
                              <select
                                value={card.gradientTo || 'to-indigo-600'}
                                onChange={(e) => {
                                  const updated = [...settingsForm.promoCards];
                                  updated[index] = { ...updated[index], gradientTo: e.target.value };
                                  setSettingsForm(prev => ({ ...prev, promoCards: updated }));
                                }}
                                className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-700"
                              >
                                <option value="to-indigo-600">Indigo (Indigo 600)</option>
                                <option value="to-teal-600">Teal (Teal 600)</option>
                                <option value="to-purple-600">Purple (Purple 600)</option>
                                <option value="to-pink-600">Pink (Pink 600)</option>
                                <option value="to-orange-500">Orange (Orange 500)</option>
                                <option value="to-blue-700">Deep Blue (Blue 700)</option>
                              </select>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-blue-200 transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Save Settings Configuration
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* product save / edit modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative font-sans text-xs">
            <h3 className="font-extrabold text-base text-gray-800 mb-6">{editingProduct ? 'Edit Catalog Product' : 'Add Product to Catalog'}</h3>
            
            <form onSubmit={handleProductSave} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Brand</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Discount Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Discount %</label>
                  <input
                    type="number"
                    required
                    value={productForm.discount}
                    onChange={(e) => setProductForm({ ...productForm, discount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Inventory Stock</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1.5">Product Image</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3.5 border border-gray-100 rounded-2xl">
                  {productForm.imageUrl ? (
                    <div className="h-16 w-16 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img src={productForm.imageUrl || null} alt="Product Preview" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 border border-dashed border-gray-300 rounded-xl shrink-0 flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center gap-2">
                      <label htmlFor="product-file-upload" className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1">
                        {uploadingProductImage ? 'Uploading...' : 'Upload Image File'}
                      </label>
                      <input
                        type="file"
                        id="product-file-upload"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        className="hidden"
                        disabled={uploadingProductImage}
                      />
                      {productForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                          className="text-red-500 font-bold text-xs hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1.5">Additional Images (Optional)</label>
                
                {/* Existing Additional Images list */}
                {productForm.additionalImages && productForm.additionalImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {productForm.additionalImages.map((imgUrl, index) => (
                      <div key={index} className="relative group h-16 bg-white border border-gray-150 rounded-xl overflow-hidden p-1 flex items-center justify-center">
                        <img src={imgUrl || null} alt={`Additional ${index}`} className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...productForm.additionalImages];
                            updated.splice(index, 1);
                            setProductForm({ ...productForm, additionalImages: updated });
                          }}
                          className="absolute inset-0 bg-red-600/85 text-white font-extrabold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add dynamic URL or upload for additional images */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3.5 border border-gray-100 rounded-2xl">
                  <div className="h-10 w-10 bg-gray-100 border border-dashed border-gray-300 rounded-xl shrink-0 flex items-center justify-center text-gray-400">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center gap-2">
                      <label htmlFor="additional-file-upload" className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-[10px] uppercase rounded-lg cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1">
                        {uploadingAdditional ? 'Uploading...' : 'Upload Image File'}
                      </label>
                      <input
                        type="file"
                        id="additional-file-upload"
                        accept="image/*"
                        onChange={handleAdditionalImageUpload}
                        className="hidden"
                        disabled={uploadingAdditional}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1.5">Short Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Key Features (new lines)</label>
                  <textarea
                    rows={3}
                    value={productForm.features}
                    onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 uppercase mb-1.5">Specifications (Key:Value per line)</label>
                  <textarea
                    rows={3}
                    value={productForm.specifications}
                    onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1.5">Warranty Details</label>
                <input
                  type="text"
                  value={productForm.warranty}
                  onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl"
                />
              </div>

              <div className="flex flex-wrap gap-4 font-bold text-gray-500 uppercase">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={productForm.isTrending}
                    onChange={(e) => setProductForm({ ...productForm, isTrending: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>Trending</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-95"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* category modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-2xl max-w-sm w-full relative font-sans text-xs">
            <h3 className="font-extrabold text-base text-gray-800 mb-6">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            
            <form onSubmit={handleCategorySave} className="space-y-4 text-left">
              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 uppercase mb-1.5">Category Image</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3.5 border border-gray-100 rounded-2xl">
                  {categoryForm.image ? (
                    <div className="h-16 w-16 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img src={categoryForm.image || null} alt="Category Preview" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 border border-dashed border-gray-300 rounded-xl shrink-0 flex items-center justify-center text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center gap-2">
                      <label htmlFor="category-file-upload" className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all inline-flex items-center gap-1">
                        {uploadingCategoryImage ? 'Uploading...' : 'Upload Image File'}
                      </label>
                      <input
                        type="file"
                        id="category-file-upload"
                        accept="image/*"
                        onChange={handleCategoryImageUpload}
                        className="hidden"
                        disabled={uploadingCategoryImage}
                      />
                      {categoryForm.image && (
                        <button
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, image: '' })}
                          className="text-red-500 font-bold text-xs hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categoryForm.enabled}
                  onChange={(e) => setCategoryForm({ ...categoryForm, enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="font-bold text-gray-500 uppercase">Enable / Visible on Site</span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-95"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {viewingScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative font-sans text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <h3 className="font-extrabold text-sm text-gray-800">Verification Payment Receipt / Screenshot</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingScreenshotUrl(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-100/50 max-h-[60vh]">
              <img
                src={viewingScreenshotUrl || null}
                alt="Payment Receipt"
                className="max-h-full max-w-full object-contain rounded-xl border border-gray-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center gap-3 font-bold">
              <span className="text-gray-400 text-[10px] font-semibold">Verify details manually against UPI dashboard</span>
              <div className="flex gap-2">
                <a
                  href={viewingScreenshotUrl}
                  download="payment-screenshot.png"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center gap-1.5"
                >
                  Open in Tab / Download
                </a>
                <button
                  type="button"
                  onClick={() => setViewingScreenshotUrl(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
