import { useCallback, useMemo, useRef, useState } from "react";
import { detectPitchYin } from "../lib/yin";

const DEFAULT_FFT_SIZE = 4096;
const DEFAULT_UPDATE_INTERVAL_MS = 60;
const MIN_CLARITY = 0.6;

type TunerStatus = "idle" | "running" | "error";

interface AudioTunerState {
  status: TunerStatus;
  frequencyHz: number | null;
  clarity: number | null;
  errorMessage: string | null;
}

interface UseAudioTunerResult extends AudioTunerState {
  start: (stream: MediaStream) => Promise<void>;
  stop: () => void;
}

export const useAudioTuner = (): UseAudioTunerResult => {
  const [state, setState] = useState<AudioTunerState>({
    status: "idle",
    frequencyHz: null,
    clarity: null,
    errorMessage: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const stop = useCallback((): void => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;

    sourceRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;

    if (audioContext) {
      void audioContext.close();
    }

    setState((current) => ({
      ...current,
      status: "idle",
      frequencyHz: null,
      clarity: null,
      errorMessage: null,
    }));
  }, []);

  const start = useCallback(
    async (stream: MediaStream): Promise<void> => {
      try {
        stop();

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = DEFAULT_FFT_SIZE;
        analyser.smoothingTimeConstant = 0;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyserRef.current = analyser;
        sourceRef.current = source;
        bufferRef.current = new Float32Array(
          analyser.fftSize,
        ) as Float32Array<ArrayBuffer>;

        await audioContext.resume();

        setState((current) => ({
          ...current,
          status: "running",
          errorMessage: null,
        }));

        const tick = (nowMs: number): void => {
          const analyserNode = analyserRef.current;
          const audioCtx = audioContextRef.current;
          const buffer = bufferRef.current;

          if (!analyserNode || !audioCtx || !buffer) {
            return;
          }

          rafIdRef.current = requestAnimationFrame(tick);

          if (nowMs - lastUpdateRef.current < DEFAULT_UPDATE_INTERVAL_MS) {
            return;
          }
          lastUpdateRef.current = nowMs;

          analyserNode.getFloatTimeDomainData(buffer);
          const result = detectPitchYin(buffer, audioCtx.sampleRate);

          if (!result || result.clarity < MIN_CLARITY) {
            setState((current) => ({
              ...current,
              frequencyHz: null,
              clarity: result?.clarity ?? null,
            }));
            return;
          }

          setState((current) => ({
            ...current,
            frequencyHz: result.frequencyHz,
            clarity: result.clarity,
          }));
        };

        rafIdRef.current = requestAnimationFrame(tick);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Error al iniciar el afinador.";
        setState({
          status: "error",
          frequencyHz: null,
          clarity: null,
          errorMessage: message,
        });
      }
    },
    [stop],
  );

  return useMemo(
    () => ({
      ...state,
      start,
      stop,
    }),
    [start, state, stop],
  );
};
