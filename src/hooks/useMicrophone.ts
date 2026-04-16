import { useCallback, useMemo, useState } from "react";

type MicrophoneStatus = "idle" | "requesting" | "ready" | "error";

interface UseMicrophoneResult {
  status: MicrophoneStatus;
  stream: MediaStream | null;
  errorMessage: string | null;
  requestAccess: () => Promise<void>;
  stop: () => void;
}

const stopMediaStream = (stream: MediaStream): void => {
  for (const track of stream.getTracks()) {
    track.stop();
  }
};

export const useMicrophone = (): UseMicrophoneResult => {
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestAccess = useCallback(async (): Promise<void> => {
    setErrorMessage(null);
    setStatus("requesting");

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      setStream((current) => {
        if (current) {
          stopMediaStream(current);
        }
        return nextStream;
      });
      setStatus("ready");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo acceder al micrófono.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  const stop = useCallback((): void => {
    setStream((current) => {
      if (current) {
        stopMediaStream(current);
      }
      return null;
    });
    setStatus("idle");
  }, []);

  return useMemo(
    () => ({
      status,
      stream,
      errorMessage,
      requestAccess,
      stop,
    }),
    [errorMessage, requestAccess, status, stop, stream],
  );
};

