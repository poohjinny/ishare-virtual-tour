import { aiPanelFallbackClassName } from './aiAssistantVariants';

export function AiChatPanelFallback() {
  return (
    <div
      className={aiPanelFallbackClassName}
      role='status'
      aria-live='polite'
      aria-label='Loading Virtual Tour Guide'
    />
  );
}
