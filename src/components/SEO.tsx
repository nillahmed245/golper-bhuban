import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export default function SEO({ 
  title, 
  description, 
  ogTitle, 
  ogDescription, 
  ogImage, 
  canonical,
  noindex = false,
  type = 'website',
  storyData
}: SEOProps & { type?: 'website' | 'article', storyData?: any }) {
  const siteName = "গল্পের ভুবন (Golper Bhuban)";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const fullDescription = description || "A premium Bengali story community platform for reading, writing, and sharing stories.";
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const currentUrl = canonical || (window.location.origin + window.location.pathname);
  
  useEffect(() => {
    document.title = fullTitle;
    
    // Standard Meta
    const updateMeta = (name: string, content: string, isProperty = false) => {
      let el = document.querySelector(isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', fullDescription);
    updateMeta('og:title', ogTitle || fullTitle, true);
    updateMeta('og:description', ogDescription || fullDescription, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', siteName, true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', ogTitle || fullTitle);
    updateMeta('twitter:description', ogDescription || fullDescription);

    if (ogImage) {
      updateMeta('og:image', ogImage, true);
      updateMeta('twitter:image', ogImage);
    }

    // Robots
    updateMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = currentUrl;

    // Structured Data (Schema.org)
    const existingSchema = document.getElementById('schema-org');
    if (existingSchema) existingSchema.remove();

    if (storyData && type === 'article') {
      const script = document.createElement('script');
      script.id = 'schema-org';
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": storyData.title,
        "description": storyData.description,
        "author": {
          "@type": "Person",
          "name": storyData.authorName
        },
        "datePublished": storyData.createdAt,
        "image": ogImage || (appUrl + '/src/assets/images/story_cover_placeholder_1790797553347.jpg'),
        "publisher": {
          "@type": "Organization",
          "name": siteName,
          "logo": {
            "@type": "ImageObject",
            "url": appUrl + "/logo.png"
          }
        }
      });
      document.head.appendChild(script);
    }
  }, [fullTitle, fullDescription, ogTitle, ogDescription, ogImage, currentUrl, noindex, type, storyData]);

  return null;
}
