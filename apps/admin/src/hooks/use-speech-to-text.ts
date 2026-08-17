'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

/**
 * Trimmed port of the viewer's `useSpeechToText` (tour-viewer/src/hooks) for the
 * Admin Guide composer: same lifecycle and silence auto-commit, without the Web
 * Audio level meter that drives the viewer's listening halo.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Pause after the last heard speech before auto-stop + commit. */
export const SPEECH_SILENCE_COMMIT_MS = 2000;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function resolveSpeechLang(): string {
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  if (nav.toLowerCase().startsWith('ko')) return 'ko-KR';
  if (nav) return nav;
  return 'en-US';
}

/** Support cannot change mid-session, so nothing ever notifies the store. */
function subscribeToSupport(): () => void {
  return () => {};
}

function joinTranscript(...parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useSpeechToText(options?: {
  lang?: string;
  onFinal?: (transcript: string) => void;
  silenceCommitMs?: number;
}) {
  const onFinalRef = useRef(options?.onFinal);
  const silenceCommitMs = options?.silenceCommitMs ?? SPEECH_SILENCE_COMMIT_MS;
  const lang = options?.lang ?? resolveSpeechLang();

  useEffect(() => {
    onFinalRef.current = options?.onFinal;
  }, [options?.onFinal]);

  // `false` on the server so the mic only appears after hydration.
  const supported = useSyncExternalStore(
    subscribeToSupport,
    () => getSpeechRecognitionCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalizedRef = useRef('');
  const interimRef = useRef('');
  const silenceTimerRef = useRef<number | null>(null);
  /** User/browser ended the session — commit the transcript on `onend`. */
  const shouldCommitRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current == null) return;
    window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearSilenceTimer();
    shouldCommitRef.current = true;
    const recognition = recognitionRef.current;
    if (!recognition) {
      setListening(false);
      return;
    }
    try {
      recognition.stop();
    } catch {
      /* already stopped */
    }
  }, [clearSilenceTimer]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    setError(null);
    setInterim('');
    finalizedRef.current = '';
    interimRef.current = '';
    shouldCommitRef.current = false;
    clearSilenceTimer();

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    // Keep the session open across short pauses; we auto-stop after silence.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const scheduleSilenceCommit = () => {
      clearSilenceTimer();
      silenceTimerRef.current = window.setTimeout(() => {
        silenceTimerRef.current = null;
        shouldCommitRef.current = true;
        try {
          recognition.stop();
        } catch {
          /* already stopped */
        }
      }, silenceCommitMs);
    };

    recognition.onresult = (event) => {
      let nextInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const piece = result[0]?.transcript?.trim() ?? '';
        if (!piece) continue;
        if (result.isFinal) {
          finalizedRef.current = joinTranscript(finalizedRef.current, piece);
        } else {
          nextInterim = joinTranscript(nextInterim, piece);
        }
      }
      interimRef.current = nextInterim;
      setInterim(joinTranscript(finalizedRef.current, nextInterim));
      scheduleSilenceCommit();
    };

    recognition.onerror = (event) => {
      const code = event.error ?? 'error';
      if (code === 'aborted' || code === 'no-speech') {
        // no-speech: nothing said before the browser timeout — not a hard error.
        shouldCommitRef.current = code !== 'aborted';
        setListening(false);
        return;
      }
      setError(
        code === 'not-allowed' ?
          'Microphone permission is blocked.'
        : 'Voice input failed. Try again or type your question.',
      );
      shouldCommitRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      const transcript = joinTranscript(
        finalizedRef.current,
        interimRef.current,
      );
      const shouldCommit = shouldCommitRef.current;
      finalizedRef.current = '';
      interimRef.current = '';
      shouldCommitRef.current = false;
      recognitionRef.current = null;
      setInterim('');
      setListening(false);
      if (shouldCommit && transcript) onFinalRef.current?.(transcript);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError('Could not start voice input.');
      setListening(false);
      recognitionRef.current = null;
    }
  }, [clearSilenceTimer, lang, silenceCommitMs]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [clearSilenceTimer]);

  return { supported, listening, interim, error, start, stop, toggle };
}
