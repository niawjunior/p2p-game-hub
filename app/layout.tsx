import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "P2P Games Hub",
  description: "A fun P2P game hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${kanit.variable} antialiased `}>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
              <p className="text-gray-700 text-lg font-medium">Loading...</p>
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
