'use client';

import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export function useSortableRows<T>(
  rows: T[],
  getValue: (row: T, key: string) => string | number,
  defaultKey?: string,
) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function toggle(key: string) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const left = getValue(a, sortKey);
      const right = getValue(b, sortKey);
      const cmp =
        typeof left === 'number' && typeof right === 'number' ?
          left - right
        : String(left).localeCompare(String(right), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
    // getValue is a per-table mapper; callers pass a stable inline function.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sort identity is key/dir/rows
  }, [rows, sortDir, sortKey]);

  return { rows: sorted, sortKey, sortDir, toggle };
}
