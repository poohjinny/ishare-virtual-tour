import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  devViewPanelFormGroupClassName,
  devViewPanelFormGroupStackedClassName,
  devViewPanelFormGroupTitleClassName,
  devViewPanelFormSectionBodyClassName,
  devViewPanelFormRow3ClassName,
  devViewPanelFormRowClassName,
  devViewPanelFormSectionClassName,
  devViewPanelInlineFormGroupClassName,
  devViewPanelManageEditFormClassName,
  devViewPanelSectionDescriptionClassName,
  devViewPanelSectionHeaderClassName,
  devViewPanelSectionHintClassName,
  devViewPanelSectionLeadClassName,
  devViewPanelSubsectionClassName,
} from './devViewPanelVariants';

type DevPanelFormGroupProps = {
  children: ReactNode;
  className?: string;
  /** Shown under `title` with tight spacing (or alone when no title). */
  hint?: ReactNode;
  title?: string;
  inline?: boolean;
  /** Extra top spacing for Manage-tab row edit panels. */
  manageEdit?: boolean;
  /** Subsections handle spacing — use with DevPanelFormSection stacks. */
  stacked?: boolean;
};

function renderFormGroupHint(hint: ReactNode): ReactNode {
  if (typeof hint === 'string') {
    return <p className={devViewPanelSectionHintClassName}>{hint}</p>;
  }

  return hint;
}

export function DevPanelFormGroup({
  children,
  className,
  hint,
  title,
  inline = false,
  manageEdit = false,
  stacked = false,
}: DevPanelFormGroupProps) {
  const hasHeader = Boolean(title || (hint != null && hint !== ''));

  return (
    <div
      className={cn(
        inline && manageEdit ? devViewPanelManageEditFormClassName
        : inline ? devViewPanelInlineFormGroupClassName
        : stacked ? devViewPanelFormGroupStackedClassName
        : devViewPanelFormGroupClassName,
        className,
      )}
    >
      {hasHeader ?
        <div className='flex min-w-0 flex-col gap-1.5'>
          {title ?
            <h4 className={devViewPanelFormGroupTitleClassName}>{title}</h4>
          : null}
          {hint != null && hint !== '' ? renderFormGroupHint(hint) : null}
        </div>
      : null}
      {children}
    </div>
  );
}

type DevPanelFormSectionProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  divided?: boolean;
  title?: string;
};

function renderFormSectionDescription(description: ReactNode): ReactNode {
  if (typeof description === 'string') {
    return <p className={devViewPanelSectionLeadClassName}>{description}</p>;
  }

  return description;
}

/** Subsection inside a single manage-card — optional top divider after the first block. */
export function DevPanelFormSection({
  children,
  className,
  description,
  divided = false,
  title,
}: DevPanelFormSectionProps) {
  const hasHeader = Boolean(title || description);

  return (
    <div
      className={cn(
        devViewPanelFormSectionClassName,
        divided && devViewPanelSubsectionClassName,
        className,
      )}
    >
      {hasHeader ?
        <div className={devViewPanelSectionHeaderClassName}>
          <div className='flex min-w-0 flex-col gap-1.5'>
            {title ?
              <h4 className={devViewPanelFormGroupTitleClassName}>{title}</h4>
            : null}
            {description != null && description !== '' ?
              <div className={devViewPanelSectionDescriptionClassName}>
                {renderFormSectionDescription(description)}
              </div>
            : null}
          </div>
        </div>
      : null}
      <div className={devViewPanelFormSectionBodyClassName}>{children}</div>
    </div>
  );
}
type DevPanelFormRowProps = {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
};

export function DevPanelFormRow({
  children,
  cols = 2,
  className,
}: DevPanelFormRowProps) {
  return (
    <div
      className={cn(
        cols === 3 ?
          devViewPanelFormRow3ClassName
        : devViewPanelFormRowClassName,
        className,
      )}
    >
      {children}
    </div>
  );
}
