import {
  Bug,
  Database,
  FileJson,
  Link2,
  MonitorCog,
  Palette,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { AdminAccentSelect } from '@/components/admin-accent-select';
import { AdminShell } from '@/components/admin-shell';
import { PageHeader, PageMain } from '@/components/page-header';
import { SettingsDebugToggle } from '@/components/settings-debug-toggle';
import { FormField, FormHint } from '@/components/form-field';
import { InputGroup } from '@/components/input-group';
import { ThemeSelect } from '@/components/theme-select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ADMIN_DEBUG_COPY } from '@/lib/authoring-copy';
import { cn } from '@/lib/utils';
import { viewerBaseUrl } from '@/lib/viewer-url';

const CARD_TONES = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  muted: 'bg-muted text-muted-foreground',
} as const;

/** Icon + title on one row; description sits below on its own. */
function SettingsCardHeading({
  icon: Icon,
  tone,
  title,
  description,
}: {
  icon: LucideIcon;
  tone: keyof typeof CARD_TONES;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <CardHeader>
      <div className='flex items-center gap-3'>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            CARD_TONES[tone],
          )}
        >
          <Icon aria-hidden='true' className='size-5' />
        </span>
        <CardTitle>{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}

export default function SettingsPage() {
  return (
    <AdminShell currentPage='Settings'>
      <PageMain>
        <PageHeader
          title='Settings'
          description='Workspace configuration for this admin environment.'
          icon={Settings2}
        />

        <div className='grid items-stretch gap-6 md:grid-cols-2'>
          <Card className='h-full border-primary/15'>
            <SettingsCardHeading
              icon={Palette}
              tone='primary'
              title='Appearance'
              description='Choose the Admin UI theme and primary color. System follows your device preference.'
            />
            {/* Two appearance choices side by side once the card is wide
                enough for both; the page grid alone cannot tell. */}
            <CardContent className='@container grid gap-2'>
              <div className='grid gap-5 @min-[28rem]:grid-cols-2'>
                <FormField label='Theme' htmlFor='settings-theme'>
                  <ThemeSelect />
                </FormField>
                <FormField label='Primary color'>
                  <AdminAccentSelect />
                </FormField>
              </div>
              {/* One persistence rule for both fields — per column it would
                  read as two different rules. */}
              <FormHint>
                Saved in this browser and synchronized across Admin tabs.
              </FormHint>
            </CardContent>
          </Card>

          <Card className='h-full border-info/15'>
            <SettingsCardHeading
              icon={MonitorCog}
              tone='info'
              title='Viewer connection'
              description={
                <>
                  Where previews and the local authoring API are served from.
                  Set via{' '}
                  <code className='font-mono'>NEXT_PUBLIC_TOUR_VIEWER_URL</code>{' '}
                  in <code className='font-mono'>.env.local</code>.
                </>
              }
            />
            <CardContent className='grid gap-5'>
              <FormField label='Viewer URL' htmlFor='settings-viewer-url'>
                <InputGroup icon={Link2}>
                  <Input
                    id='settings-viewer-url'
                    className='font-mono'
                    value={viewerBaseUrl}
                    readOnly
                  />
                </InputGroup>
              </FormField>
            </CardContent>
          </Card>

          <Card className='h-full'>
            <SettingsCardHeading
              icon={Bug}
              tone='muted'
              title={ADMIN_DEBUG_COPY.chrome.cardTitle}
              description={ADMIN_DEBUG_COPY.chrome.cardDescription}
            />
            <CardContent>
              <SettingsDebugToggle />
            </CardContent>
          </Card>

          <Card className='h-full border-success/15'>
            <SettingsCardHeading
              icon={Database}
              tone='success'
              title='Authoring source'
              description='Content is read from local JSON while draft and publish APIs are built. Scene edits save through the viewer dev API and need both dev servers running.'
            />
            <CardContent className='grid gap-5'>
              <FormField label='Catalog' htmlFor='settings-catalog-path'>
                <InputGroup icon={FileJson}>
                  <Input
                    id='settings-catalog-path'
                    className='font-mono'
                    value='apps/tour-viewer/tours/catalog.json'
                    readOnly
                  />
                </InputGroup>
              </FormField>
              <FormField label='Tour configs' htmlFor='settings-tours-path'>
                <InputGroup icon={FileJson}>
                  <Input
                    id='settings-tours-path'
                    className='font-mono'
                    value='apps/tour-viewer/tours/[tourId].json'
                    readOnly
                  />
                </InputGroup>
              </FormField>
            </CardContent>
          </Card>
        </div>
      </PageMain>
    </AdminShell>
  );
}
