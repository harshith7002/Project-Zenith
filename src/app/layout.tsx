import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asme | Know it then all.",
  description: "Stay updated with the latest news and insights. Subscribe to our newsletter today and never miss out on exciting updates.",
  authors: [{ name: "Asme Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
