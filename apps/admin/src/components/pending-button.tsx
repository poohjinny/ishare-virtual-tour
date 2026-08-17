import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';

export function PendingButton({
  pending,
  pendingLabel,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <Button disabled={disabled || pending} {...props}>
      {pending ?
        <LoaderCircle aria-hidden='true' className='animate-spin' />
      : null}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
