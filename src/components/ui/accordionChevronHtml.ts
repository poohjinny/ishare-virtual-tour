import {
  ACCORDION_CLASS,
  type AccordionIconPosition,
} from './accordionClasses';
import { CTA_MATERIAL_SYMBOL_CLASS } from '../glassPanelCtaIcons';

export function accordionChevronHtml(): string {
  return `<span class="${CTA_MATERIAL_SYMBOL_CLASS}" style="font-size:16px;line-height:1" aria-hidden="true">expand_more</span>`;
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
