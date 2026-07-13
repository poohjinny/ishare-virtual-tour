import type { ReactNode } from 'react';

import {
  PLATFORM_PRODUCT_LOGO,
  SHOW_ASK_GUIDE,
  VIRTUAL_TOUR_GUIDE_NAME,
} from '../constants/branding';

import type { TourClient, TourViewerType } from '../types/tour';

import { useTourChromeLayout } from '../hooks/useTourChromeLayout';

import {
  TOUR_HELP_SECTION_CONTACT,
  TOUR_HELP_SECTION_CONTROLS,
  TOUR_HELP_SECTION_FAQ,
  TOUR_HELP_SECTION_SHORTCUTS,
  TOUR_HELP_SECTION_USING,
  TOUR_HELP_TOUR_SUPPORT_LEAD,
  tourHelpFaq,
  tourHelpKeyboardShortcuts,
  tourHelpLeadText,
  tourHelpViewerControls,
} from '../constants/tourHelp';

import { PLATFORM_TOUR_SUPPORT } from '../data/platformContact';
import { ISHARE, platformBrandMarkedName } from '../data/platformBrands';

import { hasClientContact } from '../utils/tourClientContact';

import { Accordion, AccordionItem } from './ui/Accordion';

import { TourContactInfo } from './TourContactInfo';
import {
  tourNavContactSectionLeadClassName,
  tourNavControlsListClassName,
  tourNavHelpDividerClassName,
  tourNavHelpFaqAnswerClassName,
  tourNavHelpFaqItemClassName,
  tourNavHelpFaqListClassName,
  tourNavHelpFaqQuestionClassName,
  tourNavHelpLeadClassName,
  tourNavHelpListClassName,
  tourNavLogoClassName,
  tourNavLogoLinkClassName,
} from './tourNavFloatVariants';

interface TourHelpPanelProps {
  tourTitle: string;

  client?: TourClient;

  logo?: ReactNode;

  viewerType?: TourViewerType;
}

export function TourHelpPanel({
  tourTitle,

  client,

  logo,

  viewerType,
}: TourHelpPanelProps) {
  const { isCoarsePointer } = useTourChromeLayout();
  const showClientContact = hasClientContact(client);
  const showTourSupport = hasClientContact(PLATFORM_TOUR_SUPPORT);
  const showContact = showClientContact || showTourSupport;
  const keyboardShortcuts = tourHelpKeyboardShortcuts(viewerType);
  const viewerControls = tourHelpViewerControls(viewerType);
  const faqItems = tourHelpFaq(viewerType);
  const isModel3d = viewerType === 'model3d';

  const tourSupportLogo = (
    <a
      className={tourNavLogoLinkClassName}
      href={ISHARE.url}
      target='_blank'
      rel='noopener noreferrer'
    >
      <img
        className={tourNavLogoClassName}
        src={PLATFORM_PRODUCT_LOGO}
        alt={platformBrandMarkedName(ISHARE)}
      />
    </a>
  );

  return (
    <>
      <p className={tourNavHelpLeadClassName}>
        {tourHelpLeadText(tourTitle, viewerType)}
      </p>

      <Accordion gap='default'>
        <AccordionItem title={TOUR_HELP_SECTION_USING} iconPosition='right'>
          <ul className={tourNavHelpListClassName}>
            <li>
              The breadcrumb shows where you are in the tour — tap an earlier
              stop to move up. Use the arrows beside it to retrace your recent
              views (hidden on the overview).
            </li>

            <li>
              Open Explore tour to browse places and naming opportunities, or
              use search to jump by name.
            </li>

            <li>
              Tap hotspots {isModel3d ? 'on the model' : 'in the scene'} for
              info or to move to a new area.
            </li>

            {SHOW_ASK_GUIDE ?
              <li>
                Use <strong>Ask Guide</strong> (bottom-right) to chat with{' '}
                {VIRTUAL_TOUR_GUIDE_NAME} about this facility.
              </li>
            : null}

            <li>
              Viewer controls appear at the bottom by default; use the Viewer
              controls button to show or hide them.
            </li>
          </ul>
        </AccordionItem>

        {!isCoarsePointer && (
          <AccordionItem
            title={TOUR_HELP_SECTION_SHORTCUTS}
            iconPosition='right'
          >
            <ul className={tourNavHelpListClassName}>
              {keyboardShortcuts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AccordionItem>
        )}

        <AccordionItem title={TOUR_HELP_SECTION_CONTROLS} iconPosition='right'>
          <ul className={tourNavControlsListClassName}>
            {viewerControls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AccordionItem>

        <AccordionItem title={TOUR_HELP_SECTION_FAQ} iconPosition='right'>
          <dl className={tourNavHelpFaqListClassName}>
            {faqItems.map((item) => (
              <div key={item.id} className={tourNavHelpFaqItemClassName}>
                <dt className={tourNavHelpFaqQuestionClassName}>
                  {item.question}
                </dt>

                <dd className={tourNavHelpFaqAnswerClassName}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </AccordionItem>

        {showContact && (
          <AccordionItem title={TOUR_HELP_SECTION_CONTACT} iconPosition='right'>
            {showClientContact ?
              <TourContactInfo client={client} logo={logo} embedded />
            : null}

            {showClientContact && showTourSupport ?
              <hr className={tourNavHelpDividerClassName} aria-hidden='true' />
            : null}

            {showTourSupport ?
              <>
                <p className={tourNavContactSectionLeadClassName}>
                  {TOUR_HELP_TOUR_SUPPORT_LEAD}
                </p>
                <TourContactInfo
                  client={PLATFORM_TOUR_SUPPORT}
                  logo={tourSupportLogo}
                  embedded
                />
              </>
            : null}
          </AccordionItem>
        )}
      </Accordion>
    </>
  );
}
