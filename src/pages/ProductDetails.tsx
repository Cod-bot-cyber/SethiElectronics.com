import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, ShoppingCart, Star, Zap, Share2, Shield, RotateCcw, 
  ChevronRight, CheckCircle2, MessageSquare, AlertTriangle, Image as ImageIcon 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { formatINR, formatDate } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import { Shimmer } from '../components/Shimmer';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import { getProductSchema, getBreadcrumbSchema } from '../lib/seoData';

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { products, currentUser, toggleWishlist, isInWishlist, addToCart, showToast, cart, updateCartQuantity, removeFromCart } = useApp();

  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // Review Form States
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewImageUrl, setReviewImageUrl] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<string>('');

  // Find product
  useEffect(() => {
    if (!productId) return;
    const found = products.find(p => p.id === productId);
    if (found) {
      setProduct(found);
      setActiveImage(found.images[0]);
      
      // Load reviews
      const loadReviews = async () => {
        try {
          const q = query(
            collection(db, 'reviews'),
            where('productId', '==', productId),
            where('status', '==', 'approved')
          );
          const snap = await getDocs(q);
          const list: any[] = [];
          snap.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setReviews(list);
        } catch (error) {
          console.error('Error loading reviews: ', error);
        } finally {
          setLoadingReviews(false);
        }
      };
      loadReviews();

      // Dynamic SEO Meta injection
      document.title = `${found.name} | Sethi Electronics`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', found.description);
      }
    }
  }, [productId, products]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="font-sans text-gray-500 font-semibold">Loading product details...</p>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  // Image zoom handler on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: `scale(1.5)`,
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  const handleQuantityChange = (amount: number) => {
    const newQty = quantity + amount;
    setQuantity(Math.min(Math.max(1, newQty), product.stock));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  // Submit Review to Firestore
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/profile');
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    setReviewSuccess('');

    try {
      const newReview = {
        productId: product.id,
        productName: product.name,
        userId: currentUser.uid,
        userName: currentUser.name,
        rating: reviewRating,
        comment: reviewComment,
        images: reviewImageUrl ? [reviewImageUrl] : [],
        status: 'approved', // Auto approved for verified purchasers
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), newReview);
      
      // Update local state
      setReviews(prev => [newReview, ...prev]);
      
      // Update average rating and reviewsCount in products collection
      const newReviewsCount = product.reviewsCount + 1;
      const newAvgRating = parseFloat(
        ((product.rating * product.reviewsCount + reviewRating) / newReviewsCount).toFixed(1)
      );

      await updateDoc(doc(db, 'products', product.id), {
        rating: newAvgRating,
        reviewsCount: newReviewsCount
      });

      setReviewComment('');
      setReviewImageUrl('');
      setReviewSuccess('Review submitted and approved successfully!');
    } catch (error) {
      console.error('Failed to submit review: ', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Product link copied to clipboard!', 'success');
  };

  // Related products (same category, excluding current product)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Frequently Bought Together configuration
  const fbtProducts = products.filter(p => p.id !== product.id).slice(0, 1);
  const fbtProduct = fbtProducts[0];

  const cartItem = product ? cart.find((it: any) => it.product.id === product.id) : null;

  const productBreadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), url: `/category/${product.category}` },
    { name: product.name, url: `/products/${product.id}` }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <SEO
        title={`${product.name} | ${product.brand}`}
        description={`Buy genuine ${product.name} (${product.brand} - ${product.category}) from SethiElectronicsOnline for only ${formatINR(product.price)}. Complete specs & brand warranty.`}
        keywords={`${product.brand}, ${product.category}, ${product.name}, Sethi Electronics, buy ${product.brand} appliances, Modinagar`}
        image={product.images?.[0]}
        jsonLd={[
          getProductSchema(product),
          getBreadcrumbSchema(productBreadcrumbs)
        ]}
      />
      
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-sans text-gray-400 mb-6 sm:mb-8 bg-white border border-gray-100 rounded-full px-4 py-2 w-fit shadow-sm">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <Link to={`/category/${product.category}`} className="capitalize hover:text-blue-600 transition-colors">
          {product.category.replace('-', ' ')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span className="text-gray-700 truncate max-w-[120px] sm:max-w-[200px] font-medium">{product.name}</span>
      </nav>

      {/* 2. Core Grid: Gallery + Purchasing details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white border border-gray-100 rounded-3xl p-4 sm:p-8 shadow-sm">
        
        {/* Left Column: Image Gallery with Magnifier */}
        <div className="space-y-4">
          <div 
            className="relative aspect-square w-full bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={activeImage || null}
              alt={product.name}
              style={zoomStyle}
              className="w-full h-full object-contain p-6 transform duration-150"
            />
          </div>

          {/* Multiple Image selection bar */}
          <div className="flex gap-2">
            {product.images.map((imgUrl: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(imgUrl)}
                className={`h-16 w-16 bg-gray-50 border rounded-xl overflow-hidden p-1.5 transition-all ${
                  activeImage === imgUrl ? 'border-blue-600 ring-2 ring-blue-500/10' : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <img src={imgUrl || null} alt="Thumbnail" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Meta details */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Brand, Stock, Category */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="font-sans font-extrabold text-xs text-blue-600 uppercase tracking-widest">{product.brand}</span>
              {product.stock > 0 ? (
                <span className="font-sans font-semibold text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>In Stock (Only {product.stock} Left)</span>
                </span>
              ) : (
                <span className="font-sans font-semibold text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Out of stock</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-sans font-extrabold text-xl sm:text-2xl lg:text-3xl text-gray-900 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-3.5 mb-6">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4.5 w-4.5 ${
                      i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-sans font-bold text-sm text-gray-700">{product.rating} / 5.0</span>
              <span className="text-gray-300">|</span>
              <span className="font-sans text-sm font-semibold text-gray-500 flex items-center gap-1 cursor-pointer hover:text-blue-600">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span>{reviews.length} Approved Customer Reviews</span>
              </span>
            </div>

            {/* Price section */}
            <div className="bg-blue-50/30 border border-blue-50/50 rounded-2xl p-5 sm:p-6 mb-6">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono font-extrabold text-2xl sm:text-3xl text-blue-600">
                  {formatINR(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="font-mono text-sm sm:text-base text-gray-400 line-through">
                      {formatINR(product.originalPrice)}
                    </span>
                    <span className="font-sans font-extrabold text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                  </>
                )}
              </div>
              {product.originalPrice > product.price && (
                <p className="font-sans text-xs text-gray-500 mt-2">
                  You save a total of <strong className="text-gray-700 font-bold">{formatINR(product.originalPrice - product.price)}</strong> immediately.
                </p>
              )}
            </div>

            {/* Short Description */}
            <p className="font-sans text-sm text-gray-500 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Features list */}
            <div className="space-y-2 mb-6">
              <h4 className="font-sans font-bold text-xs text-gray-700 uppercase">Key Features</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-gray-600">
                {product.features.map((feat: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Controller & Purchasing Buttons */}
            {product.stock > 0 ? (
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {cartItem ? (
                    <motion.div
                      key="in-cart-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-sans font-bold text-xs text-gray-500 uppercase">Quantity in Cart:</span>
                        <div className="flex items-center border border-blue-200 rounded-xl bg-blue-50/50 p-1 font-mono">
                          <button 
                            onClick={() => {
                              if (cartItem.quantity === 1) {
                                removeFromCart(product.id);
                              } else {
                                updateCartQuantity(product.id, cartItem.quantity - 1);
                              }
                            }}
                            className="px-2.5 py-1 hover:bg-blue-100 rounded-lg text-blue-600 font-bold"
                          >
                            -
                          </button>
                          <span className="px-4 font-bold text-sm text-blue-800">{cartItem.quantity}</span>
                          <button 
                            onClick={() => {
                              if (cartItem.quantity < product.stock) {
                                updateCartQuantity(product.id, cartItem.quantity + 1);
                              }
                            }}
                            className="px-2.5 py-1 hover:bg-blue-100 rounded-lg text-blue-600 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/cart')}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Added to Cart (Go to Cart)</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/checkout')}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                        >
                          <Zap className="h-5 w-5" />
                          <span>Buy Now (UPI)</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="not-in-cart-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-sans font-bold text-xs text-gray-500 uppercase">Quantity:</span>
                        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 font-mono">
                          <button 
                            onClick={() => handleQuantityChange(-1)}
                            className="px-2.5 py-1 hover:bg-gray-200 rounded-lg text-gray-500 font-bold"
                          >
                            -
                          </button>
                          <span className="px-4 font-bold text-sm">{quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(1)}
                            className="px-2.5 py-1 hover:bg-gray-200 rounded-lg text-gray-500 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddToCart}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-50 hover:bg-blue-100 text-blue-600 font-sans font-bold text-sm rounded-xl active:scale-95 transition-all cursor-pointer"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          <span>Add to Cart</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleBuyNow}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-sans font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                        >
                          <Zap className="h-5 w-5" />
                          <span>Buy Now (UPI)</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-4 bg-gray-50 border border-gray-100 text-gray-400 font-sans font-bold text-sm text-center rounded-xl">
                Product Currently Out of Stock
              </div>
            )}
          </div>

          {/* Share & Wishlist row */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4 text-xs font-sans text-gray-400">
            <button
              onClick={() => toggleWishlist(product.id)}
              className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
            >
              <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>
            <span>•</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            >
              <Share2 className="h-4.5 w-4.5" />
              <span>Share Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Specifications, Features & Warranty */}
      <div className="mt-8 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-6">Product Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {Object.entries(product.specifications).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center border-b border-gray-50 pb-2 text-sm font-sans">
              <span className="text-gray-400">{key}</span>
              <span className="text-gray-800 font-medium">{val as string}</span>
            </div>
          ))}
          <div className="flex justify-between items-center border-b border-gray-50 pb-2 text-sm font-sans">
            <span className="text-gray-400">Warranty Details</span>
            <span className="text-blue-600 font-semibold">{product.warranty}</span>
          </div>
        </div>
      </div>

      {/* 4. Frequently Bought Together Bundle */}
      {fbtProduct && (
        <div className="mt-8 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-1">Frequently Bought Together</h3>
          <p className="font-sans text-xs text-gray-500 mb-6">Create a bundle with complementary items and save on checkout</p>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              {/* Product 1 */}
              <div className="flex items-center gap-3 bg-white p-3 border border-gray-100 rounded-2xl w-full sm:w-auto">
                <img src={product.images?.[0] || null} alt="Original" className="w-12 h-12 object-contain" />
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-xs text-gray-800 truncate max-w-[150px]">{product.name}</p>
                  <p className="font-mono text-xs font-bold text-blue-600">{formatINR(product.price)}</p>
                </div>
              </div>

              <span className="font-sans font-bold text-gray-400 text-lg">+</span>

              {/* Product 2 */}
              <div className="flex items-center gap-3 bg-white p-3 border border-gray-100 rounded-2xl w-full sm:w-auto">
                <img src={fbtProduct.images?.[0] || null} alt="FBT" className="w-12 h-12 object-contain" />
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-xs text-gray-800 truncate max-w-[150px]">{fbtProduct.name}</p>
                  <p className="font-mono text-xs font-bold text-blue-600">{formatINR(fbtProduct.price)}</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-white p-5 border border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2">
              <div className="text-center">
                <div className="font-sans text-xxs text-gray-400 uppercase">Bundle Total</div>
                <div className="font-mono text-lg font-extrabold text-gray-900">{formatINR(product.price + fbtProduct.price)}</div>
              </div>
              <button
                onClick={() => {
                  addToCart(product, 1);
                  addToCart(fbtProduct, 1);
                  showToast('Both items added to your cart successfully!', 'success');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
              >
                Add Both to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Customer Reviews section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Review list */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-6">Customer Reviews</h3>
          
          {loadingReviews ? (
            <div className="space-y-4">
              <Shimmer className="h-20" />
              <Shimmer className="h-20" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="font-sans text-sm text-gray-400">No approved reviews yet for this product. Be the first to leave one!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-sans font-bold text-sm text-gray-800">{rev.userName}</p>
                      <p className="font-mono text-xxs text-gray-400">{formatDate(rev.createdAt)}</p>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating ? 'fill-amber-400' : 'text-gray-150'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="font-sans text-sm text-gray-600 mt-2.5 leading-relaxed">{rev.comment}</p>
                  {rev.images && rev.images.length > 0 && (
                    <img src={rev.images[0]} alt="Review Attachment" className="w-16 h-16 object-cover rounded-xl mt-3 border border-gray-100" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="font-sans font-extrabold text-lg text-gray-800 mb-4">Write a Review</h3>
          {currentUser ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Rating selection */}
              <div>
                <label className="block font-sans font-semibold text-xs text-gray-500 uppercase mb-1.5">Rating</label>
                <div className="flex gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    >
                      <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div>
                <label className="block font-sans font-semibold text-xs text-gray-500 uppercase mb-1.5">Your Experience</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about packaging, product performance, or quality..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>

              {/* Review image attachment URL */}
              <div>
                <label className="block font-sans font-semibold text-xs text-gray-500 uppercase mb-1.5">Optional Image URL</label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={reviewImageUrl}
                    onChange={(e) => setReviewImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Success message */}
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 font-sans text-xs rounded-xl border border-emerald-100">
                  {reviewSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-500/10 transition-all flex justify-center"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-50">
              <p className="font-sans text-sm text-gray-500 mb-4">Please log in to submit your product experience.</p>
              <Link
                to="/profile"
                className="inline-flex px-5 py-2.5 bg-blue-600 text-white font-sans font-bold text-xs rounded-xl shadow-md"
              >
                Login Now
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* 6. Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h3 className="font-sans font-extrabold text-xl text-gray-900 tracking-tight mb-6 sm:mb-8">Related Products</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
