import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "EduPlay - Smartboard Games",
  description: "Upload a PDF, generate questions, play on a smartboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <div className="premium-ambient-bg"></div>
        {children}
      </body>
    </html>
  );
}
