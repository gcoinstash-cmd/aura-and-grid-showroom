import { GF_T3_199_SPEC_MARKDOWN } from '../data/specContent';

export function downloadSpecMarkdown() {
  const blob = new Blob([GF_T3_199_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'GF_T3_199_SPEC.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
