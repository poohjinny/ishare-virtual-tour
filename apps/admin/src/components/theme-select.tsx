'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Monitor, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

function subscribe() {
  return () => {};
}

export function ThemeSelect() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { theme, setTheme } = useTheme();

  return (
    <Select
      value={mounted ? theme : 'system'}
      onValueChange={setTheme}
      disabled={!mounted}
    >
      <SelectTrigger id='settings-theme' className='w-full'>
        <SelectValue placeholder='Select a theme' />
      </SelectTrigger>
      <SelectContent>
        {themeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <option.icon aria-hidden='true' />
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
