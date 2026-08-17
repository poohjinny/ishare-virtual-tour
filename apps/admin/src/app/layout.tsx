import type { Metadata } from 'next';
import { Google_Sans_Flex, Roboto, Roboto_Mono } from 'next/font/google';

import { AdminChrome } from '@/components/admin-chrome';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ADMIN_ACCENT_BOOT_SCRIPT,
  ADMIN_ACCENT_DEFAULT,
} from '@/lib/admin-accent';
import { GUIDE_DOCK_BOOT_SCRIPT } from '@/lib/admin-guide-dock';
import { SIDEBAR_BOOT_SCRIPT } from '@/lib/admin-sidebar-rail';

import './globals.css';

const roboto = Roboto({ variable: '--font-roboto', subsets: ['latin'] });

const googleSansFlex = Google_Sans_Flex({
  variable: '--font-google-sans-flex',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'iShare Virtual Tour Admin',
  description: 'Manage iShare Virtual Tour drafts and publishing.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      className={`${roboto.variable} ${googleSansFlex.variable} ${robotoMono.variable} ishare-scrollbar h-full antialiased`}
      data-admin-accent={ADMIN_ACCENT_DEFAULT}
      data-chart-motion='hold'
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: ADMIN_ACCENT_BOOT_SCRIPT }}
        />
        <script dangerouslySetInnerHTML={{ __html: GUIDE_DOCK_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_BOOT_SCRIPT }} />
      </head>
      <body className='flex min-h-full flex-col'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AdminChrome>{children}</AdminChrome>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
