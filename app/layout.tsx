import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './charts.css';

const inter = Inter({ subsets: ['latin'] });

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}