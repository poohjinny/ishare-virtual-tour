import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AccordionExpandMode = 'single' | 'multiple';

interface AccordionContextValue {
  expandMode: AccordionExpandMode;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function AccordionProvider({
  expandMode,
  children,
}: {
  expandMode: AccordionExpandMode;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ expandMode, openId, setOpenId }),
    [expandMode, openId],
  );

  return (
    <AccordionContext.Provider value={value}>{children}</AccordionContext.Provider>
  );
}

export function useAccordionItemState(
  itemId: string,
  defaultOpen: boolean,
): {
  open: boolean;
  toggle: () => void;
} {
  const ctx = useContext(AccordionContext);
  const [localOpen, setLocalOpen] = useState(defaultOpen);

  const isSingle = ctx?.expandMode === 'single';

  useLayoutEffect(() => {
    if (!isSingle || !defaultOpen || !ctx) return;
    if (ctx.openId === null) {
      ctx.setOpenId(itemId);
    }
  }, [isSingle, defaultOpen, itemId, ctx]);

  if (isSingle && ctx) {
    const open = ctx.openId === itemId;
    return {
      open,
      toggle: () => {
        ctx.setOpenId(open ? null : itemId);
      },
    };
  }

  return {
    open: localOpen,
    toggle: () => {
      setLocalOpen((prev) => !prev);
    },
  };
}
