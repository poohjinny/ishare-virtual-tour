'use client';

import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position='bottom-right'
      closeButton
      offset={16}
      gap={10}
      visibleToasts={4}
      className='admin-toaster'
      icons={{
        success: <CircleCheck aria-hidden='true' />,
        info: <Info aria-hidden='true' />,
        warning: <TriangleAlert aria-hidden='true' />,
        error: <CircleX aria-hidden='true' />,
        loading: <LoaderCircle aria-hidden='true' className='animate-spin' />,
        close: <X aria-hidden='true' />,
      }}
      toastOptions={{
        classNames: {
          toast: 'admin-toast',
          title: 'admin-toast-title',
          description: 'admin-toast-description',
          icon: 'admin-toast-icon',
          closeButton: 'admin-toast-close',
          actionButton: 'admin-toast-action',
          cancelButton: 'admin-toast-cancel',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--card-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
}
