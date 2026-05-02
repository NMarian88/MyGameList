import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { PostHogProvider } from './components/PostHogProvider';
import { PostHogPageView } from './components/PostHogPageView';
import { Suspense } from 'react';
import AIWidget from './components/AIWidget';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyGameList",
  description: "Proiect Web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <ClerkProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
          <PostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            {children}
            <AIWidget/>
          </PostHogProvider>
          <Toaster position="bottom-right" theme="dark" />
          </body>
        </html>
      </ClerkProvider>

  );
}
