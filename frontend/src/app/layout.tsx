import './globals.css';
import ReactQueryProvider from '@/components/ReactQueryProvider';
import { AuthProvider } from '@/hooks/useAuthContext';
import { getMeCached } from '@/services/auth.server';
import { Header } from '@/components/Header';
import { GeistSans } from 'geist/font/sans';

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getMeCached();

  return (
    <html lang="ru" className={GeistSans.className}>
      <body>
        <ReactQueryProvider>
          <AuthProvider initialUser={user}>
            <Header user={user} />
            <main>
              {children}
            </main>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
