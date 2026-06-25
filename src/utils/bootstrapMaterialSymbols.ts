const MATERIAL_SYMBOLS_FAMILY = 'Material Symbols Rounded';
const READY_CLASS = 'material-symbols-ready';
/** Show ligature text if the font never loads (offline / blocked). */
const FALLBACK_MS = 8000;

/** Mark document when Material Symbols is usable — pairs with material-symbols.css. */
export function bootstrapMaterialSymbols(): void {
  const root = document.documentElement;
  const markReady = () => root.classList.add(READY_CLASS);

  if (document.fonts?.load) {
    void document.fonts
      .load(`1em "${MATERIAL_SYMBOLS_FAMILY}"`)
      .then(markReady)
      .catch(markReady);
  } else {
    markReady();
  }

  window.setTimeout(markReady, FALLBACK_MS);
}
