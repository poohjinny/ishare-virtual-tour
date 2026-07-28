import { useCallback, useEffect, useRef, useState } from 'react';

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

type VoiceMeter = { stream: MediaStream; context: AudioContext; raf: number };

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechToTextSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

function resolveSpeechLang(): string {
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  if (nav.toLowerCase().startsWith('ko')) return 'ko-KR';
  if (nav) return nav;
  return 'en-US';
}

function computeRms(samples: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const centered = ((samples[i] ?? 128) - 128) / 128;
    sum += centered * centered;
  }
  return Math.sqrt(sum / Math.max(samples.length, 1));
}

/**
 * Browser Web Speech API — Chrome/Edge best; unsupported browsers report
 * `supported: false` so callers can hide the mic.
 * While listening, optionally meters mic volume via Web Audio (`level` 0–1).
 */
export function useSpeechToText(options?: {
  lang?: string;
  onFinal?: (transcript: string) => void;
}) {
  const onFinalRef = useRef(options?.onFinal);
  onFinalRef.current = options?.onFinal;
  const lang = options?.lang ?? resolveSpeechLang();

  const [supported] = useState(() => isSpeechToTextSupported());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** Smoothed mic loudness 0–1 while listening (0 when idle / meter unavailable). */
  const [level, setLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const meterRef = useRef<VoiceMeter | null>(null);
  const levelSmoothRef = useRef(0);
  const lastLevelPublishRef = useRef(0);

  const stopMeter = useCallback(() => {
    const meter = meterRef.current;
    meterRef.current = null;
    if (meter) {
      cancelAnimationFrame(meter.raf);
      for (const track of meter.stream.getTracks()) track.stop();
      void meter.context.close().catch(() => {
        /* already closed */
      });
    }
    levelSmoothRef.current = 0;
    lastLevelPublishRef.current = 0;
    setLevel(0);
  }, []);

  const startMeter = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }
    stopMeter();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      const context = new AudioCtx();
      if (context.state === 'suspended') {
        await context.resume().catch(() => {
          /* autoplay policies */
        });
      }
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      const meter: VoiceMeter = { stream, context, raf: 0 };
      meterRef.current = meter;

      const tick = (now: number) => {
        if (meterRef.current !== meter) return;
        analyser.getByteTimeDomainData(samples);
        const rms = computeRms(samples);
        // Map quiet speech into a visible range; clamp peaks.
        const boosted = Math.min(1, Math.pow(rms * 3.2, 0.85));
        levelSmoothRef.current = levelSmoothRef.current * 0.55 + boosted * 0.45;
        if (now - lastLevelPublishRef.current >= 40) {
          lastLevelPublishRef.current = now;
          setLevel(levelSmoothRef.current);
        }
        meter.raf = requestAnimationFrame(tick);
      };
      meter.raf = requestAnimationFrame(tick);
    } catch {
      /* Meter is decorative — speech can still work without it. */
    }
  }, [stopMeter]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setListening(false);
      stopMeter();
      return;
    }
    try {
      recognition.stop();
    } catch {
      /* already stopped */
    }
  }, [stopMeter]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    setError(null);
    setInterim('');

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const piece = result[0]?.transcript?.trim() ?? '';
        if (!piece) continue;
        if (result.isFinal) finalText += `${piece} `;
        else interimText += `${piece} `;
      }
      if (interimText) setInterim(interimText.trim());
      const trimmedFinal = finalText.trim();
      if (trimmedFinal) {
        setInterim('');
        onFinalRef.current?.(trimmedFinal);
      }
    };

    recognition.onerror = (event) => {
      const code = event.error ?? 'error';
      if (code === 'aborted' || code === 'no-speech') {
        setListening(false);
        return;
      }
      if (code === 'not-allowed') {
        setError('Microphone permission is blocked.');
      } else {
        setError('Voice input failed. Try again or type your question.');
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
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
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    if (!listening) {
      stopMeter();
      return;
    }
    void startMeter();
    return () => {
      stopMeter();
    };
  }, [listening, startMeter, stopMeter]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
      stopMeter();
    };
  }, [stopMeter]);

  return {
    supported,
    listening,
    interim,
    level,
    error,
    start,
    stop,
    toggle,
    clearError: () => setError(null),
  };
}
