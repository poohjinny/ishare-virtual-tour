import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { DevPanelSection, type DevPanelSectionProps } from './DevPanelSection';

type DevPanelSectionAccordionProps = {
  children: ReactNode;
  /** Section index open on first render; others start collapsed. More can be opened without closing these. */
  defaultOpenIndex?: number;
};

export function DevPanelSectionAccordion({
  children,
  defaultOpenIndex = 0,
}: DevPanelSectionAccordionProps) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(
    () => new Set([defaultOpenIndex]),
  );

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!isValidElement<DevPanelSectionProps>(child)) return child;

        return cloneElement(child as ReactElement<DevPanelSectionProps>, {
          collapsible: true,
          open: openIndices.has(index),
          onToggle: () => {
            setOpenIndices((current) => {
              const next = new Set(current);
              if (next.has(index)) next.delete(index);
              else next.add(index);
              return next;
            });
          },
        });
      })}
    </>
  );
}

export { DevPanelSection };
