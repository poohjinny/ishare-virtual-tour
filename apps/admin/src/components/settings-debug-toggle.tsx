'use client';

import { SwitchField } from '@/components/form-field';
import { useShowAdminDebug } from '@/lib/admin-debug';
import { ADMIN_DEBUG_COPY } from '@/lib/authoring-copy';

export function SettingsDebugToggle() {
  const debugMenu = useShowAdminDebug();

  return (
    <SwitchField
      id='settings-debug-menu'
      label={ADMIN_DEBUG_COPY.chrome.label}
      hint={ADMIN_DEBUG_COPY.chrome.hint}
      checked={debugMenu.enabled}
      onCheckedChange={debugMenu.setEnabled}
    />
  );
}
