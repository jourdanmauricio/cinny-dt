import { useCallback, useEffect, useRef, useState } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'denied';

export type MediaRecorderResult = {
  blob: Blob;
  durationMs: number;
  mimeType: string;
};

export type UseMediaRecorderReturn = {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
};

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];

function getSupportedMimeType(): string {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }
  return '';
}

export function useMediaRecorder(
  onStop: (result: MediaRecorderResult) => void
): UseMediaRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const usedMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: usedMimeType });
        cleanup();
        setRecordingState('idle');
        onStop({ blob, durationMs, mimeType: usedMimeType });
      };

      recorder.start();
      setRecordingState('recording');
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      ) {
        setRecordingState('denied');
      }
      cleanup();
    }
  }, [onStop, cleanup]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.pause();
      setRecordingState('paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'paused') {
      recorderRef.current.resume();
      setRecordingState('recording');
    }
  }, []);

  return { recordingState, startRecording, stopRecording, pauseRecording, resumeRecording };
}
