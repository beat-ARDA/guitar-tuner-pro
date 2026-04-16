const DEFAULT_THRESHOLD = 0.15;

interface YinPitchResult {
  frequencyHz: number;
  clarity: number;
}

const parabolicInterpolation = (
  values: Float32Array,
  tau: number,
): number => {
  const x0 = tau < 1 ? tau : tau - 1;
  const x2 = tau + 1 < values.length ? tau + 1 : tau;

  if (x0 === tau || x2 === tau) {
    return tau;
  }

  const s0 = values[x0];
  const s1 = values[tau];
  const s2 = values[x2];

  const denominator = 2 * (2 * s1 - s2 - s0);
  if (denominator === 0) {
    return tau;
  }

  return tau + (s2 - s0) / denominator;
};

export const detectPitchYin = (
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = DEFAULT_THRESHOLD,
): YinPitchResult | null => {
  if (buffer.length < 32 || sampleRate <= 0) {
    return null;
  }

  const halfBufferLength = Math.floor(buffer.length / 2);
  const difference = new Float32Array(halfBufferLength);
  const cumulativeMeanNormalized = new Float32Array(halfBufferLength);

  for (let tau = 1; tau < halfBufferLength; tau += 1) {
    let sum = 0;
    for (let i = 0; i < halfBufferLength; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  cumulativeMeanNormalized[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfBufferLength; tau += 1) {
    runningSum += difference[tau];
    const normalized = runningSum === 0 ? 1 : difference[tau] * (tau / runningSum);
    cumulativeMeanNormalized[tau] = normalized;
  }

  let tauEstimate: number | null = null;
  for (let tau = 2; tau < halfBufferLength; tau += 1) {
    if (cumulativeMeanNormalized[tau] < threshold) {
      while (
        tau + 1 < halfBufferLength &&
        cumulativeMeanNormalized[tau + 1] < cumulativeMeanNormalized[tau]
      ) {
        tau += 1;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === null) {
    return null;
  }

  const refinedTau = parabolicInterpolation(cumulativeMeanNormalized, tauEstimate);
  if (refinedTau <= 0) {
    return null;
  }

  const frequencyHz = sampleRate / refinedTau;
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return null;
  }

  const cmndf = cumulativeMeanNormalized[tauEstimate];
  const clarity = Math.max(0, Math.min(1, 1 - cmndf));

  return { frequencyHz, clarity };
};
