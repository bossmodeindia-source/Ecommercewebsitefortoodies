import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  author?: string;
  noindex?: boolean;
}

export function SEOHead({
  title = 'Toodies - Custom T-Shirts India | Design Your Own Clothing Online',
  description = 'Create custom t-shirts, oversized hoodies & streetwear with Toodies. Premium quality, 2D designer, fast delivery across India. Start designing now!',
  keywords = 'custom t shirt india, design your own t shirt, oversized t shirts india, custom clothing india, personalized t shirts, print on demand india, custom hoodie, streetwear india',
  canonicalUrl = 'https://toodies.com',
  ogImage = 'https://images.unsplash.com/photo-1756276900419-868625adff43?w=1200',
  ogType = 'website',
  author = 'Toodies',
  noindex = false
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', author);
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('theme-color', '#d4af37');

    // Robots
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph / Facebook
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:url', canonicalUrl, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:site_name', 'Toodies', true);
    setMetaTag('og:locale', 'en_IN', true);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:url', canonicalUrl);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:creator', '@toodies');

    // Additional SEO tags
    setMetaTag('language', 'English');
    setMetaTag('revisit-after', '7 days');
    setMetaTag('distribution', 'global');
    setMetaTag('rating', 'general');

    // Geo tags for India
    setMetaTag('geo.region', 'IN');
    setMetaTag('geo.placename', 'India');

    // Update or create canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Add structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://toodies.com/#organization',
          name: 'Toodies',
          url: 'https://toodies.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://toodies.com/logo.png'
          },
          description: 'Premium custom clothing brand in India specializing in personalized t-shirts, oversized hoodies, and luxury streetwear',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN'
          },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-98865-10858',
            contactType: 'customer service',
            areaServed: 'IN',
            availableLanguage: ['English', 'Hindi']
          },
          sameAs: [
            'https://www.instagram.com/toodies',
            'https://www.facebook.com/toodies',
            'https://twitter.com/toodies'
          ]
        },
        {
          '@type': 'WebSite',
          '@id': 'https://toodies.com/#website',
          url: 'https://toodies.com',
          name: 'Toodies',
          description: 'Design custom t-shirts and streetwear online with our advanced 2D designer tool',
          publisher: {
            '@id': 'https://toodies.com/#organization'
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://toodies.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }
      ]
    };

    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, canonicalUrl, ogImage, ogType, author, noindex]);

  return null;
}

// Google Analytics Component
export function GoogleAnalytics({ measurementId = 'G-XXXXXXXXXX' }: { measurementId?: string }) {
  useEffect(() => {
    // Only load if measurementId is provided and not placeholder
    if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
      console.log('⚠️ Google Analytics not configured. Add your Measurement ID.');
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);

    console.log('✅ Google Analytics loaded:', measurementId);
  }, [measurementId]);

  return null;
}

// Facebook Pixel Component
export function FacebookPixel({ pixelId = 'YOUR_PIXEL_ID' }: { pixelId?: string }) {
  useEffect(() => {
    if (!pixelId || pixelId === 'YOUR_PIXEL_ID') {
      console.log('⚠️ Facebook Pixel not configured. Add your Pixel ID.');
      return;
    }

    // Load Facebook Pixel
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Add noscript pixel
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    console.log('✅ Facebook Pixel loaded:', pixelId);
  }, [pixelId]);

  return null;
}
