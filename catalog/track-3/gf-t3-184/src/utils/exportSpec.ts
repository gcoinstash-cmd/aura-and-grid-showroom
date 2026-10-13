import { GF_T3_184_SPEC_MARKDOWN } from './specContent';

export function exportSpecMarkdown() {
  const blob = new Blob([GF_T3_184_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'GF_T3_184_SPEC.md';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
