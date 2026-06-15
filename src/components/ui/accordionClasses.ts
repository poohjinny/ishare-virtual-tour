/** Shared class strings for accordion (React + HTML popups). */

const A = 'ishare-accordion';

export type AccordionIconPosition = 'left' | 'right';

export const ACCORDION_CLASS = {
  root: A,
  rootGapSm: `${A}--gap-sm`,
  rootGapMd: `${A}--gap-md`,
  rootSingle: `${A}--single`,
  item: `${A}__item`,
  itemOpen: `${A}__item--open`,
  itemPanelMounted: `${A}__item--panel-mounted`,
  itemAnimated: `${A}__item--animated`,
  itemNested: `${A}__item--nested`,
  itemIconLeft: `${A}__item--icon-left`,
  itemIconRight: `${A}__item--icon-right`,
  trigger: `${A}__trigger`,
  triggerIconLeft: `${A}__trigger--icon-left`,
  triggerIconRight: `${A}__trigger--icon-right`,
  triggerMain: `${A}__trigger-main`,
  triggerExtra: `${A}__trigger-extra`,
  icon: `${A}__icon`,
  label: `${A}__label`,
  panelWrap: `${A}__panel-wrap`,
  panel: `${A}__panel`,
  panelInner: `${A}__panel-inner`,
} as const;

export const ACCORDION_DATA = {
  root: 'data-ishare-accordion',
  toggle: 'data-ishare-accordion-toggle',
} as const;

export function accordionTriggerClass(
  iconPosition: AccordionIconPosition = 'left',
): string {
  return [
    ACCORDION_CLASS.trigger,
    iconPosition === 'right' ?
      ACCORDION_CLASS.triggerIconRight
    : ACCORDION_CLASS.triggerIconLeft,
  ].join(' ');
}

export function accordionItemClass(options?: {
  animated?: boolean;
  nested?: boolean;
  iconPosition?: AccordionIconPosition;
}): string {
  return [
    ACCORDION_CLASS.item,
    options?.animated ? ACCORDION_CLASS.itemAnimated : '',
    options?.nested ? ACCORDION_CLASS.itemNested : '',
    options?.iconPosition === 'right' ? ACCORDION_CLASS.itemIconRight
    : options?.iconPosition === 'left' ? ACCORDION_CLASS.itemIconLeft
    : '',
  ]
    .filter(Boolean)
    .join(' ');
}
