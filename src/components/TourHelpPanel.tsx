import type { ReactNode } from 'react';

import { PLATFORM_FMI_LOGO, VIRTUAL_TOUR_GUIDE_NAME } from '../constants/branding';

import type { TourOrganization } from '../types/tour';

import {
  TOUR_HELP_FAQ,
  TOUR_HELP_SECTION_CONTACT,
  TOUR_HELP_SECTION_CONTROLS,
  TOUR_HELP_SECTION_FAQ,
  TOUR_HELP_SECTION_USING,
  TOUR_HELP_TOUR_SUPPORT_LEAD,
  TOUR_HELP_VIEWER_CONTROLS,
} from '../constants/tourHelp';

import { PLATFORM_TOUR_SUPPORT } from '../data/platformContact';
import { FUNDING_MATTERS } from '../data/platformBrands';

import { hasOrganizationContact } from '../utils/tourOrganizationContact';

import { Accordion, AccordionItem } from './ui/Accordion';

import { TourContactInfo } from './TourContactInfo';

interface TourHelpPanelProps {
  tourTitle: string;

  organization?: TourOrganization;

  logo?: ReactNode;
}

export function TourHelpPanel({
  tourTitle,

  organization,

  logo,
}: TourHelpPanelProps) {
  const showClientContact = hasOrganizationContact(organization);
  const showTourSupport = hasOrganizationContact(PLATFORM_TOUR_SUPPORT);
  const showContact = showClientContact || showTourSupport;

  const tourSupportLogo = (
    <a
      className='tour-nav-actions__logo-link'
      href={FUNDING_MATTERS.url}
      target='_blank'
      rel='noopener noreferrer'
    >
      <img
        className='tour-nav-actions__logo'
        src={PLATFORM_FMI_LOGO}
        alt={FUNDING_MATTERS.name}
      />
    </a>
  );

  return (
    <>
      <p className='tour-nav-actions__help-lead'>
        Welcome to {tourTitle}. Explore each location in 360°, move between
        scenes with hotspots, and use the sections below to find your way
        around.
      </p>

      <Accordion gap='default'>
        <AccordionItem title={TOUR_HELP_SECTION_USING} iconPosition='right'>
          <ul className='tour-nav-actions__help-list'>
            <li>
              The breadcrumb shows where you are in the tour — tap an earlier
              stop to move up. Use the arrows beside it to retrace your recent
              views (hidden on the overview).
            </li>

            <li>
              Open Explore tour to browse locations and naming opportunities, or
              use search to jump by name.
            </li>

            <li>
              Tap hotspots in the scene for info or to move to a new area.
            </li>

            <li>
              Use <strong>Ask Guide</strong> (bottom-right) to chat with{' '}
              {VIRTUAL_TOUR_GUIDE_NAME} about this facility.
            </li>

            <li>
              Tap the tune icon to show or hide viewer controls at the bottom.
            </li>
          </ul>
        </AccordionItem>

        <AccordionItem title={TOUR_HELP_SECTION_CONTROLS} iconPosition='right'>
          <ul className='tour-nav-actions__controls-list'>
            {TOUR_HELP_VIEWER_CONTROLS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AccordionItem>

        <AccordionItem title={TOUR_HELP_SECTION_FAQ} iconPosition='right'>
          <dl className='tour-nav-actions__help-faq-list'>
            {TOUR_HELP_FAQ.map((item) => (
              <div key={item.id} className='tour-nav-actions__help-faq-item'>
                <dt className='tour-nav-actions__help-faq-question'>
                  {item.question}
                </dt>

                <dd className='tour-nav-actions__help-faq-answer'>
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </AccordionItem>

        {showContact && (
          <AccordionItem title={TOUR_HELP_SECTION_CONTACT} iconPosition='right'>
            {showClientContact ?
              <TourContactInfo
                organization={organization}
                logo={logo}
                embedded
              />
            : null}

            {showClientContact && showTourSupport ?
              <hr className='tour-nav-actions__help-divider' aria-hidden='true' />
            : null}

            {showTourSupport ?
              <>
                <p className='tour-nav-actions__contact-section-lead'>
                  {TOUR_HELP_TOUR_SUPPORT_LEAD}
                </p>
                <TourContactInfo
                  organization={PLATFORM_TOUR_SUPPORT}
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
