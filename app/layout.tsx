import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFlight ✈️",
  description: "최저가 항공권을 찾아드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}