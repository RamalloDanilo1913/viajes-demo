import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Viajes Filial Capital Federal',
  description: 'Coordinación de traslados para seguir a Talleres',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-roboto bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
