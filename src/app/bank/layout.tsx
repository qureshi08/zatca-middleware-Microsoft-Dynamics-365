import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bank CBS Demo | ZATCA Middleware',
  description: 'Bank core banking system demo consuming the ZATCA Middleware',
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
