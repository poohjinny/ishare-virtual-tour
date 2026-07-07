import {
  Children,
  Fragment,
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
  defaultOpenIndex = 0,
}: DevPanelSectionAccordionProps) {
  const sections = collectDevPanelSections(children);
  const [openIndices, setOpenIndices] = useState<Set<number>>(
    () => new Set([defaultOpenIndex]),
  );

  return (
    <>
      {sections.map((section, index) =>
        cloneElement(section, {
          key: section.key ?? section.props.title,
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
        }),
      )}
    </>
  );
}

export { DevPanelSection };
