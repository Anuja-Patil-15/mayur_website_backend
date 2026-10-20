// Same formulas as the original HTML tracker.
const pct = (n, d) => (d > 0 ? (100 * n) / d : null);

export function computeScores({ a, b, c, d, e, total, timeMinutes }) {
  return {
    learningScore: (100 * (2 * a + 0.5 * b + d + 0.5 * e)) / (2 * total),
    conceptualClarity: pct(a, total),
    previouslyLearned: pct(a, a + b + c + e),
    retrievalReliability: pct(a, a + b),
    mcqsPerHour: timeMinutes > 0 ? (total * 60) / timeMinutes : null,
  };
}
