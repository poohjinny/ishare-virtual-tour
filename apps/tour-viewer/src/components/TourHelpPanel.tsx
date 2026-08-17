import type { ReactNode } from 'react';

import {
  PLATFORM_PRODUCT_LOGO,
  isAskGuideEnabled,
} from '../constants/branding';

import type { TourClient, TourViewerType } from '../types/tour';

import { useAppSearchParams } from '../hooks/useAppSearchParams';
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
  tourNavHelpActionClassName,
  tourNavLogoClassName,
  tourNavLogoLinkClassName,
} from './tourNavFloatVariants';

interface TourHelpPanelProps {
  tourTitle: string;

  client?: TourClient;

  logo?: ReactNode;

  viewerType?: TourViewerType;

  /** When false, hide Play tour FAQ / using-this-tour tip. */
  showPlayTour?: boolean;

  /** When false, hide immersive ambience FAQ / using-this-tour tip. */
  showImmersiveAmbience?: boolean;

  /** When true, show Ask Tour Guide FAQ / using-this-tour tip. */
  showAskGuide?: boolean;

  /** Open Explore from Help copy. */
  onOpenExplore?: () => void;

  /** Open Ask Tour Guide from Help copy. */
  onOpenAskGuide?: () => void;
}

export function TourHelpPanel({
  tourTitle,

  client,

  logo,

  viewerType,

  showPlayTour = true,

  showImmersiveAmbience = true,

  showAskGuide: showAskGuideProp,

  onOpenExplore,

  onOpenAskGuide,
}: TourHelpPanelProps) {
  const { isCoarsePointer } = useTourChromeLayout();
  const { askGuide } = useAppSearchParams();
  const showAskGuide = showAskGuideProp ?? isAskGuideEnabled(askGuide);
  const showClientContact = hasClientContact(client);
  const showTourSupport = hasClientContact(PLATFORM_TOUR_SUPPORT);
  const showContact = showClientContact || showTourSupport;
  const keyboardShortcuts = tourHelpKeyboardShortcuts(viewerType);
  const viewerControls = tourHelpViewerControls(viewerType, {
    showPlayTour,
    showImmersiveAmbience,
  });
  const faqItems = tourHelpFaq(viewerType, {
    showAskGuide,
    showPlayTour,
    showImmersiveAmbience,
  });
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
        <AccordionItem title={TOUR_HELP_SECTION_USING}>
          <ul className={tourNavHelpListClassName}>
            <li>
              The breadcrumb shows where you are in the tour — tap a stop with a
              menu to pick that place or a sibling. Use the arrows beside it to
              retrace your recent views (hidden on the overview).
            </li>

            <li>
              Open{' '}
              {onOpenExplore ?
                <button
                  type='button'
                  className={tourNavHelpActionClassName}
                  onClick={onOpenExplore}
                >
                  Explore tour
                </button>
              : <strong>Explore tour</strong>}{' '}
              to browse places and naming opportunities, or use search to jump
              by name.
            </li>

            <li>
              Tap hotspots {isModel3d ? 'on the model' : 'in the scene'} for
              info or to move to a new area.
            </li>

            {showPlayTour ?
              <li>
                Use <strong>Play tour</strong> on the bottom control pill for a
                guided walkthrough of key scenes. Tap pause or navigate yourself
                to stop.
              </li>
            : null}

            {showImmersiveAmbience ?
              <li>
                Use <strong>immersive ambience</strong> on the control pill (or
                press M) for soft background music. Play tour starts it
                automatically.
              </li>
            : null}

            {showAskGuide ?
              <li>
                Use{' '}
                {onOpenAskGuide ?
                  <button
                    type='button'
                    className={tourNavHelpActionClassName}
                    onClick={onOpenAskGuide}
                  >
                    Ask Tour Guide
                  </button>
                : <strong>Ask Tour Guide</strong>}{' '}
                (bottom-right) to ask about this facility.
              </li>
            : null}

            <li>
              Viewer controls appear at the bottom by default; use the Viewer
              controls button to show or hide them.
            </li>
          </ul>
        </AccordionItem>

        {!isCoarsePointer && (
          <AccordionItem title={TOUR_HELP_SECTION_SHORTCUTS}>
            <ul className={tourNavHelpListClassName}>
              {keyboardShortcuts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AccordionItem>
        )}

        <AccordionItem title={TOUR_HELP_SECTION_CONTROLS}>
          <ul className={tourNavControlsListClassName}>
            {viewerControls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AccordionItem>

        <AccordionItem title={TOUR_HELP_SECTION_FAQ}>
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
          <AccordionItem title={TOUR_HELP_SECTION_CONTACT}>
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
