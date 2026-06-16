import './AiAssistant.css';

export function AiChatPanelFallback() {
  return (
    <div
      className='ai-panel-fallback tour-glass-panel--ai'
      role='status'
      aria-live='polite'
      aria-label='Loading Virtual Tour Guide'
    />
  );
}
