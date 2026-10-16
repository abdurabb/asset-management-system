import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

import ReduxProvider from "@/providers/ReduxProvider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import GuestGuard from "@/guards/GuastGuard";
import NavigateBinder from "@/components/NavigateBinder";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AssetFlow",
  description: "Company asset management system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReduxProvider>
          <ReactQueryProvider>
            <NavigateBinder />
            <GuestGuard>{children}</GuestGuard>
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </ReactQueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
