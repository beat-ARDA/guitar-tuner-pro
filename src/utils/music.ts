const A4_FREQUENCY_HZ = 440;
const A4_MIDI = 69;

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

interface NoteInfo {
  noteName: NoteName;
  octave: number;
  noteLabel: string;
  targetFrequencyHz: number;
  cents: number;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const frequencyToNoteInfo = (frequencyHz: number): NoteInfo | null => {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return null;
  }

  const midiFloat = A4_MIDI + 12 * Math.log2(frequencyHz / A4_FREQUENCY_HZ);
  const midi = Math.round(midiFloat);

  const noteIndex = ((midi % 12) + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex];
  const octave = Math.floor(midi / 12) - 1;

  const targetFrequencyHz =
    A4_FREQUENCY_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
  const cents = clamp((midiFloat - midi) * 100, -50, 50);

  return {
    noteName,
    octave,
    noteLabel: `${noteName}${octave}`,
    targetFrequencyHz,
    cents,
  };
};

