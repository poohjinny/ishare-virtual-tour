import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '../lib/cn';
import {
  devViewPanelFileFieldClassName,
  devViewPanelFileFieldPreviewClassName,
  devViewPanelFilePreviewClearClassName,
  devViewPanelFilePreviewContentClassName,
  devViewPanelFilePreviewRowClassName,
  devViewPanelFilePreviewStackClassName,
} from './devViewPanelVariants';

function resetNativeFileInput(container: HTMLElement | null) {
  const input = container?.querySelector('input[type="file"]');
  if (input instanceof HTMLInputElement) {
    input.value = '';
  }
}

interface DevPanelFileFieldProps {
  children: ReactNode;
  preview?: ReactNode;
  className?: string;
  /** Bound file state — clearing to null resets the native input label. */
  file?: File | null;
  /** Clears a newly chosen file and resets the native file input. */
  onClearPreview?: () => void;
  showClear?: boolean;
  clearLabel?: string;
}

/** File input + optional image preview in one bordered field shell. */
export function DevPanelFileField({
  children,
  preview,
  className,
  file,
  onClearPreview,
  showClear = false,
  clearLabel = 'Clear',
}: DevPanelFileFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) return;
    resetNativeFileInput(fieldRef.current);
  }, [file]);

  const handleClear = () => {
    resetNativeFileInput(fieldRef.current);
    onClearPreview?.();
  };

  const showPreview =
    file !== undefined ? file != null && preview != null : preview != null;

  return (
    <div
      ref={fieldRef}
      className={cn(devViewPanelFileFieldClassName, className)}
    >
      {children}
      {showPreview ?
        <div className={devViewPanelFileFieldPreviewClassName}>
          <div className={devViewPanelFilePreviewStackClassName}>
            <div className={devViewPanelFilePreviewContentClassName}>
              {preview}
            </div>
            {showClear && onClearPreview ?
              <div className={devViewPanelFilePreviewRowClassName}>
                <button
                  type='button'
                  className={devViewPanelFilePreviewClearClassName}
                  onClick={handleClear}
                >
                  {clearLabel}
                </button>
              </div>
            : null}
          </div>
        </div>
      : null}
    </div>
  );
}
