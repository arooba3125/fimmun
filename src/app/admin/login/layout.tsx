import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - FIMMUN 2025',
  description: 'FIMMUN Admin Login',
  robots: 'noindex, nofollow',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

