import { useId, useRef } from 'react';
import { cn } from '../lib/cn';
import {
  devViewPanelFileChooseBtnClassName,
  devViewPanelFileInputRowClassName,
  devViewPanelFileNameClassName,
} from './devViewPanelVariants';

interface DevPanelFileInputProps {
  accept?: string;
  file?: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}

/** Gray "Choose" trigger + filename row inside {@link DevPanelFileField}. */
export function DevPanelFileInput({
  accept,
  file,
  onChange,
  className,
}: DevPanelFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hasFile = file != null;

  return (
    <div className={cn(devViewPanelFileInputRowClassName, className)}>
      <button
        type='button'
        className={devViewPanelFileChooseBtnClassName}
        onClick={() => inputRef.current?.click()}
        aria-controls={inputId}
      >
        Choose
      </button>
      <span
        className={cn(
          devViewPanelFileNameClassName,
          !hasFile && 'text-[#64748b]',
        )}
        title={hasFile ? file.name : 'No file chosen'}
      >
        {hasFile ? file.name : 'No file chosen'}
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept={accept}
        className='sr-only'
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
