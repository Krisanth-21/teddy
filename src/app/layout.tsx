import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'TeddyTalk AI',
  description: 'Talk to your AI-powered teddy bear.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Arial is a system font, no Google Fonts import is needed */}
      </head>
      <body className="h-full antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
