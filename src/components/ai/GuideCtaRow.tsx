import type { ChatGuideCta } from '../../types/tour';
import { cn } from '../../lib/cn';
import {
  aiGuideCtaClassName,
  aiGuideCtaPrimaryClassName,
  aiGuideCtaRowClassName,
} from './aiAssistantVariants';

interface GuideCtaRowProps {
  ctas: ChatGuideCta[];
  className?: string;
}

export function GuideCtaRow({ ctas, className }: GuideCtaRowProps) {
  if (ctas.length === 0) return null;

  return (
    <div className={cn(aiGuideCtaRowClassName, className)}>
      {ctas.map((cta) => {
        const isMailto = cta.url.startsWith('mailto:');
        return (
          <a
            key={cta.id}
            href={cta.url}
            className={
              cta.kind === 'donate' || cta.kind === 'contact' ?
                aiGuideCtaPrimaryClassName
              : aiGuideCtaClassName
            }
            {...(isMailto ?
              {}
            : { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {cta.label}
          </a>
        );
      })}
    </div>
  );
}
