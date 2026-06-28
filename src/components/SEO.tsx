import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export default function SEO({
  title,
  description,
  keywords,
  image = '',
  url,
  type = 'website',
  jsonLd
}: SEOProps) {
  useEffect(() => {
    // 1. Title
    const finalTitle = title.includes('SethiElectronicsOnline') 
      ? title 
      : `${title} | SethiElectronicsOnline`;
    document.title = finalTitle;

    // Helper to get or create element
    const getOrCreateMeta = (attrName: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    // 2. Standard Metas
    getOrCreateMeta('name', 'description', description);
    if (keywords) {
      getOrCreateMeta('name', 'keywords', keywords);
    }

    // 3. Open Graph
    getOrCreateMeta('property', 'og:title', finalTitle);
    getOrCreateMeta('property', 'og:description', description);
    getOrCreateMeta('property', 'og:image', image);
    getOrCreateMeta('property', 'og:type', type);
    
    const currentUrl = url || window.location.href;
    getOrCreateMeta('property', 'og:url', currentUrl);

    // 4. Twitter Cards
    getOrCreateMeta('name', 'twitter:card', 'summary_large_image');
    getOrCreateMeta('name', 'twitter:title', finalTitle);
    getOrCreateMeta('name', 'twitter:description', description);
    getOrCreateMeta('name', 'twitter:image', image);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 6. JSON-LD Structured Data
    // Remove old sethi-jsonld scripts
    const oldScripts = document.querySelectorAll('script[data-seo="sethi-jsonld"]');
    oldScripts.forEach(s => s.remove());

    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      schemas.forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'sethi-jsonld');
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }
  }, [title, description, keywords, image, url, type, jsonLd]);

  return null;
}
