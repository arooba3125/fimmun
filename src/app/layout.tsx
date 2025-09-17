import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FICMUN 2024 - Fazaia Inter College Minhas Model United Nations",
  description: "Join us for an extraordinary Model United Nations conference that brings together young leaders, diplomats, and change-makers from across the region. Experience the thrill of international diplomacy, engage in meaningful debates, and develop critical thinking skills.",
  keywords: "Model United Nations, MUN, FICMUN, Fazaia Inter College, diplomacy, international relations, debate, leadership",
  authors: [{ name: "FICMUN Organizing Committee" }],
  openGraph: {
    title: "FICMUN 2024 - Model United Nations Conference",
    description: "Diplomacy in Action • Leadership in Practice",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
