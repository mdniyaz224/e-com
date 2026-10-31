import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import AuthModal from '@/components/auth/AuthModal';

export const metadata = {
  title: 'PulseKart - Online Shopping for Electronics, Fashion & More',
  description: 'India\'s biggest online store for electronics, mobiles, fashion, appliances and more. Get the best deals, free delivery, and easy returns on PulseKart.',
  keywords: 'online shopping, electronics, mobiles, fashion, PulseKart',
};

import { Suspense } from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <div className="app-shell">
                <Suspense fallback={null}>
                  <TopBar />
                </Suspense>
                <main className="page-content">
                  <Suspense fallback={<div className="loading"><div className="spinner"></div></div>}>
                    {children}
                  </Suspense>
                </main>
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
                <AuthModal />
              </div>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
