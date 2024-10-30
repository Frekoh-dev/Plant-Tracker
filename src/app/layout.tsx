import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import SettingsMenu from '@/components/SettingsMenu'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { SessionProvider } from "next-auth/react"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Plant Tracker",
  description: "Track and manage your plants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={inter.className}>
        <SessionProvider>
          <Providers>
            {children}
            <Toaster />
            <SettingsMenu />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  )
}