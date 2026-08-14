import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sign2graph",
  description: "Draw equations in the air and explore how they move.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
