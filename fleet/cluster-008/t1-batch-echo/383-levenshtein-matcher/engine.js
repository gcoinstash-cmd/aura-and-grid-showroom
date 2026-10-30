/**
 * Unit #383: Levenshtein String Distance & Fuzzy Similarity Matcher
 * Track 1 (Lean Tuner) — Memory-Optimized Dynamic Programming Distance Rig
 */

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Swap to ensure b is the shorter string (minimizes row array size)
  if (a.length < b.length) [a, b] = [b, a];

  let prevRow = new Int32Array(b.length + 1);
  let currRow = new Int32Array(b.length + 1);

  for (let j = 0; j <= b.length; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    currRow[0] = i;
    const aChar = a.charCodeAt(i - 1);

    for (let j = 1; j <= b.length; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,       // Insertion
        prevRow[j] + 1,           // Deletion
        prevRow[j - 1] + cost     // Substitution
      );
    }

    // Copy currRow to prevRow
    prevRow.set(currRow);
  }

  return currRow[b.length];
}

export function similarityRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Number((1.0 - dist / maxLen).toFixed(4));
}

export function findBestMatch(target, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { bestMatch: null, ratings: [] };
  }

  const ratings = candidates.map(candidate => ({
    target: candidate,
    distance: levenshteinDistance(target, candidate),
    similarity: similarityRatio(target, candidate)
  }));

  ratings.sort((a, b) => b.similarity - a.similarity);

  return {
    bestMatch: ratings[0],
    ratings
  };
}
