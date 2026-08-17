'use client';

import { Crosshair } from 'lucide-react';

import { InputGroup } from '@/components/input-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PreviewClickAxis } from '@/lib/preview-click';

export function HotspotPositionFields({
  idPrefix,
  position,
  onChange,
  readOnly,
}: {
  idPrefix: string;
  position: PreviewClickAxis[];
  onChange?: (axis: string, value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      {position.map(({ axis, value }) => (
        <div key={axis} className='grid gap-1.5'>
          <Label htmlFor={`${idPrefix}-${axis}`} className='font-mono text-xs'>
            {axis}
          </Label>
          <InputGroup icon={Crosshair}>
            <Input
              id={`${idPrefix}-${axis}`}
              type='number'
              step='any'
              value={Number.isFinite(value) ? value : 0}
              readOnly={readOnly}
              disabled={readOnly || !onChange}
              onChange={(event) =>
                onChange?.(axis, Number(event.target.value) || 0)
              }
            />
          </InputGroup>
        </div>
      ))}
    </div>
  );
}
