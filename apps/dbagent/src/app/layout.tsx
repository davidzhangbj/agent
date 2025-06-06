import '@internal/theme';
import { GeistSans } from 'geist/font/sans';
import { Metadata } from 'next';
// import { Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Providers } from '~/components/providers';
import './globals.css';
const geistMono = localFont({
  src: '../../public/fonts/GeistMono-VariableFont_wght.ttf', // 替换为你的字体文件路径
  variable: '--font-code'
});

export const metadata: Metadata = {
  title: 'Chat to OB | Your AI OceanBase expert'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" className={`${GeistSans.className} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
