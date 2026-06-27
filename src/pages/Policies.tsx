import React from 'react';
import { ShieldAlert, RefreshCw, Truck, Lock } from 'lucide-react';
import SEO from '../components/SEO';
import { getBreadcrumbSchema } from '../lib/seoData';

export default function Policies() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Policies', url: '/policies' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 font-sans">
      <SEO
        title="Privacy Policy & Return Policy | SethiElectronicsOnline"
        description="Read our store terms, return & refund protocols, and privacy policy at SethiElectronicsOnline. Ensuring trusted service and 100% genuine product guarantees."
        keywords="Sethi Electronics return policy, refund guidelines, privacy terms, secure shopping warranty"
        jsonLd={[
          getBreadcrumbSchema(breadcrumbs)
        ]}
      />
      
      <div className="text-center space-y-2">
        <h1 className="font-sans font-extrabold text-3xl text-gray-900 tracking-tight">
          Store Terms & Policies
        </h1>
        <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
          Please read our customer service protocols regarding shipping, returns, and digital security.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Policy 1: Return & Refund Policy */}
        <div className="flex gap-4 items-start pb-6 border-b border-gray-50">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <RefreshCw className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-800">1. Return & Exchange Policy</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              We offer a straightforward 15-day return or exchange policy on all home appliances. The product must remain unused, with its original brand tags, box, manual booklets, and warranty certificate intact. Once received back and checked by our showroom staff, refunds will be directly settled back into your original paying UPI address within 48 hours.
            </p>
          </div>
        </div>

        {/* Policy 2: Shipping & Logistics */}
        <div className="flex gap-4 items-start pb-6 border-b border-gray-50">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Truck className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-800">2. Reliable Delivery & Dispatch</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Upon successful administrative verification of your UPI transaction ID/Screenshot, we parcel-secure and dispatch packages within 24 hours. Transit times vary from 3 to 7 working days depending on PIN code delivery targets. Customers receive real-time updates containing safe Tracking numbers directly inside their profile dashboards.
            </p>
          </div>
        </div>

        {/* Policy 3: Data Protection & Privacy */}
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Lock className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-800">3. Secure Customer Data Protection</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              We highly secure customer names, addresses, phone numbers, and transactional receipts. Your delivery details are solely shared with authorized national freight logistics services. Sethi Electronics will never lease, peddle, or monetize your contact lists for advertising.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
