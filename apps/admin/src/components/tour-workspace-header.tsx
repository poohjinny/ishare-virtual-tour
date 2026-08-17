import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';

import { MediaThumb } from '@/components/branded-avatar';
import { HeaderEditButton } from '@/components/header-edit';
import {
  PageChrome,
  PageHeader,
  WorkspaceTabs,
} from '@/components/page-header';
import { PeerSwitcher } from '@/components/peer-switcher';
import { ViewerTypeBadge, VisibilityBadge } from '@/components/status-badges';
import { TourWorkspaceNav } from '@/components/tour-workspace-nav';
import { Button } from '@/components/ui/button';
import { TOUR_FORM_COPY } from '@/lib/authoring-copy';
import type { TourVisibility } from '@/lib/tour-catalog';
import type { AdminViewerType } from '@/lib/tour-detail';
import type { AdminTourOverview } from '@/lib/tour-overview';

export function TourWorkspaceHeader({
  tourId,
  title,
  summary,
  visibility,
  viewerType,
  overview,
  overviews,
  actions,
  lead,
}: {
  tourId: string;
  title: string;
  summary?: string;
  visibility: TourVisibility;
  viewerType: AdminViewerType;
  overview?: AdminTourOverview;
  overviews: AdminTourOverview[];
  actions?: ReactNode;
  /** Tab-panel lead — current workspace tab copy, directly under the tabs. */
  lead?: ReactNode;
}) {
  return (
    <PageChrome>
      <PageHeader
        title={title}
        description={
          summary?.trim() || (
            <span className='italic opacity-70'>
              {TOUR_FORM_COPY.tourSummaryPlaceholder}
            </span>
          )
        }
        media={
          <MediaThumb
            src={overview?.coverUrl}
            label={title}
            aspect='auto'
            className='h-full w-28'
          />
        }
        switcher={
          <PeerSwitcher
            variant='title'
            label='Switch tour'
            value={tourId}
            options={overviews.map((item) => ({
              value: item.id,
              label: item.title,
              image: item.logoUrl,
            }))}
            hrefTemplate='/tours/{id}'
            imageFit='contain'
          />
        }
        meta={
          <>
            <VisibilityBadge visibility={visibility} />
            <ViewerTypeBadge viewerType={viewerType} />
          </>
        }
        actions={
          <>
            <HeaderEditButton />
            {actions}
            <Button variant='outline' size='sm' asChild>
              <a
                href={`https://tour.ishare.ca/${tourId}`}
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLink aria-hidden='true' />
                Live
              </a>
            </Button>
          </>
        }
      />
      <WorkspaceTabs lead={lead}>
        <TourWorkspaceNav
          tourId={tourId}
          sceneCount={overview?.sceneCount}
          namingCount={overview?.namingCount}
          showEditor={viewerType === 'panorama'}
        />
      </WorkspaceTabs>
    </PageChrome>
  );
}
