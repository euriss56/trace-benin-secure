import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

export function AppLayout({ children }: { children: ReactNode }) {
  useRevealOnScroll();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
