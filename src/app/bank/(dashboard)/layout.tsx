'use client';

import BankSidebar from '@/components/bank/BankSidebar';
import BankHeader from '@/components/bank/BankHeader';
import { useBankAuthStore } from '@/store/bankAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BankDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useBankAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/bank/login');
    }
  }, [isAuthenticated, router]);

  if (!mounted) return null;

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="bank-shell">
      <BankSidebar />
      <div className="bank-main">
        <BankHeader />
        <main className="bank-content">
          <div className="bank-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
