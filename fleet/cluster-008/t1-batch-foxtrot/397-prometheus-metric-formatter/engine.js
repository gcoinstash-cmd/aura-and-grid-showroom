/**
 * Unit #397: OpenMetrics & Prometheus Text Exposition Formatter
 * Track 1 (Lean Tuner) — Prometheus Exposition Line Protocol Serializer
 */

export function formatMetric(name, value, labels = {}, help = null, type = 'gauge') {
  if (typeof name !== 'string' || !name) {
    throw new TypeError('Metric name must be a non-empty string');
  }

  const lines = [];
  if (help) {
    lines.push(`# HELP ${name} ${help}`);
  }
  if (type) {
    lines.push(`# TYPE ${name} ${type}`);
  }

  const labelKeys = Object.keys(labels).sort();
  let labelStr = '';
  if (labelKeys.length > 0) {
    const parts = labelKeys.map(k => {
      const escapedVal = String(labels[k])
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/"/g, '\\"');
      return `${k}="${escapedVal}"`;
    });
    labelStr = `{${parts.join(',')}}`;
  }

  lines.push(`${name}${labelStr} ${value}`);
  return lines.join('\n');
}

export function formatMetricsBatch(metrics) {
  if (!Array.isArray(metrics)) return '';
  return metrics.map(m => formatMetric(m.name, m.value, m.labels, m.help, m.type)).join('\n') + '\n';
}
