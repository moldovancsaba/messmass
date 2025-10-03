import type { Metadata, Viewport } from 'next';
import { Inter, Roboto, Poppins } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'MessMass - Event Statistics Dashboard',
  description: 'Real-time collaborative event statistics tracking',
  keywords: ['Event Statistics', 'Real-time Collaboration', 'Dashboard', 'Next.js'],
  authors: [{ name: 'MessMass Team' }],
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
  };
  
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${roboto.variable} ${poppins.variable}`}
      data-font={selectedFont}
      style={{
        /* What: Set active font family from cookie selection
           Why: CSS variables enable instant font switching without reload */
        fontFamily: fontMap[selectedFont] || fontMap.inter,
      }}
    >
      <head>
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
