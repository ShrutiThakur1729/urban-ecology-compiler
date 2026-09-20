import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Urban Ecology Compiler | Geospatial AI Environmental Decision Support',
  description: 'Give a city its environmental requirements. We compile a feasible ecological plan using real satellite telemetry and constraint-aware spatial optimization.',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 antialiased dark">
      <body className="h-full flex flex-col overflow-hidden bg-slate-950 font-sans">
        {children}
      </body>
    </html>
  );
}
