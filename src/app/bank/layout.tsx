import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Z3C Bank Product Demo | ZATCA Middleware',
  description: 'Bank side product demo showcasing middleware API integration',
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
