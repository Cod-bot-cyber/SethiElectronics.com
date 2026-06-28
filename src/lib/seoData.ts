export const SEO_BASE_URL = 'https://sethielectronicsonline.com';

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SEO_BASE_URL}/#organization`,
  'name': 'SethiElectronicsOnline',
  'url': SEO_BASE_URL,
  'logo': {
    '@type': 'ImageObject',
    'url': `${SEO_BASE_URL}/favicon.svg`
  },
  'sameAs': [
    'https://facebook.com/sethielectronics',
    'https://instagram.com/sethielectronics',
    'https://twitter.com/sethielectronics'
  ]
});

export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SEO_BASE_URL}/#local-business`,
  'name': 'Sethi Electronics',
  'image': `${SEO_BASE_URL}/favicon.svg`,
  'url': SEO_BASE_URL,
  'telephone': '+91-7060784706',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': 'Civil Lines, Opposite Railway Crossing',
    'addressLocality': 'Modinagar',
    'addressRegion': 'Uttar Pradesh',
    'postalCode': '201204',
    'addressCountry': 'IN'
  },
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': '28.8413',
    'longitude': '77.5852'
  },
  'openingHoursSpecification': {
    '@type': 'OpeningHoursSpecification',
    'dayOfWeek': [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ],
    'opens': '10:00',
    'closes': '20:30'
  },
  'priceRange': '₹₹'
});

export const getWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SEO_BASE_URL}/#website`,
  'name': 'SethiElectronicsOnline',
  'url': SEO_BASE_URL,
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': `${SEO_BASE_URL}/search?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
});

export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': `${SEO_BASE_URL}${item.url}`
  }))
});

export const getProductSchema = (product: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${SEO_BASE_URL}/products/${product.id}#product`,
  'name': product.name,
  'image': product.images?.[0] || `${SEO_BASE_URL}/favicon.svg`,
  'description': product.description,
  'brand': {
    '@type': 'Brand',
    'name': product.brand
  },
  'category': product.category,
  'offers': {
    '@type': 'Offer',
    'url': `${SEO_BASE_URL}/products/${product.id}`,
    'priceCurrency': 'INR',
    'price': product.price,
    'priceValidUntil': '2027-12-31',
    'itemCondition': 'https://schema.org/NewCondition',
    'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  },
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': product.rating || 4.5,
    'reviewCount': product.reviewsCount || 10
  }
});
