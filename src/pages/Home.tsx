import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Zap, Sparkles, Star, TrendingUp, ChevronLeft, ChevronRight, Award, Truck, BadgePercent } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Shimmer';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import { getOrganizationSchema, getLocalBusinessSchema, getWebsiteSchema } from '../lib/seoData';

export default function Home() {
  const { products, categories, offers, websiteSettings } = useApp();
  const navigate = useNavigate();

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);

  const banners = websiteSettings?.homepageBanners || [];

  // Auto scroll carousel
  useEffect(() => {
    if (banners.length <= 1 || isHoveringCarousel) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isHoveringCarousel]);

  // Handle Dynamic Navbar Color Reflection Effect
  useEffect(() => {
    if (banners.length === 0) return;
    const reflectionColors = [
      'rgba(37, 99, 235, 0.28)',   // Indigo/Blue
      'rgba(245, 158, 11, 0.28)',  // Warm Amber
      'rgba(168, 85, 247, 0.28)',  // Purple
      'rgba(236, 72, 153, 0.28)',  // Vibrant Pink
      'rgba(16, 185, 129, 0.28)',  // Mint Green
    ];
    const targetColor = reflectionColors[currentSlide % reflectionColors.length];
    document.documentElement.style.setProperty('--navbar-reflection', targetColor);
    
    return () => {
      document.documentElement.style.removeProperty('--navbar-reflection');
    };
  }, [currentSlide, banners.length]);

  // Filter products by states
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const trendingProducts = products.filter(p => p.isTrending).slice(0, 4);

  const popularBrands = websiteSettings?.popularBrands || [];

  const highlights = websiteSettings?.highlightCards || [];

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="h-6 w-6 text-blue-600" />;
      case 'shield':
        return <Shield className="h-6 w-6 text-emerald-600" />;
      case 'award':
      default:
        return <Award className="h-6 w-6 text-amber-600" />;
    }
  };

  const getIconBgClass = (type: string) => {
    switch (type) {
      case 'truck':
        return 'bg-blue-50';
      case 'shield':
        return 'bg-emerald-50';
      case 'award':
      default:
        return 'bg-amber-50';
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16">
      <SEO
        title="SethiElectronicsOnline | Home Appliances & Electronics Store"
        description="Buy genuine Bajaj, Philips, Havells, Pigeon fans, geysers, mixers, coolers and home appliances from SethiElectronicsOnline with trusted service and secure UPI payment."
        keywords="Sethi Electronics, SethiElectronicsOnline, Home Appliances, Electronics Store, Bajaj, Philips, Havells, Pigeon, Modinagar"
        jsonLd={[
          getOrganizationSchema(),
          getLocalBusinessSchema(),
          getWebsiteSchema()
        ]}
      />

      {/* Flipkart-style Horizontal Scroll Categories Row (Directly below Navbar) */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="w-full bg-white border-b border-gray-100/90 shadow-sm py-2 px-4 overflow-x-auto scrollbar-none flex items-start justify-start sm:justify-center gap-2 sm:gap-4 md:gap-6">
        {categories.filter(c => c.enabled).map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.id}`}
            className="flex flex-col items-center flex-shrink-0 w-[74px] sm:w-[96px] text-center group py-1.5 transition-transform duration-200 active:scale-95"
          >
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-gradient-to-tr from-blue-50 to-indigo-50/50 border border-gray-150/40 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400 group-hover:shadow-md">
              {cat.image && !cat.image.includes('unsplash.com') ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-sans font-extrabold text-blue-600 text-sm sm:text-base tracking-tight select-none">
                  {cat.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="font-sans font-bold text-[10px] sm:text-xs text-gray-600 mt-1.5 group-hover:text-blue-600 transition-colors text-center line-clamp-2 leading-tight px-1">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
      
      {/* 1. Hero Banner Carousel - Completely fitted full-bleed image optimized for all devices */}
      {banners.length > 0 && (
        <section 
          className="relative h-[180px] xs:h-[220px] sm:h-[320px] md:h-[420px] lg:h-[500px] w-full bg-gray-100 overflow-hidden shadow-sm"
          onMouseEnter={() => setIsHoveringCarousel(true)}
          onMouseLeave={() => setIsHoveringCarousel(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={banners[currentSlide] || null}
                alt={`Promo Banner ${currentSlide + 1}`}
                className="w-full h-full object-cover object-center select-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>

          {/* Elegant Glassmorphic Shop Now Button Floating Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-end justify-start p-4 xs:p-6 sm:p-10 lg:p-16">
            <Link
              to="/products"
              className="pointer-events-auto relative overflow-hidden px-4 py-2 sm:px-6 sm:py-3.5 bg-white/20 hover:bg-white/30 text-white font-sans font-bold text-[10px] sm:text-xs tracking-wider uppercase rounded-full backdrop-blur-md border border-white/25 shadow-lg shadow-black/10 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group/btn"
            >
              {/* Ambient inner soft glowing light */}
              <span className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              
              {/* Sweep light reflecting effect */}
              <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                <span className="absolute -inset-y-4 -inset-x-12 w-8 bg-white/20 blur-sm transform rotate-30 animate-[sweep_3s_infinite_ease-in-out]" />
              </span>
              
              <span>Shop Now</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Small, elegant dots indicators at the bottom center */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === index ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/45 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. Today's Deals section */}
      {websiteSettings?.promoCards?.length ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
          <PromoCarousel cards={websiteSettings.promoCards} />
        </section>
      ) : null}

      {/* 4. Best Selling Products (Reflective shine cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        <div className="flex justify-between items-baseline mb-6 sm:mb-8">
          <div>
            <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight flex items-center gap-2">
              <Award className="h-5.5 w-5.5 text-amber-500" />
              <span>Best Selling Products</span>
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-500 mt-1">
              Top reviewed appliances trending this week
            </p>
          </div>
          <Link to="/products" className="font-sans text-xs sm:text-sm font-bold text-blue-600 hover:underline">
            View All
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestSellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} isFeatured />
            ))}
          </div>
        )}
      </section>

      {/* 5. Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        <div className="flex justify-between items-baseline mb-6 sm:mb-8">
          <div>
            <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5.5 w-5.5 text-blue-500" />
              <span>Trending Products</span>
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-500 mt-1">
              Most clicked and popular appliances in our Modinagar showroom
            </p>
          </div>
          <Link to="/products" className="font-sans text-xs sm:text-sm font-bold text-blue-600 hover:underline">
            View All
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Popular Brands Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        <div className="mb-6 sm:mb-8 text-center md:text-left">
          <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-gray-900 tracking-tight">
            Popular Electronics Brands
          </h2>
          <p className="font-sans text-xs sm:text-sm text-gray-500 mt-1">
            Shop authentic products from premium certified brands with original brand warranty
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 bg-white border border-gray-100 rounded-3xl p-5 sm:p-8 shadow-sm">
          {popularBrands.map((brand) => (
            <Link
              key={brand}
              to={`/products?brand=${brand}`}
              className="flex items-center justify-center py-4 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-50 hover:border-blue-100 transition-all font-sans font-extrabold text-gray-600 hover:text-blue-600 tracking-widest text-sm truncate px-2 uppercase"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>
 
      {/* 7. Store Highlights - Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {highlights.map((card, idx) => (
            <div key={idx} className="flex gap-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className={`p-3 rounded-xl shrink-0 h-fit ${getIconBgClass(card.iconType)}`}>
                {getIconComponent(card.iconType)}
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-gray-800">{card.title}</h4>
                <p className="font-sans text-xs text-gray-500 mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

const defaultPromoCards = [
  {
    badge: 'LIMITED OFFER',
    title: 'Up to 50% Off On Induction Cooktops & Kettles',
    description: 'Order online today and pay securely with UPI to verify immediate order dispatch with invoice.',
    buttonText: 'Shop Deals Now',
    buttonLink: '/products',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-red-600'
  }
];

function PromoCarousel({ cards }: { cards: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (cards.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [cards.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div 
      className="relative overflow-hidden rounded-3xl group shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cards Slider Wrapper */}
      <div className="relative min-h-[250px] min-[400px]:min-h-[220px] min-[540px]:min-h-[190px] sm:min-h-[220px]">
        <AnimatePresence mode="wait">
          {cards.map((card, idx) => {
            if (idx !== activeIndex) return null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`absolute inset-0 bg-gradient-to-r ${card.gradientFrom || 'from-blue-600'} ${card.gradientTo || 'to-indigo-600'} p-5 sm:p-8 text-white flex flex-col justify-center`}
              >
                {/* Floating ambient shape */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -inset-y-12 -inset-x-20 w-40 bg-white/10 blur-2xl transform rotate-30 animate-[sweep_6s_infinite_ease-in-out]" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div className="max-w-xl space-y-1 sm:space-y-2">
                    {card.badge && (
                      <span className="inline-flex items-center gap-1 bg-white/20 border border-white/25 text-white font-sans text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        <BadgePercent className="h-3.5 w-3.5" />
                        {card.badge}
                      </span>
                    )}
                    <h3 className="font-sans font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-tight leading-tight pt-1">
                      {card.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-white/95 leading-relaxed max-w-lg">
                      {card.description}
                    </p>
                  </div>
                  <Link
                    to={card.buttonLink || '/products'}
                    className="relative overflow-hidden px-4 py-2 sm:px-5 sm:py-2.5 bg-white/20 hover:bg-white/35 text-white font-sans font-extrabold text-[10px] sm:text-xs tracking-wider uppercase rounded-full backdrop-blur-md border border-white/25 shadow-md shadow-black/10 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group/btn self-start md:self-auto shrink-0 mt-2 md:mt-0"
                  >
                    {/* Ambient inner soft glowing light */}
                    <span className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    
                    {/* Sweep light reflecting effect */}
                    <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                      <span className="absolute -inset-y-4 -inset-x-12 w-8 bg-white/20 blur-sm transform rotate-30 animate-[sweep_3s_infinite_ease-in-out]" />
                    </span>

                    <span>{card.buttonText || 'Shop Now'}</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Carousel navigation arrow keys (Only visible if there is more than 1 card) */}
      {cards.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/15 hover:bg-black/35 text-white/95 transition-all duration-200 active:scale-95 focus:outline-none z-20 opacity-0 group-hover:opacity-100"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/15 hover:bg-black/35 text-white/95 transition-all duration-200 active:scale-95 focus:outline-none z-20 opacity-0 group-hover:opacity-100"
            aria-label="Next Banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicators / Progress dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
