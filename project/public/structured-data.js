// This script adds structured data to the page for better SEO
document.addEventListener('DOMContentLoaded', function() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "KAIDO",
    "url": "https://kaidobnb.xyz",
    "description": "Loss-Edge AI Agent Enhanced Prediction Market on BNB Chain",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "image": "https://kaidobnb.xyz/social-preview.png",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "KAIDO",
      "url": "https://kaidobnb.xyz",
      "logo": "https://kaidobnb.xyz/favicon.svg",
      "image": "https://kaidobnb.xyz/social-preview.png"
    },
    "potentialAction": {
      "@type": "UseAction",
      "target": "https://kaidobnb.xyz"
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(structuredData);
  document.head.appendChild(script);
});
