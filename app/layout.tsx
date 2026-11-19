import type { Metadata } from "next";
import { Be_Vietnam_Pro, Inter, Lexend, Montserrat } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
});

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-lexend",
});

const montserrat = Montserrat({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Hệ Thống Trình Chiếu Gameshow",
  description: "Nền tảng tổ chức thi trắc nghiệm sân khấu chuyên nghiệp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${inter.variable} ${lexend.variable} ${montserrat.variable}`}
    >
      <body
        className="antialiased bg-slate-950 text-slate-100 selection:bg-cyan-400 selection:text-slate-950"
        style={{ fontFamily: "var(--font-be-vietnam), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
