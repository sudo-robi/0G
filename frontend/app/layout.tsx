import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectButton } from "./components/ConnectButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "0G Verifiable AI Marketplace",
  description: "The trust layer for decentralized intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-[#050505] text-white">
            <header className="border-b border-white/10 py-6 px-8 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">0G <span className="text-blue-500">Inference</span></h1>
              </div>
              <nav className="flex items-center gap-6">
                <a href="/" className="text-sm font-medium hover:text-blue-400 transition-colors">Marketplace</a>
                <a href="/history" className="text-sm font-medium text-white/50 hover:text-white transition-colors">History</a>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/70">
                  0G Galileo Testnet
                </div>
                <ConnectButton />
              </nav>
            </header>
            <main>
              {children}
            </main>
            <footer className="border-t border-white/10 py-8 px-8 mt-20 text-center text-white/30 text-sm">
              &copy; 2026 0G Intelligence. Built on Zero Gravity.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
