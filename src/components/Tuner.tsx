import { useCallback, useEffect, useMemo } from "react";
import { useAudioTuner } from "../hooks/useAudioTuner";
import { useMicrophone } from "../hooks/useMicrophone";
import { frequencyToNoteInfo } from "../utils/music";

const CENTS_IN_TUNE = 5;
const NEEDLE_STEP_CENTS = 10;

const NEEDLE_LEFT_CLASS_BY_PERCENT = new Map<number, string>([
  [0, "left-0"],
  [10, "left-[10%]"],
  [20, "left-[20%]"],
  [30, "left-[30%]"],
  [40, "left-[40%]"],
  [50, "left-1/2"],
  [60, "left-[60%]"],
  [70, "left-[70%]"],
  [80, "left-[80%]"],
  [90, "left-[90%]"],
  [100, "left-full"],
]);

const formatFrequency = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kHz`;
  }
  return `${value.toFixed(1)} Hz`;
};

export const Tuner = () => {
  const microphone = useMicrophone();
  const tuner = useAudioTuner();

  const noteInfo = useMemo(() => {
    if (!tuner.frequencyHz) {
      return null;
    }
    return frequencyToNoteInfo(tuner.frequencyHz);
  }, [tuner.frequencyHz]);

  const cents = noteInfo?.cents ?? null;
  const centsRounded = cents === null ? null : Math.round(cents);

  const isInTune =
    centsRounded !== null && Math.abs(centsRounded) <= CENTS_IN_TUNE;

  const onStart = useCallback(async (): Promise<void> => {
    if (!microphone.stream) {
      await microphone.requestAccess();
    }
  }, [microphone]);

  useEffect(() => {
    if (microphone.stream && tuner.status !== "running") {
      void tuner.start(microphone.stream);
    }
  }, [microphone.stream, tuner]);

  const onStop = useCallback((): void => {
    tuner.stop();
    microphone.stop();
  }, [microphone, tuner]);

  const statusLabel = useMemo(() => {
    if (tuner.status === "running") {
      return "Escuchando micrófono…";
    }
    if (microphone.status === "requesting") {
      return "Solicitando permiso…";
    }
    if (microphone.status === "error" || tuner.status === "error") {
      return "Error";
    }
    return "Listo para iniciar";
  }, [microphone.status, tuner.status]);

  const errorMessage = microphone.errorMessage ?? tuner.errorMessage;

  const needleOffsetCents =
    centsRounded === null ? 0 : Math.max(-50, Math.min(50, centsRounded));
  const needleBucketCents =
    Math.round(needleOffsetCents / NEEDLE_STEP_CENTS) * NEEDLE_STEP_CENTS;
  const needleLeftPercent = 50 + needleBucketCents;
  const needleLeftClass =
    NEEDLE_LEFT_CLASS_BY_PERCENT.get(needleLeftPercent) ?? "left-1/2";

  return (
    <section className="w-full max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Afinador</h1>
            <p className="mt-1 text-sm text-slate-300">{statusLabel}</p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-center">
              <div className="text-xs text-slate-400">Nota</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {noteInfo?.noteLabel ?? "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-center">
              <div className="text-xs text-slate-400">Frecuencia</div>
              <div className="mt-2 text-lg font-medium tracking-tight">
                {tuner.frequencyHz ? formatFrequency(tuner.frequencyHz) : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-center">
              <div className="text-xs text-slate-400">Cents</div>
              <div
                className={[
                  "mt-2 text-lg font-medium tracking-tight",
                  isInTune ? "text-emerald-300" : "text-slate-50",
                ].join(" ")}
              >
                {centsRounded === null ? "—" : `${centsRounded > 0 ? "+" : ""}${centsRounded}`}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>♭</span>
              <span className={isInTune ? "text-emerald-300" : ""}>Afinado</span>
              <span>♯</span>
            </div>

            <div className="relative mt-2 h-3 w-full rounded-full bg-white/10">
              <div
                className={[
                  "absolute top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  needleLeftClass,
                  isInTune ? "bg-emerald-300" : "bg-slate-200",
                ].join(" ")}
              />
              <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-white/30" />
            </div>

            <div className="mt-2 text-center text-xs text-slate-400">
              {noteInfo ? (
                <>
                  Objetivo: {formatFrequency(noteInfo.targetFrequencyHz)} •
                  Claridad:{" "}
                  {tuner.clarity === null ? "—" : `${Math.round(tuner.clarity * 100)}%`}
                </>
              ) : (
                <>Toca una cuerda para detectar la nota.</>
              )}
            </div>
          </div>

          {errorMessage ? (
            <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {tuner.status !== "running" ? (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Iniciar
              </button>
            ) : (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-slate-50 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Detener
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
