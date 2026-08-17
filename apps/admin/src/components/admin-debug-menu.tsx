'use client';

import {
  Bell,
  BellOff,
  Bug,
  CircleCheck,
  CircleX,
  Eye,
  ImageOff,
  Loader,
  LoaderCircle,
  MessageCircle,
  MonitorPlay,
  Palette,
  Pause,
  Pencil,
  Plus,
  Route,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAdminGuideDock,
  useForceImageSkeleton,
  useForceNavProgress,
  usePausePreviewIframe,
} from '@/lib/admin-debug';
import {
  ADMIN_GUIDE_SCENARIOS,
  loadAdminGuideScenario,
  type AdminGuideScenarioId,
} from '@/lib/admin-guide-scenarios';
import { ADMIN_DEBUG_COPY } from '@/lib/authoring-copy';

const DEBUG_TOAST_ID = 'admin-debug-toast';

const TOAST_FIXTURES = [
  'off',
  'success',
  'error',
  'loading',
  'resolve',
  'reject',
] as const;

type ToastFixture = (typeof TOAST_FIXTURES)[number];

/** Resolve/reject raise the same toast kind as success/error, so they share a glyph. */
const TOAST_FIXTURE_ICONS: Record<ToastFixture, LucideIcon> = {
  off: BellOff,
  success: CircleCheck,
  error: CircleX,
  loading: LoaderCircle,
  resolve: CircleCheck,
  reject: CircleX,
};

const GUIDE_SCENARIO_ICONS: Record<AdminGuideScenarioId, LucideIcon> = {
  welcome: Sparkles,
  'create-tour': Plus,
  'edit-tour': Pencil,
  'tour-visibility': Eye,
  'client-branding': Palette,
  'delete-confirmation': Trash2,
};

function DebugActionCopy({ label, hint }: { label: string; hint?: ReactNode }) {
  return (
    <span className='flex min-w-0 flex-col gap-0.5'>
      <span>{label}</span>
      {hint ?
        <span className='type-meta'>{hint}</span>
      : null}
    </span>
  );
}

function DebugSubmenu({
  label,
  icon: Icon,
  children,
}: {
  label: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {Icon ?
          <Icon aria-hidden='true' />
        : null}
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={Icon ? 'w-80 min-w-80' : 'min-w-44'}>
        {children}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** Admin chrome Debug — gated by Settings. Viewer flags stay on the preview card. */
export function AdminDebugMenu() {
  const copy = ADMIN_DEBUG_COPY.toasts;
  const preview = ADMIN_DEBUG_COPY.preview;
  const navigation = ADMIN_DEBUG_COPY.navigation;
  const pausePreviewIframe = usePausePreviewIframe();
  const forceSkeleton = useForceImageSkeleton();
  const forceNavProgress = useForceNavProgress();
  const guideDock = useAdminGuideDock();
  const [menuOpen, setMenuOpen] = useState(false);
  // Controlled for the lifetime of the tooltip: swapping to `undefined` while the
  // menu is open would flip Radix between controlled and uncontrolled.
  const [labelOpen, setLabelOpen] = useState(false);
  const [toastFixture, setToastFixture] = useState<ToastFixture>('off');
  const [guideScenario, setGuideScenario] =
    useState<AdminGuideScenarioId>('welcome');

  const showToastFixture = (kind: ToastFixture) => {
    setToastFixture(kind);
    if (kind === 'off') {
      toast.dismiss(DEBUG_TOAST_ID);
      return;
    }

    // Stay up until Off / X / Cancel — fixtures are for inspecting the chrome.
    // Always set `action` explicitly: sonner merges updates by id, so a leftover
    // Loading Cancel would stick on Resolve / Success otherwise.
    const base = { id: DEBUG_TOAST_ID, duration: Infinity };

    if (kind === 'success') {
      toast.success(copy.success.sample, { ...base, action: undefined });
      return;
    }
    if (kind === 'error') {
      toast.error(copy.error.sample, {
        ...base,
        action: { label: copy.error.action, onClick: () => undefined },
      });
      return;
    }
    if (kind === 'loading') {
      toast.loading(copy.loading.sample, {
        ...base,
        action: {
          label: copy.loading.action,
          onClick: () => {
            toast.dismiss(DEBUG_TOAST_ID);
            setToastFixture('off');
          },
        },
      });
      return;
    }
    if (kind === 'resolve') {
      toast.success(copy.resolve.sample, { ...base, action: undefined });
      return;
    }
    toast.error(copy.reject.sample, {
      ...base,
      action: { label: copy.reject.action, onClick: () => undefined },
    });
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <Tooltip open={labelOpen && !menuOpen} onOpenChange={setLabelOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='shrink-0'
              aria-label={ADMIN_DEBUG_COPY.label}
            >
              <Bug aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{ADMIN_DEBUG_COPY.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align='end'
        side='bottom'
        className='min-w-52'
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel>{ADMIN_DEBUG_COPY.chromeGroup}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DebugSubmenu label={copy.label} icon={Bell}>
            {TOAST_FIXTURES.map((kind) => {
              const Icon = TOAST_FIXTURE_ICONS[kind];

              return (
                <DropdownMenuCheckboxItem
                  key={kind}
                  checked={toastFixture === kind}
                  variant={kind === 'reject' ? 'destructive' : 'default'}
                  onSelect={(event) => {
                    event.preventDefault();
                    showToastFixture(kind);
                  }}
                >
                  <Icon aria-hidden='true' />
                  <DebugActionCopy
                    label={copy[kind].label}
                    hint={copy[kind].hint}
                  />
                </DropdownMenuCheckboxItem>
              );
            })}
          </DebugSubmenu>
          <DebugSubmenu label={preview.label} icon={MonitorPlay}>
            <DropdownMenuCheckboxItem
              checked={pausePreviewIframe.enabled}
              onCheckedChange={(checked) =>
                pausePreviewIframe.setEnabled(checked === true)
              }
              onSelect={(event) => event.preventDefault()}
            >
              <Pause aria-hidden='true' />
              <DebugActionCopy
                label={preview.pauseIframe.label}
                hint={preview.pauseIframe.hint}
              />
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={forceSkeleton.enabled}
              onCheckedChange={(checked) =>
                forceSkeleton.setEnabled(checked === true)
              }
              onSelect={(event) => event.preventDefault()}
            >
              <ImageOff aria-hidden='true' />
              <DebugActionCopy
                label={preview.forceSkeleton.label}
                hint={preview.forceSkeleton.hint}
              />
            </DropdownMenuCheckboxItem>
          </DebugSubmenu>
          <DebugSubmenu label={navigation.label} icon={Route}>
            <DropdownMenuCheckboxItem
              checked={forceNavProgress.enabled}
              onCheckedChange={(checked) =>
                forceNavProgress.setEnabled(checked === true)
              }
              onSelect={(event) => event.preventDefault()}
            >
              <Loader aria-hidden='true' />
              <DebugActionCopy
                label={navigation.forceProgress.label}
                hint={navigation.forceProgress.hint}
              />
            </DropdownMenuCheckboxItem>
          </DebugSubmenu>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{ADMIN_DEBUG_COPY.guide.group}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DebugSubmenu
            label={ADMIN_DEBUG_COPY.guide.label}
            icon={MessageCircle}
          >
            {ADMIN_GUIDE_SCENARIOS.map((scenario) => {
              const Icon = GUIDE_SCENARIO_ICONS[scenario.id];

              return (
                <DropdownMenuCheckboxItem
                  key={scenario.id}
                  checked={guideScenario === scenario.id}
                  onSelect={(event) => {
                    event.preventDefault();
                    setGuideScenario(scenario.id);
                    guideDock.setEnabled(true);
                    loadAdminGuideScenario(scenario.id);
                  }}
                >
                  <Icon aria-hidden='true' />
                  <DebugActionCopy
                    label={scenario.label}
                    hint={scenario.hint}
                  />
                </DropdownMenuCheckboxItem>
              );
            })}
          </DebugSubmenu>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
