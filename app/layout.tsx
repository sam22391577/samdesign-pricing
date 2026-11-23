import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "設計報價試算｜Sam Design Studio",
  description: "用一分鐘對話整理設計需求、預算與交期，即時取得電商、社群、平面設計與月方案的費用區間。",
  openGraph: {
    title: "設計報價試算｜Sam Design Studio",
    description: "回答幾個簡單問題，立即取得透明的設計費用區間。",
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary",
    title: "設計報價試算｜Sam Design Studio",
    description: "回答幾個簡單問題，立即取得透明的設計費用區間。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
