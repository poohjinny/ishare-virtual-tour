import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ask Guide replies are English tour copy — don't follow a Korean OS locale
 * into ko-KR voices (sounds robotic / mismatched on English text).
 */
function resolveSpeechLang(): string {
  const nav =
    typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  if (nav.startsWith('en-ca') || nav === 'en-ca') return 'en-CA';
  if (nav.startsWith('en-gb') || nav === 'en-gb') return 'en-GB';
  if (nav.startsWith('en-au') || nav === 'en-au') return 'en-AU';
  return 'en-US';
}

/** Strip light markdown so Speech Synthesis reads cleanly. */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^(\s*)([-*•]|\d+[.)])\s+/gm, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Common female voice name tokens across Windows / macOS / Chrome. */
const FEMALE_VOICE_HINT =
  /\b(female|zira|aria|jenny|sara|sarah|susan|samantha|karen|moira|fiona|tessa|veena|raveena|linda|heather|catherine|hazel|serena|natasha|allison|ava|emma|joanna|salli|ivy|kimberly|kendra|olivia|michelle|sonia|google us english)\b/i;

const MALE_VOICE_HINT =
  /\b(male|david|mark|guy|ryan|brandon|matthew|justin|joey|brian|daniel|alex|fred|tom|rishi|google uk english male)\b/i;

const NEURAL_VOICE_HINT =
  /\b(neural|natural|online|premium|enhanced|super\s*wave|wavenet|studio)\b/i;

function voiceLangScore(voice: SpeechSynthesisVoice, lang: string): number {
  const vLang = voice.lang.toLowerCase();
  const want = lang.toLowerCase();
  const base = want.slice(0, 2);
  if (vLang === want) return 3;
  if (vLang.startsWith(base)) return 2;
  if (vLang.startsWith('en')) return 1;
  return 0;
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const scored = voices
    .map((voice) => {
      const langScore = voiceLangScore(voice, lang);
      if (langScore === 0) return null;
      const name = voice.name;
      const neural = NEURAL_VOICE_HINT.test(name) ? 4 : 0;
      const female =
        FEMALE_VOICE_HINT.test(name) ? 3
        : MALE_VOICE_HINT.test(name) ? -2
        : 0;
      // Prefer remote/neural packs when the OS exposes them.
      const remote = voice.localService ? 0 : 1;
      return { voice, score: langScore * 10 + neural + female + remote };
    })
    .filter((row): row is { voice: SpeechSynthesisVoice; score: number } =>
      Boolean(row),
    )
    .sort((a, b) => b.score - a.score);

  return scored[0]?.voice ?? voices.find((v) => v.default) ?? voices[0] ?? null;
}

/**
 * Browser Speech Synthesis — play/stop for Ask Guide assistant replies.
 * Unsupported browsers report `supported: false` so callers can hide the control.
 */
export function useSpeechSynthesis(options?: { lang?: string }) {
  const lang = options?.lang || resolveSpeechLang();
  const [supported] = useState(() => isSpeechSynthesisSupported());
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeakingId(null);
  }, [supported]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (!supported) return;
    // Chrome loads voices asynchronously.
    const warm = () => {
      void window.speechSynthesis.getVoices();
    };
    warm();
    window.speechSynthesis.addEventListener('voiceschanged', warm);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', warm);
    };
  }, [supported]);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!supported) return;
      const cleaned = stripMarkdownForSpeech(text);
      if (!cleaned) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = lang;
      const voice = pickVoice(lang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setSpeakingId(null);
        }
      };
      utterance.onerror = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setSpeakingId(null);
        }
      };
      utteranceRef.current = utterance;
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [lang, supported],
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) {
        stop();
        return;
      }
      speak(id, text);
    },
    [speak, speakingId, stop],
  );

  return { supported, speakingId, speak, stop, toggle };
}
