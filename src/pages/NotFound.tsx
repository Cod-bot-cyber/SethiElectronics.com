import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Home, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { formatINR } from '../lib/utils';

export default function NotFound() {
  const { products, categories } = useApp();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal)}`);
    }
  };

  // Get 3 popular/featured products to help user discover
  const popularProducts = products.filter(p => p.isFeatured || p.isBestSeller).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center space-y-12">
      <SEO
        title="Page Not Found | SethiElectronicsOnline"
        description="The page you are looking for could not be found. Explore our premium household appliances, fans, geysers, and coolers on SethiElectronicsOnline."
        keywords="Sethi Electronics 404, page not found, electronics store Modinagar"
      />

      {/* Hero 404 Warning */}
      <div className="space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center bg-amber-50 text-amber-500 rounded-full mb-2">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-gray-900 tracking-tight">404 - Page Not Found</h1>
        <p className="font-sans text-sm sm:text-base text-gray-500 max-w-lg mx-auto">
          We couldn't find the page you are looking for. It might have been moved or doesn't exist anymore.
        </p>
      </div>

      {/* Interactive Search Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto relative">
        <input
          type="text"
          placeholder="Search for products, brands or categories..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full px-5 py-3.5 pl-12 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white font-sans font-bold text-xs rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Popular Categories Links */}
      <div className="space-y-3">
        <h3 className="font-sans font-bold text-xs text-gray-400 uppercase tracking-wider">Browse Popular Categories</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 font-sans text-xs font-bold rounded-xl transition-all"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Suggested Products Block */}
      {popularProducts.length > 0 && (
        <div className="pt-6 space-y-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 text-blue-600 font-sans font-extrabold text-sm uppercase tracking-wider">
            <Sparkles className="h-4.5 w-4.5" />
            <span>Popular Picks For You</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {popularProducts.map((prod) => (
              <Link
                key={prod.id}
                to={`/products/${prod.id}`}
                className="group flex flex-col bg-white border border-gray-100 rounded-2xl p-4 text-left hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-square w-full bg-gray-50 rounded-xl overflow-hidden mb-3">
                  <img
                    src={prod.images?.[0]}
                    alt={prod.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-all duration-550"
                  />
                </div>
                <h4 className="font-sans font-bold text-xs text-gray-800 line-clamp-2 h-8 group-hover:text-blue-600 transition-colors">
                  {prod.name}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <span className="font-mono font-bold text-xs text-blue-600">{formatINR(prod.price)}</span>
                  <span className="text-[10px] font-sans font-bold text-gray-400 uppercase group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation CTA */}
      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          <Home className="h-4.5 w-4.5" />
          <span>Back to Homepage</span>
        </Link>
      </div>
    </div>
  );
}
