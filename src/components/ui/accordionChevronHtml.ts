import {
  ACCORDION_CLASS,
  type AccordionIconPosition,
} from './accordionClasses';

export function accordionChevronHtml(): string {
  return `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
  <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function buildAccordionIconHtml(): string {
  return `<span class="${ACCORDION_CLASS.icon}" aria-hidden="true">${accordionChevronHtml()}</span>`;
}

export function buildAccordionTriggerMainHtml(
  labelHtml: string,
  iconPosition: AccordionIconPosition = 'left',
): string {
  const iconHtml = buildAccordionIconHtml();
  const inner =
    iconPosition === 'left' ?
      `${iconHtml}${labelHtml}`
    : `${labelHtml}${iconHtml}`;

  return `<span class="${ACCORDION_CLASS.triggerMain}">${inner}</span>`;
}
