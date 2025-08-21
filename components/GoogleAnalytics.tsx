'use client';

// Google Analytics component for MessMass
// Handles client-side initialization of Google Analytics tracking
// Uses the provided GA measurement ID: G-19NWMWNH18

import Script from 'next/script';

export default function GoogleAnalytics() {
  return (
    <>
      {/* Google Analytics Script - async loading for performance */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-19NWMWNH18"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-19NWMWNH18');
          `,
        }}
      />
    </>
  );
}
