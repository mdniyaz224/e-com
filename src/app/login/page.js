'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAuthModalOpen, openAuthModal } = useAuth();

  const redirectUrl = searchParams ? searchParams.get('redirect') || '/account' : '/account';
  const mode = searchParams && searchParams.get('signup') === 'true' ? 'signup' : 'login';

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    } else if (!isAuthModalOpen) {
      openAuthModal(mode, redirectUrl);
    }
  }, [isAuthenticated, isAuthModalOpen, openAuthModal, redirectUrl, mode, router]);

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCardWrapper}>
        <AuthModal />
        <div className={styles.guestBanner}>
          Looking to continue shopping?
          <button
            onClick={() => router.push('/')}
            className={styles.guestLink}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Explore Deals & Categories →
          </button>
        </div>
      </div>
    </div>
  );
}

