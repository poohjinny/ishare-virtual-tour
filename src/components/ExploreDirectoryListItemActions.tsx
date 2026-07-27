import type { ReactNode } from 'react';
import {
  tourNavDirectoryListItemActionsClassName,
  tourNavDirectoryListItemActionsInnerClassName,
  tourNavDirectoryListItemActionsRowClassName,
} from './tourNavFloatVariants';

interface ExploreDirectoryListItemActionsProps {
  children: ReactNode;
}

/** Nested 0fr→1fr CTA reveal — height owned by this grid, not the row body. */
export function ExploreDirectoryListItemActions({
  children,
}: ExploreDirectoryListItemActionsProps) {
  return (
    <span className={tourNavDirectoryListItemActionsClassName}>
      <span className={tourNavDirectoryListItemActionsInnerClassName}>
        <span className={tourNavDirectoryListItemActionsRowClassName}>
          {children}
        </span>
      </span>
    </span>
  );
}
