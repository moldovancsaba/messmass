import type { Metadata, Viewport } from 'next';
import { Inter, Roboto, Poppins, Montserrat, Pacifico } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '../components/GoogleAnalytics';
import { HashtagDataProvider } from '../contexts/HashtagDataProvider';
import { cookies } from 'next/headers';

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
  /* What: Read selected font from cookie for server-side rendering
     Why: Minimizes FOUT by applying correct font immediately on page load */
  const cookieStore = await cookies();
  const selectedFont = cookieStore.get('mm_font')?.value || 'inter';
  
  /* What: Map font selection to CSS variable name
     Why: Allow runtime switching by changing data-font attribute */
  const fontMap: Record<string, string> = {
    'inter': 'var(--font-inter)',
    'roboto': 'var(--font-roboto)',
    'poppins': 'var(--font-poppins)',
    'montserrat': 'var(--font-montserrat)',
    'asroma': '"AS Roma", sans-serif',
  };
  
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${roboto.variable} ${poppins.variable} ${montserrat.variable} ${pacifico.variable}`}
      data-font={selectedFont}
      style={{ ['--active-font' as string]: fontMap[selectedFont] || fontMap.inter } as React.CSSProperties}
    >
      <head>
        {/* WHAT: Preconnect for Google Fonts domain resolution
            WHY: Establish connection before downloading any font resources
            HOW: DNS lookup and TCP handshake happen early in page load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* WHAT: Preload Material Icons fonts for instant availability
            WHY: Prevents FOIT (Flash of Invisible Text) on report pages
            HOW: Preload woff2 font files before stylesheet to prioritize loading
            NOTE: eslint-disable next line needed because Material Icons are not available via next/font/google */}
        {/* eslint-disable-next-line @next/next/google-font-preconnect */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/materialiconsoutlined/v110/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUce.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/google-font-preconnect */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/materialiconsround/v108/LDItaoyNOAY6Uewc665JcIzCKsKc_M9flwmP.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* WHAT: Google Material Icons font families
            WHY: Replace emoji with Material Icons throughout the app
            HOW: Load both Outlined and Rounded variants with display=swap for performance
            NOTE: Material Icons must be loaded via stylesheet (not next/font/google)
                  because they are icon fonts requiring CSS class mapping.
                  App Router loads these globally (correct), but ESLint rule
                  @next/next/no-page-custom-font is designed for Pages Router only. */}
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
