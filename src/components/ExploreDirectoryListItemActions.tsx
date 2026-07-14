import type { ReactNode } from 'react';
import {
  tourNavDirectoryListItemActionsClassName,
  tourNavDirectoryListItemActionsInnerClassName,
  tourNavDirectoryListItemActionsRowClassName,
} from './tourNavFloatVariants';

interface ExploreDirectoryListItemActionsProps {
  children: ReactNode;
}

/** Hover-expand action row — height owned by the list-item body grid. */
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
