import { useState } from 'react';
import type { ChatGuideLink } from '../../types/tour';
import {
  EXPLORE_GALLERY_NAMING_VIEW_LABEL,
  EXPLORE_GALLERY_VISIT_LABEL,
} from '../../constants/tourDirectory';
import { cn } from '../../lib/cn';
import {
  aiSceneLinkCardActionClassName,
  aiSceneLinkCardActionPrimaryClassName,
  aiSceneLinkCardActionsClassName,
  aiSceneLinkCardBodyClassName,
  aiSceneLinkCardClassName,
  aiSceneLinkCardDescClassName,
  aiSceneLinkCardMediaClassName,
  aiSceneLinkCardTitleClassName,
  aiSceneLinkListClassName,
} from './aiAssistantVariants';

const COPY_LINK_LABEL = 'Copy link';
const COPIED_LABEL = 'Copied';

interface GuideSceneLinkCardsProps {
  links: ChatGuideLink[];
  currentSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onSelectNaming?: (sceneId: string, hotspotId: string) => void;
  onVisitNaming?: (sceneId: string, hotspotId: string) => void;
  onCopyLink?: (link: ChatGuideLink) => Promise<boolean> | boolean;
  disabled?: boolean;
  className?: string;
}

function linkKey(link: ChatGuideLink): string {
  return link.kind === 'naming' ?
      `naming:${link.namingId ?? link.hotspotId}`
    : `scene:${link.sceneId}`;
}

function GuideCopyLinkButton({
  link,
  disabled,
  onCopyLink,
}: {
  link: ChatGuideLink;
  disabled?: boolean;
  onCopyLink?: (link: ChatGuideLink) => Promise<boolean> | boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!onCopyLink) return null;

  return (
    <button
      type='button'
      className={aiSceneLinkCardActionClassName}
      disabled={disabled}
      onClick={() => {
        void Promise.resolve(onCopyLink(link)).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? COPIED_LABEL : COPY_LINK_LABEL}
    </button>
  );
}

export function GuideSceneLinkCards({
  links,
  currentSceneId,
  onSelectScene,
  onSelectNaming,
  onVisitNaming,
  onCopyLink,
  disabled = false,
  className,
}: GuideSceneLinkCardsProps) {
  if (links.length === 0) return null;

  return (
    <div className={cn(aiSceneLinkListClassName, className)}>
      {links.map((link) => (
        <article key={linkKey(link)} className={aiSceneLinkCardClassName}>
          {link.thumbnail ?
            <img
              src={link.thumbnail}
              alt=''
              className={aiSceneLinkCardMediaClassName}
              loading='lazy'
              decoding='async'
            />
          : <span
              className={aiSceneLinkCardMediaClassName}
              aria-hidden='true'
            />
          }
          <div className={aiSceneLinkCardBodyClassName}>
            <h3 className={aiSceneLinkCardTitleClassName}>{link.title}</h3>
            {link.description ?
              <p className={aiSceneLinkCardDescClassName}>{link.description}</p>
            : null}
            <div className={aiSceneLinkCardActionsClassName}>
              {link.kind === 'naming' && link.hotspotId ?
                <>
                  {onSelectNaming ?
                    <button
                      type='button'
                      className={aiSceneLinkCardActionPrimaryClassName}
                      disabled={disabled}
                      onClick={() =>
                        onSelectNaming(link.sceneId, link.hotspotId!)
                      }
                    >
                      {EXPLORE_GALLERY_NAMING_VIEW_LABEL}
                    </button>
                  : null}
                  {onVisitNaming ?
                    <button
                      type='button'
                      className={aiSceneLinkCardActionClassName}
                      disabled={disabled}
                      aria-label='Visit place'
                      onClick={() =>
                        onVisitNaming(link.sceneId, link.hotspotId!)
                      }
                    >
                      {EXPLORE_GALLERY_VISIT_LABEL}
                    </button>
                  : onSelectScene ?
                    <button
                      type='button'
                      className={aiSceneLinkCardActionClassName}
                      disabled={disabled}
                      onClick={() => onSelectScene(link.sceneId)}
                    >
                      {EXPLORE_GALLERY_VISIT_LABEL}
                    </button>
                  : null}
                </>
              : onSelectScene ?
                <button
                  type='button'
                  className={aiSceneLinkCardActionPrimaryClassName}
                  disabled={disabled}
                  onClick={() => onSelectScene(link.sceneId)}
                >
                  {currentSceneId && link.sceneId === currentSceneId ?
                    'Recenter'
                  : EXPLORE_GALLERY_VISIT_LABEL}
                </button>
              : null}
              <GuideCopyLinkButton
                link={link}
                disabled={disabled}
                onCopyLink={onCopyLink}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
