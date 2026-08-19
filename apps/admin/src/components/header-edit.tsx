'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  TOUR_EDIT_QUERY_KEY,
  TOUR_EDIT_QUERY_VALUE,
} from '@/lib/admin-routes';

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
    if (next) return;
    if (clearHref) {
      router.replace(clearHref, { scroll: false });
      return;
    }
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(TOUR_EDIT_QUERY_KEY) !== TOUR_EDIT_QUERY_VALUE) {
      return;
    }
    url.searchParams.delete(TOUR_EDIT_QUERY_KEY);
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }

  return (
    <HeaderEditContext.Provider value={{ canEdit, open, setOpen }}>
      {children}
    </HeaderEditContext.Provider>
  );
}

/** Opens the workspace Edit sheet from Guide `?edit=tour` without remounting chrome. */
export function HeaderEditIntent({ active }: { active: boolean }) {
  const ctx = useHeaderEdit();

  useEffect(() => {
    if (active) ctx?.setOpen(true);
    // ctx identity changes each provider render; only the query flag should open.
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps -- query flag only

  return null;
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
