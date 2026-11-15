import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '{messmass} - Event Statistics Dashboard',
  description: 'Collaborative event statistics tracking and reporting',
  keywords: ['Event Statistics', 'Reporting', 'Dashboard', 'Next.js'],
  authors: [{ name: '{messmass} Team' }],
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
      <body>{children}</body>
    </html>
  );
}
