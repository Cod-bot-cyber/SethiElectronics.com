import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Star, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { getBreadcrumbSchema } from '../lib/seoData';

export default function Search() {
  const { products, categories } = useApp();
  const [query, setQuery] = useState<string>('');

  const filteredProducts = query.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.brand.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase())
      );

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <SEO
        title={query ? `Search results for "${query}" | SethiElectronicsOnline` : "Search Products | SethiElectronicsOnline"}
        description="Search our full database of genuine, top-brand home appliances including geysers, induction cooktops, fans, and mixers."
        keywords="Sethi Electronics product search, buy kitchen appliances, search electronics"
        jsonLd={[
          getBreadcrumbSchema(breadcrumbs)
        ]}
      />
      
      {/* Search Input Box */}
      <div className="max-w-2xl mx-auto text-center space-y-6 mb-12 sm:mb-16">
        <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
          Search Sethi Electronics Online
        </h1>
        <p className="font-sans text-xs sm:text-sm text-gray-500">
          Find genuine high-quality cooling fans, air coolers, mixers, and more at wholesale pricing.
        </p>

        <div className="relative">
          <input
            type="text"
            placeholder="Type brand, category, or product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-150 focus:border-blue-500 rounded-2xl font-sans text-sm focus:outline-none shadow-sm transition-colors"
          />
          <SearchIcon className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {query.trim() === '' ? (
        /* Categories and Popular suggestions suggestions when search is empty */
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h3 className="font-sans font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">Browse Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="flex items-center justify-between p-4 bg-white border border-gray-150 rounded-xl hover:border-blue-100 shadow-xs hover:shadow-md transition-all group"
                >
                  <span className="font-sans font-bold text-xs text-gray-700 group-hover:text-blue-600 truncate">{cat.name}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-sans font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2.5">
              {['Bajaj Coolers', 'Philips Mixer', 'Usha Fan', 'Havells Geyser', 'Pigeon Cooktop', 'Syska Bulb'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3.5 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-150 hover:border-blue-100 rounded-xl font-sans text-xs font-semibold text-gray-600 hover:text-blue-600 transition-all flex items-center gap-1.5"
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Search results layout */
        <div className="space-y-6">
          <div className="border-b border-gray-50 pb-4 mb-6 flex justify-between items-baseline">
            <h3 className="font-sans font-extrabold text-sm text-gray-500 uppercase">
              Search Results ({filteredProducts.length})
            </h3>
            <button onClick={() => setQuery('')} className="font-sans text-xs text-blue-600 hover:underline">Clear Search</button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center p-12 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <p className="font-sans text-sm text-gray-400 font-semibold mb-2">No matching products found.</p>
              <p className="font-sans text-xs text-gray-400">Please double check spelling or search with generic terms (e.g., "fan", "cooler").</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
