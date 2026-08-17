'use client';

import { ListFilter, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { semanticValueIcon, type SemanticIconKind } from '@/lib/semantic-icons';

export interface TableFilterSection {
  id: string;
  label: string;
  /** Vocabulary the option values belong to — picks each row's leading glyph. */
  kind: SemanticIconKind;
  options: Array<{ value: string; label: string }>;
}

export function TableFilterDropdown({
  sections,
  selected,
  onSelectedChange,
}: {
  sections: TableFilterSection[];
  selected: Record<string, string[]>;
  onSelectedChange: (selected: Record<string, string[]>) => void;
}) {
  const activeCount = Object.values(selected).reduce(
    (total, values) => total + values.length,
    0,
  );

  function toggle(sectionId: string, value: string, checked: boolean) {
    const current = selected[sectionId] ?? [];
    onSelectedChange({
      ...selected,
      [sectionId]:
        checked ?
          [...current, value]
        : current.filter((item) => item !== value),
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='outline' size='sm'>
          <ListFilter aria-hidden='true' />
          Filter
          {activeCount > 0 ?
            <Badge variant='secondary' size='sm' className='tabular-nums'>
              {activeCount}
            </Badge>
          : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-52'>
        {sections.map((section, index) => (
          <div key={section.id}>
            {index > 0 ?
              <DropdownMenuSeparator />
            : null}
            <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
            {section.options.map((option) => {
              const Icon = semanticValueIcon(section.kind, option.value);

              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={(selected[section.id] ?? []).includes(option.value)}
                  onCheckedChange={(checked) =>
                    toggle(section.id, option.value, checked === true)
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {Icon ?
                    <Icon aria-hidden='true' />
                  : null}
                  {option.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={activeCount === 0}
          onSelect={() => onSelectedChange({})}
        >
          <RotateCcw aria-hidden='true' />
          Clear filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
