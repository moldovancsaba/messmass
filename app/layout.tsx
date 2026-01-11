import type { Metadata, Viewport } from 'next';
import { Inter, Roboto, Poppins, Montserrat, Pacifico } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '../components/GoogleAnalytics';
import { HashtagDataProvider } from '../contexts/HashtagDataProvider';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

/* What: Load multiple Google Fonts for admin selection
   Why: Allows runtime font switching without full reload via CSS variables */
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // What: Minimize FOUT by showing fallback until font loads
});

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

/* What: Pacifico font for MessMass branding
   Why: User-requested font for logo text next to icon */
const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MessMass - Event Statistics Dashboard',
  description: 'Real-time collaborative event statistics tracking',
  keywords: ['Event Statistics', 'Real-time Collaboration', 'Dashboard', 'Next.js'],
  authors: [{ name: 'MessMass Team' }],
  icons: {
    icon: `/favicon.png?v=${Date.now()}`,
    apple: `/favicon.png?v=${Date.now()}`,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* WHAT: Read selected font from cookie for server-side rendering
     WHY: Minimizes FOUT by applying correct font immediately on page load */
  const cookieStore = await cookies();
  const selectedFont = cookieStore.get('mm_font')?.value || 'inter';
  
  /* WHAT: Fetch available fonts from database for dynamic font mapping
     WHY: Font list is managed in MongoDB, not hardcoded */
  let fontMap: Record<string, string> = {
    'inter': 'var(--font-inter)', // Default fallback
  };
  
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const fonts = await db.collection('available_fonts')
      .find({ isActive: true })
      .sort({ displayOrder: 1 })
      .toArray();
    
    // Build font map from database
    if (fonts.length > 0) {
      fontMap = {};
      fonts.forEach((font: any) => {
        const key = font.name.toLowerCase().replace(/\s+/g, '');
        fontMap[key] = font.fontFamily;
      });
    } else {
      // Use default fonts if database is empty
      const { DEFAULT_FONTS } = await import('@/lib/fontTypes');
      DEFAULT_FONTS.forEach(font => {
        const key = font.name.toLowerCase().replace(/\s+/g, '');
        fontMap[key] = font.fontFamily;
      });
    }
  } catch (error) {
    // WHAT: Fallback to default font map on error
    // WHY: Ensure page still renders even if database is unavailable
    console.error('Failed to load fonts from database, using defaults:', error);
    const { DEFAULT_FONTS } = await import('@/lib/fontTypes');
    DEFAULT_FONTS.forEach(font => {
      const key = font.name.toLowerCase().replace(/\s+/g, '');
      fontMap[key] = font.fontFamily;
    });
  }
  
  // WHAT: CSS variable --active-font set from cookie for server-side font selection
  // WHY: Enables instant font switching without client-side flash
  // WHAT: Dynamic CSS variable for active font - WHY: Font selection must be injected as CSS variable, cannot use CSS classes
  
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${roboto.variable} ${poppins.variable} ${montserrat.variable} ${pacifico.variable}`}
      data-font={selectedFont}
      // eslint-disable-next-line react/forbid-dom-props
      style={{ ['--active-font' as string]: fontMap[selectedFont] || fontMap.inter } as React.CSSProperties}
    >
      <head>
        {/* WHAT: Preconnect for Google Fonts domain resolution
            WHY: Establish connection before downloading any font resources
            HOW: DNS lookup and TCP handshake happen early in page load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* WHAT: Material Icons fonts loaded via stylesheet below
            WHY: Prevents FOIT (Flash of Invisible Text) on pages using icons
            HOW: Fonts load on-demand when stylesheet is parsed
            NOTE: Removed preload to avoid "preloaded but not used" warnings
                  The display=swap parameter ensures fallback text shows immediately */}
        
        {/* WHAT: Google Material Icons font families
            WHY: Replace emoji with Material Icons throughout the app
            HOW: Load all variants (base, outlined, round) with display=swap for performance
            NOTE: Material Icons must be loaded via stylesheet (not next/font/google)
                  because they are icon fonts requiring CSS class mapping.
                  App Router loads these globally (correct), but ESLint rule
                  @next/next/no-page-custom-font is designed for Pages Router only. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Icons&display=swap" 
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Icons+Outlined&display=swap" 
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Icons+Round&display=swap" 
          rel="stylesheet"
        />
        <GoogleAnalytics />
      </head>
      <body>
        <HashtagDataProvider>
          {children}
        </HashtagDataProvider>
      </body>
    </html>
  );
}
