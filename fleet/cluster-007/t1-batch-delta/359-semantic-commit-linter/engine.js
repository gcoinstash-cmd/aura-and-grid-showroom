/**
 * Unit #359: Semantic Commit Message Linter Engine
 * Track 1 (Lean Tuner) — Conventional Commits 1.0.0 Validator
 */

const VALID_TYPES = new Set([
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'
]);

export function parseCommitParts(message) {
  if (typeof message !== 'string') return null;
  const lines = message.trim().split('\n');
  const header = lines[0].trim();

  const match = header.match(/^([a-z]+)(?:\(([a-zA-Z0-9_.-]+)\))?(!)?\s*:\s*(.+)$/);
  if (!match) return null;

  return {
    rawHeader: header,
    type: match[1],
    scope: match[2] || null,
    isBreaking: Boolean(match[3]) || message.includes('BREAKING CHANGE:'),
    description: match[4].trim(),
    body: lines.slice(1).join('\n').trim() || null
  };
}

export function lintCommitMessage(message) {
  const errors = [];
  const parsed = parseCommitParts(message);

  if (!parsed) {
    errors.push('Header does not follow format "<type>(<scope>): <subject>"');
    return { valid: false, errors, parsed: null };
  }

  if (!VALID_TYPES.has(parsed.type)) {
    errors.push(`Invalid type "${parsed.type}". Must be one of: ${[...VALID_TYPES].join(', ')}`);
  }

  if (parsed.description.length === 0) {
    errors.push('Subject description cannot be empty');
  }

  if (parsed.rawHeader.length > 72) {
    errors.push('Header line exceeds 72 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
    parsed
  };
}
