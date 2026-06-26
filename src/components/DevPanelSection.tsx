import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { AccordionChevron } from './ui/AccordionChevron';
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
  devViewPanelSectionChevronBtnClassName,
} from './devViewPanelVariants';

export type DevPanelSectionProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
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

  return <p className={devViewPanelSectionLeadClassName}>{description}</p>;
}

export function DevPanelSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  open = true,
  onToggle,
}: DevPanelSectionProps) {
  const descriptionBlock =
    description != null && description !== '' ?
      <div className={devViewPanelSectionDescriptionClassName}>
        {renderSectionDescription(description)}
      </div>
    : null;

  return (
    <section className={cn(devViewPanelSectionClassName, className)}>
      <header
        className={cn(
          devViewPanelSectionHeaderClassName,
          collapsible && devViewPanelSectionHeaderCollapsibleClassName,
        )}
      >
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <h3 className={devViewPanelSectionTitleClassName}>{title}</h3>
          {descriptionBlock}
        </div>
        {collapsible ?
          <button
            type='button'
            className={devViewPanelSectionChevronBtnClassName}
            aria-expanded={open}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            onClick={onToggle}
          >
            <AccordionChevron
              className={cn(
                devViewPanelSectionChevronClassName,
                open && devViewPanelSectionChevronOpenClassName,
              )}
            />
          </button>
        : null}
      </header>
      {!collapsible || open ?
        <div className={devViewPanelSectionContentClassName}>{children}</div>
      : null}
    </section>
  );
}
