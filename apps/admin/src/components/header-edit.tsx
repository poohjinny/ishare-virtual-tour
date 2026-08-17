'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';

const HeaderEditContext = createContext<{
  canEdit: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

/** Lifts Edit into the page header (next to Live / Open website). */
export function HeaderEditProvider({
  canEdit,
  defaultOpen = false,
  clearHref,
  children,
}: {
  canEdit: boolean;
  defaultOpen?: boolean;
  /** When set, closing the sheet replaces the URL (Guide `?edit=tour` intents). */
  clearHref?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpenState] = useState(defaultOpen);

  function setOpen(next: boolean) {
    setOpenState(next);
    if (!next && clearHref) {
      router.replace(clearHref, { scroll: false });
    }
  }

  return (
    <HeaderEditContext.Provider value={{ canEdit, open, setOpen }}>
      {children}
    </HeaderEditContext.Provider>
  );
}

export function HeaderEditButton() {
  const ctx = useContext(HeaderEditContext);
  if (!ctx) return null;
  return (
    <Button size='sm' onClick={() => ctx.setOpen(true)}>
      <Pencil aria-hidden='true' />
      Edit
    </Button>
  );
}

export function useHeaderEdit() {
  return useContext(HeaderEditContext);
}
