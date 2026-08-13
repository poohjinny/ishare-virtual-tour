import {
  Children,
  Fragment,
  isValidElement,
  type DragEventHandler,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { AccordionChevron } from '../ui/AccordionChevron';
import {
  devViewPanelSectionChevronClassName,
  devViewPanelSectionChevronOpenClassName,
  devViewPanelSectionClassName,
  devViewPanelSectionContentClassName,
  devViewPanelSectionDescriptionClassName,
  devViewPanelSectionHeaderClassName,
  devViewPanelSectionHeaderCollapsibleClassName,
  devViewPanelSectionLeadClassName,
  devViewPanelSectionTitleClassName,
} from './devViewPanelVariants';

export type DevPanelSectionProps = {
  title: string;
  description?: ReactNode;
  /** Leading control in the header (e.g. drag grip). Clicks should stopPropagation. */
  headerLeading?: ReactNode;
  /** Trailing controls in the header (e.g. actions). Clicks should stopPropagation. */
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDragLeave?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
};

function hasBlockDescriptionParagraphs(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;

  if (node.type === Fragment) {
    const fragment = node as ReactElement<{ children: ReactNode }>;
    return Children.toArray(fragment.props.children).some(
      (child) => isValidElement(child) && child.type === 'p',
    );
  }

  return node.type === 'p';
}

function renderSectionDescription(description: ReactNode): ReactNode {
  if (typeof description === 'string') {
    return <p className={devViewPanelSectionLeadClassName}>{description}</p>;
  }

  if (hasBlockDescriptionParagraphs(description)) {
    return description;
  }

  // Interactive / composite descriptions (e.g. group Up/Down) — avoid <p> wrapper.
  return <div className={devViewPanelSectionLeadClassName}>{description}</div>;
}

export function DevPanelSection({
  title,
  description,
  headerLeading,
  headerActions,
  children,
  className,
  collapsible = false,
  open = true,
  onToggle,
  onDragOver,
  onDragLeave,
  onDrop,
}: DevPanelSectionProps) {
  const descriptionBlock =
    description != null && description !== '' ?
      <div className={devViewPanelSectionDescriptionClassName}>
        {renderSectionDescription(description)}
      </div>
    : null;

  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!collapsible || !onToggle) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <section
      className={cn(devViewPanelSectionClassName, className)}
      data-open={
        collapsible ?
          open ?
            'true'
          : 'false'
        : 'true'
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header
        className={cn(
          devViewPanelSectionHeaderClassName,
          collapsible && devViewPanelSectionHeaderCollapsibleClassName,
          /* Multi-line lead: pin grip/chevron to the title row, not the block mid. */
          collapsible && descriptionBlock && 'items-start',
          collapsible && 'cursor-pointer select-none',
        )}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? open : undefined}
        aria-label={
          collapsible ?
            open ?
              `Collapse ${title}`
            : `Expand ${title}`
          : undefined
        }
        onClick={collapsible ? onToggle : undefined}
        onKeyDown={handleHeaderKeyDown}
      >
        {headerLeading ?
          <div
            className={cn(
              'flex shrink-0 items-center leading-none',
              descriptionBlock && 'mt-0.5',
            )}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {headerLeading}
          </div>
        : null}
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <h3 className={devViewPanelSectionTitleClassName}>{title}</h3>
          {descriptionBlock}
        </div>
        {headerActions ?
          <div
            className='flex shrink-0 items-center gap-1'
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {headerActions}
          </div>
        : null}
        {collapsible ?
          <AccordionChevron
            className={cn(
              devViewPanelSectionChevronClassName,
              open && devViewPanelSectionChevronOpenClassName,
            )}
          />
        : null}
      </header>
      {!collapsible || open ?
        <div
          data-section-content=''
          className={devViewPanelSectionContentClassName}
        >
          {children}
        </div>
      : null}
    </section>
  );
}
