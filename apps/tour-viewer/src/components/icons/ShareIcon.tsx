import { MaterialSymbol } from '../ui/MaterialSymbol';

interface ShareIconProps {
  className?: string;
  sizePx?: number;
}

export function ShareIcon({ className, sizePx }: ShareIconProps) {
  return <MaterialSymbol name='share' className={className} sizePx={sizePx} />;
}
