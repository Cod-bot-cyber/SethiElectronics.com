import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Shimmer';
import SEO from '../components/SEO';
import { getBreadcrumbSchema } from '../lib/seoData';
import { formatINR } from '../lib/utils';

export default function Products() {
  const { products, categories } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Read query parameters on load (as optional fallback/convenience)
  useEffect(() => {
    const catParam = searchParams.get('category');
    const brandParam = searchParams.get('brand');
    
    if (catParam) setSelectedCategory(catParam);
    if (brandParam) setSelectedBrand(brandParam);
  }, [searchParams]);

  // Read state from location (from category link etc.)
  useEffect(() => {
    // If we have category in URL e.g. /category/kitchen-appliances, we parse from path
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'category' && pathParts[2]) {
      setSelectedCategory(pathParts[2]);
    }
  }, [location]);

  // Extract all brands
  const brandsList = Array.from(new Set(products.map(p => p.brand)));

  // Dynamic maximum range boundary for price filter slider based on products
  const maxLimit = products.length > 0 ? Math.max(30000, ...products.map(p => p.price)) : 100000;

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMaxPrice(100000);
    setMinDiscount(0);
    setOnlyInStock(false);
    setSortBy('popularity');
    setSearchParams({});
  };

  // Filter and Sort Logic
  const filteredProducts = products
    .filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (p.price > maxPrice) return false;
      if (p.discount < minDiscount) return false;
      if (onlyInStock && p.stock === 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.reviewsCount - a.reviewsCount; // Default popularity by reviews count
    });

  const activeCategoryObj = categories.find(c => c.id === selectedCategory);
  const pageTitle = selectedCategory === 'all' 
    ? 'All Home Appliances & Electronics' 
    : (activeCategoryObj?.name || selectedCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  const pageDescription = selectedCategory === 'all'
    ? 'Explore our full range of genuine home and kitchen appliances, geysers, air coolers, mixers, irons, and lighting at SethiElectronicsOnline.'
    : `Buy top quality ${pageTitle} online from SethiElectronicsOnline. Check prices, specs, and order online with secure UPI payment and full brand warranty.`;

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' }
  ];
  if (selectedCategory !== 'all') {
    breadcrumbItems.push({ name: pageTitle, url: `/category/${selectedCategory}` });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <SEO
        title={`${pageTitle} | SethiElectronicsOnline`}
        description={pageDescription}
        keywords={`Sethi Electronics, ${pageTitle}, buy ${pageTitle} online, home appliances, India`}
        jsonLd={[
          getBreadcrumbSchema(breadcrumbItems)
        ]}
      />
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <span className="font-sans font-extrabold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-4.5 w-4.5 text-blue-600" />
              Filters
            </span>
            <button 
              onClick={resetFilters} 
              className="font-sans text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h4 className="font-sans font-bold text-xs text-gray-700 uppercase mb-3">Category</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-blue-600 font-sans">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === 'all'}
                  onChange={() => setSelectedCategory('all')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>All Categories</span>
              </label>
              {categories.filter(c => c.enabled).map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-blue-600 font-sans">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(cat.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="mb-6 border-t border-gray-50 pt-5">
            <h4 className="font-sans font-bold text-xs text-gray-700 uppercase mb-3">Brand</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-blue-600 font-sans">
                <input
                  type="radio"
                  name="brand"
                  checked={selectedBrand === 'all'}
                  onChange={() => setSelectedBrand('all')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>All Brands</span>
              </label>
              {brandsList.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-blue-600 font-sans">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === brand}
                    onChange={() => setSelectedBrand(brand)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="mb-6 border-t border-gray-50 pt-5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-sans font-bold text-xs text-gray-700 uppercase">Max Price</h4>
              <span className="font-mono text-xs font-semibold text-blue-600">
                {maxPrice >= 100000 ? 'Any Price' : `₹${formatINR(maxPrice)}`}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max={maxLimit}
              step="500"
              value={maxPrice > maxLimit ? maxLimit : maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xxs font-mono text-gray-400 mt-1">
              <span>₹1,000</span>
              <span>₹{formatINR(maxLimit)}</span>
            </div>
          </div>

          {/* Discount Percentage */}
          <div className="mb-6 border-t border-gray-50 pt-5">
            <h4 className="font-sans font-bold text-xs text-gray-700 uppercase mb-3">Minimum Discount</h4>
            <div className="space-y-2">
              {[0, 10, 25, 40].map((disc) => (
                <label key={disc} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-blue-600 font-sans">
                  <input
                    type="radio"
                    name="discount"
                    checked={minDiscount === disc}
                    onChange={() => setMinDiscount(disc)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>{disc === 0 ? 'Any Discount' : `${disc}% and above`}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="border-t border-gray-50 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-blue-600 font-sans font-semibold">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>Exclude Out of Stock</span>
            </label>
          </div>
        </aside>

        {/* Product Catalog Content */}
        <main className="flex-1">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 mb-6 shadow-sm">
            <div>
              <h2 className="font-sans font-extrabold text-lg text-gray-900 tracking-tight">
                Electronics Showcase
              </h2>
              <p className="font-sans text-xs text-gray-500">
                Displaying {filteredProducts.length} premium electronics items
              </p>
            </div>

            {/* Sorting & Mobile Filter button */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-150 border border-gray-150 rounded-xl font-sans text-xs font-semibold text-gray-700 transition-colors"
              >
                <Filter className="h-4 w-4 text-blue-600" />
                <span>Filters</span>
              </button>

              <div className="flex-1 sm:flex-none relative flex items-center bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 shrink-0">
                <ArrowUpDown className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-sans text-xs font-bold text-gray-700 focus:outline-none cursor-pointer w-full"
                >
                  <option value="popularity">Sort By: Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Sort By: Rating</option>
                  <option value="newest">Sort By: Newest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {(selectedCategory !== 'all' || selectedBrand !== 'all' || minDiscount > 0 || onlyInStock) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 font-sans text-xs font-semibold rounded-full">
                  <span>Category: {selectedCategory}</span>
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 font-sans text-xs font-semibold rounded-full">
                  <span>Brand: {selectedBrand}</span>
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedBrand('all')} />
                </span>
              )}
              {minDiscount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 font-sans text-xs font-semibold rounded-full">
                  <span>Discount: &gt;={minDiscount}%</span>
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setMinDiscount(0)} />
                </span>
              )}
              {onlyInStock && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 font-sans text-xs font-semibold rounded-full">
                  <span>In Stock Only</span>
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setOnlyInStock(false)} />
                </span>
              )}
            </div>
          )}

          {/* Grid Layout */}
          {products.length === 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, idx) => (
                <ProductSkeleton key={idx} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <p className="font-sans text-sm text-gray-500 font-semibold mb-3">No products match your active filters.</p>
              <button 
                onClick={resetFilters}
                className="px-5 py-2 bg-blue-600 text-white font-sans font-bold text-xs rounded-xl shadow-md active:scale-95 transition-transform"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Filter panel */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          
          {/* Drawer */}
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-150 mb-6">
                <span className="font-sans font-extrabold text-sm text-gray-800 uppercase tracking-wider">Filters</span>
                <button onClick={() => setShowMobileFilters(false)} className="p-1 rounded-full bg-gray-50 hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Duplicate Filter items for Mobile Drawer */}
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-sans font-bold text-xs text-gray-700 uppercase mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="radio"
                        name="mobile-cat"
                        checked={selectedCategory === 'all'}
                        onChange={() => setSelectedCategory('all')}
                      />
                      <span>All Categories</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="radio"
                          name="mobile-cat"
                          checked={selectedCategory === cat.id}
                          onChange={() => setSelectedCategory(cat.id)}
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <h4 className="font-sans font-bold text-xs text-gray-700 uppercase mb-3">Brand</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="radio"
                        name="mobile-brand"
                        checked={selectedBrand === 'all'}
                        onChange={() => setSelectedBrand('all')}
                      />
                      <span>All Brands</span>
                    </label>
                    {brandsList.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="radio"
                          name="mobile-brand"
                          checked={selectedBrand === brand}
                          onChange={() => setSelectedBrand(brand)}
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-sans font-bold text-xs text-gray-700 uppercase">Max Price</h4>
                    <span className="font-mono text-xs font-semibold text-blue-600">
                      {maxPrice >= 100000 ? 'Any Price' : `₹${formatINR(maxPrice)}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max={maxLimit}
                    step="500"
                    value={maxPrice > maxLimit ? maxLimit : maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xxs font-mono text-gray-400 mt-1">
                    <span>₹1,000</span>
                    <span>₹{formatINR(maxLimit)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-150 flex gap-3 mt-8">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 bg-gray-50 border border-gray-150 hover:bg-gray-100 rounded-xl font-sans text-xs font-bold text-gray-500 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
