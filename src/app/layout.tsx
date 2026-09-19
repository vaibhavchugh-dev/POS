import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { RESTAURANT_NAME, RESTAURANT_POS_TITLE } from "@/lib/brand";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const heading = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: RESTAURANT_POS_TITLE,
  description: `${RESTAURANT_NAME} counter POS — menu, ticket, and bills in ₹.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${sans.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
