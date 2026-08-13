import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Section open indices for Dev tab accordions. Lives on the long-lived
 * DevViewPanel so tab switches (which unmount tab panels) do not reset expand
 * state — no module-level remember store needed.
 */
type DevPanelSectionPersistApi = {
  read: (key: string) => number[] | undefined;
  write: (key: string, openIndices: number[]) => void;
};

const DevPanelSectionPersistContext =
  createContext<DevPanelSectionPersistApi | null>(null);

export function DevPanelSectionPersistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [byKey, setByKey] = useState<Record<string, number[]>>({});

  const read = useCallback(
    (key: string) => byKey[key],
    [byKey],
  );

  const write = useCallback((key: string, openIndices: number[]) => {
    const normalized = openIndices
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((a, b) => a - b);
    setByKey((prev) => {
      const prevVal = prev[key];
      if (
        prevVal &&
        prevVal.length === normalized.length &&
        prevVal.every((value, index) => value === normalized[index])
      ) {
        return prev;
      }
      return { ...prev, [key]: normalized };
    });
  }, []);

  const api = useMemo(() => ({ read, write }), [read, write]);

  return (
    <DevPanelSectionPersistContext.Provider value={api}>
      {children}
    </DevPanelSectionPersistContext.Provider>
  );
}

export function useDevPanelSectionPersist(): DevPanelSectionPersistApi | null {
  return useContext(DevPanelSectionPersistContext);
}
