import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CampusOS AI — AI-Powered Career & Placement OS for Colleges',
  description:
    'One AI platform for resume analysis, skill gaps, internship matching, AI mock interviews, and placement readiness. Built for Indian colleges.',
  keywords: [
    'CampusOS',
    'AI placement',
    'college career platform',
    'mock interview AI',
    'skill gap analysis',
    'Indian college software',
  ],
  authors: [{ name: 'CampusOS AI' }],
  openGraph: {
    title: 'CampusOS AI',
    description: 'AI-powered career & placement OS for Indian colleges.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
