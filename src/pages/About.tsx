import React from 'react';
import { Award, ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import { getBreadcrumbSchema } from '../lib/seoData';

export default function About() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'About Us', url: '/about' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <SEO
        title="About Us | SethiElectronicsOnline"
        description="Learn more about Sethi Electronics. Serving genuine premium household appliances and electronics since 1979 in Modinagar with trusted support."
        keywords="Sethi Electronics showroom, genuine products, electronics retail Modinagar, appliances shop"
        jsonLd={[
          getBreadcrumbSchema(breadcrumbs)
        ]}
      />
      
      {/* Intro section */}
      <div className="text-center space-y-4">
        <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-gray-900 tracking-tight">
          About Sethi Electronics
        </h1>
        <p className="font-sans text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Serving genuine home appliances and high-end electronics since 1979. We are your trusted partner for premium households in Modinagar and across India.
        </p>
      </div>

      {/* Showroom Image or Hero Block */}
      <div className="relative h-64 sm:h-80 w-full bg-gray-900 rounded-3xl overflow-hidden shadow-md">
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80"
          alt="Showroom"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
          <div className="max-w-lg space-y-2">
            <MapPin className="h-8 w-8 mx-auto text-blue-400" />
            <h3 className="font-sans font-extrabold text-lg sm:text-xl">Our Modinagar Showroom</h3>
            <p className="font-sans text-xs text-gray-200">
              Visit our flagship retail brick-and-mortar store to view live product demonstrations and consult our customer care team directly.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-center space-y-3">
          <Award className="h-8 w-8 text-amber-500 mx-auto" />
          <h4 className="font-sans font-bold text-sm text-gray-800">Authorized Dealership</h4>
          <p className="font-sans text-xs text-gray-500 leading-relaxed">
            Directly sourced premium brands including Bajaj, Havells, Philips, and more with official company warranties.
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-center space-y-3">
          <ShieldCheck className="h-8 w-8 text-blue-500 mx-auto" />
          <h4 className="font-sans font-bold text-sm text-gray-800">Premium Quality Assured</h4>
          <p className="font-sans text-xs text-gray-500 leading-relaxed">
            All appliances undergo robust multi-point diagnostic checks before safe courier boxing.
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-center space-y-3">
          <Heart className="h-8 w-8 text-red-500 mx-auto" />
          <h4 className="font-sans font-bold text-sm text-gray-800">Customer Centric</h4>
          <p className="font-sans text-xs text-gray-500 leading-relaxed">
            Our hotline is available round-the-clock to coordinate order deliveries, warranty replacements, and queries.
          </p>
        </div>
      </div>

    </div>
  );
}
