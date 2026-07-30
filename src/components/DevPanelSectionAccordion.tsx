import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { DevPanelSection, type DevPanelSectionProps } from './DevPanelSection';
import {
  devViewPanelNestedSectionStackClassName,
  devViewPanelSectionStackClassName,
  devViewPanelSectionStackItemClassName,
  devViewPanelSectionStackItemNestedClassName,
  devViewPanelSectionStackItemRuleClassName,
} from './devViewPanelVariants';

type DevPanelSectionAccordionProps = {
  children: ReactNode;
  /** Section index open on first render; default is all collapsed. */
  defaultOpenIndex?: number;
  /**
   * When `ensureOpenKey` changes to a new positive value, open this section
   * index (e.g. jump to Add from an external CTA).
   */
  ensureOpenIndex?: number;
  ensureOpenKey?: number;
  /**
   * When `ensureCloseKey` changes to a new positive value, close this section
   * index (e.g. Cancel on an Add form).
   */
  ensureCloseIndex?: number;
  ensureCloseKey?: number;
  /**
   * `nested` — tighter section pad (Manage Scenes groups).
   * `default` — top-level tab accordion pad.
   */
  variant?: 'default' | 'nested';
};

function collectDevPanelSections(
  nodes: ReactNode,
  out: ReactElement<DevPanelSectionProps>[] = [],
): ReactElement<DevPanelSectionProps>[] {
  Children.forEach(nodes, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === DevPanelSection) {
      out.push(child as ReactElement<DevPanelSectionProps>);
      return;
    }

    if (child.type === Fragment) {
      collectDevPanelSections(
        (child as ReactElement<{ children: ReactNode }>).props.children,
        out,
      );
    }
  });

  return out;
}

export function DevPanelSectionAccordion({
  children,
  defaultOpenIndex,
  ensureOpenIndex,
  ensureOpenKey = 0,
  ensureCloseIndex,
  ensureCloseKey = 0,
  variant = 'default',
}: DevPanelSectionAccordionProps) {
  const sections = collectDevPanelSections(children);
  const [openIndices, setOpenIndices] = useState<Set<number>>(() =>
    defaultOpenIndex === undefined ? new Set() : new Set([defaultOpenIndex]),
  );

  useEffect(() => {
    if (ensureOpenKey <= 0 || ensureOpenIndex == null) return;
    setOpenIndices((current) => {
      if (current.has(ensureOpenIndex)) return current;
      const next = new Set(current);
      next.add(ensureOpenIndex);
      return next;
    });
  }, [ensureOpenIndex, ensureOpenKey]);

  useEffect(() => {
    if (ensureCloseKey <= 0 || ensureCloseIndex == null) return;
    setOpenIndices((current) => {
      if (!current.has(ensureCloseIndex)) return current;
      const next = new Set(current);
      next.delete(ensureCloseIndex);
      return next;
    });
  }, [ensureCloseIndex, ensureCloseKey]);

  const nested = variant === 'nested';
  const stackClassName =
    nested ?
      devViewPanelNestedSectionStackClassName
    : devViewPanelSectionStackClassName;

  return (
    <div className={stackClassName}>
      {sections.map((section, index) =>
        cloneElement(section, {
          key: section.key ?? section.props.title,
          collapsible: true,
          open: openIndices.has(index),
          className: cn(
            nested ?
              devViewPanelSectionStackItemNestedClassName
            : devViewPanelSectionStackItemClassName,
            index > 0 && devViewPanelSectionStackItemRuleClassName,
            section.props.className,
          ),
          onToggle: () => {
            setOpenIndices((current) => {
              const next = new Set(current);
              if (next.has(index)) next.delete(index);
              else next.add(index);
              return next;
            });
          },
        }),
      )}
    </div>
  );
}

export { DevPanelSection };
