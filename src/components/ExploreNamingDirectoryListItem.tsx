import { FLIP_LIST_KEY_ATTR } from '../hooks/useFlipListReorder';
import { cn } from '../lib/cn';
import { EXPLORE_GALLERY_NAMING_VIEW_LABEL } from '../constants/tourDirectory';
import { ExploreDirectoryListItemActions } from './ExploreDirectoryListItemActions';
import { ExploreGalleryCtaArrowIcon } from './icons/ExploreGalleryCtaArrowIcon';
import { NamingHeartIcon } from './icons/NamingHeartIcon';
import type { NamingStatusModifier } from './ui/Badge';
import { NamingStatusBadge } from './ui/NamingStatusBadge';
import {
  tourNavDirectoryItemVariants,
  tourNavDirectoryListItemBadgeColumnClassName,
  tourNavDirectoryListItemPrimaryCtaClassName,
  tourNavDirectoryListItemSelectClassName,
  tourNavItemBadgeClassName,
  tourNavItemDescriptionClassName,
  tourNavItemLeadingLocationClassName,
  tourNavItemNamingHeaderClassName,
  tourNavItemNamingLocationClassName,
  tourNavItemNamingNameClassName,
  tourNavItemNamingPriceClassName,
  tourNavItemNamingTitleRowClassName,
  tourNavItemTextClassName,
} from './tourNavFloatVariants';
import type { TourDirectoryNamingItem } from '../utils/tourDirectory';
import { MATERIAL_SYMBOL_SIZE_14 } from './ui/materialSymbolClasses';

interface ExploreNamingDirectoryListItemProps {
  item: TourDirectoryNamingItem;
  active: boolean;
  priceLabel: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function ExploreNamingDirectoryListItem({
  item,
  active,
  priceLabel,
  disabled = false,
  onSelect,
}: ExploreNamingDirectoryListItemProps) {
  const isClosed = item.statusModifier === 'closed';
  const description = item.description?.trim();
  const showActions = !active;
  const ariaLabel =
    active ?
      description ?
        `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}. ${description}`
      : `${item.name}, current naming opportunity, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}.`
    : description ?
      `${item.name}, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}. ${description}`
    : `${item.name}, ${item.sceneTitle}. ${item.statusLabel}. ${priceLabel}.`;

  return (
    <li
      role='presentation'
      {...{ [FLIP_LIST_KEY_ATTR]: `${item.sceneId}:${item.hotspotId}` }}
    >
      <div
        className={cn(
          tourNavDirectoryItemVariants({
            kind: 'naming',
            active,
            statusTone: isClosed ? 'closed' : 'default',
          }),
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <button
          type='button'
          role='option'
          aria-selected={active}
          data-tour-nav-directory-kind='naming'
          className={tourNavDirectoryListItemSelectClassName}
          disabled={disabled}
          onClick={onSelect}
          aria-label={ariaLabel}
        >
          <span className={tourNavItemLeadingLocationClassName}>
            <NamingHeartIcon active={active} closed={isClosed} />
          </span>
          <span className={tourNavItemTextClassName}>
            <span className={tourNavItemNamingHeaderClassName}>
              <span className={tourNavItemNamingTitleRowClassName}>
                <span className={tourNavItemNamingNameClassName}>
                  {item.name}
                </span>
                <NamingStatusBadge
                  statusModifier={item.statusModifier as NamingStatusModifier}
                  label={item.statusLabel}
                  className={cn(tourNavItemBadgeClassName, 'ml-0 shrink-0')}
                />
              </span>
              <span className={tourNavItemNamingLocationClassName}>
                {item.sceneTitle}
              </span>
            </span>
            {description || showActions ?
              <span className='flex min-w-0 flex-col'>
                {description ?
                  <span className={tourNavItemDescriptionClassName}>
                    {description}
                  </span>
                : null}
                {showActions ?
                  <ExploreDirectoryListItemActions>
                    <span
                      className={tourNavDirectoryListItemPrimaryCtaClassName}
                      aria-hidden='true'
                    >
                      <span className='min-w-0 truncate'>
                        {EXPLORE_GALLERY_NAMING_VIEW_LABEL}
                      </span>
                      <ExploreGalleryCtaArrowIcon
                        variant='text'
                        sizePx={MATERIAL_SYMBOL_SIZE_14}
                      />
                    </span>
                  </ExploreDirectoryListItemActions>
                : null}
              </span>
            : null}
          </span>
          {priceLabel ?
            <span className={tourNavDirectoryListItemBadgeColumnClassName}>
              <span className={tourNavItemNamingPriceClassName}>
                {priceLabel}
              </span>
            </span>
          : null}
        </button>
      </div>
    </li>
  );
}
