export function flattenObject(obj: any, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {};

  if (!obj || typeof obj !== 'object') {
    return result;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value === null || value === undefined) {
        result[propName] = '';
      } else if (value instanceof Date) {
        result[propName] = value.toISOString();
      } else if (Array.isArray(value)) {
        result[propName] = value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' | ');
      } else if (typeof value === 'object') {
        Object.assign(result, flattenObject(value, propName));
      } else {
        result[propName] = String(value);
      }
    }
  }

  return result;
}

export function downloadAsCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    console.warn('No data available to export');
    return;
  }

  // Flatten all objects to handle nested structures
  const flattenedData = data.map((item) => flattenObject(item));

  // Extract all unique headers
  const headers = Array.from(
    new Set(flattenedData.flatMap((item) => Object.keys(item)))
  );

  // Generate CSV content
  const csvContent = [
    // Header row
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    // Data rows
    ...flattenedData.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          // Escape quotes and wrap in quotes to handle commas/newlines
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  // Trigger download - BOM ensures Excel correctly reads UTF-8 (handles special characters)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadAsExcel(data: any[], filename: string) {
  downloadAsCSV(data, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function downloadAsWord(data: any[], filename: string, title = 'Report') {
  if (!data || !data.length) return;
  const flattened = data.map((item) => flattenObject(item));
  const headers = Array.from(new Set(flattened.flatMap((item) => Object.keys(item))));

  let html = `<html><head><meta charset='utf-8'><title>${title}</title><style>
    body { font-family: Arial, sans-serif; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #999; padding: 6px; text-align: left; font-size: 10pt; }
    th { background-color: #f2f2f2; font-weight: bold; }
    h2 { color: #1e3a8a; }
  </style></head><body><h2>${title}</h2><p>Generated: ${new Date().toLocaleDateString()}</p><table><thead><tr>`;

  headers.forEach((h) => { html += `<th>${h}</th>`; });
  html += `</tr></thead><tbody>`;
  flattened.forEach((row) => {
    html += `<tr>`;
    headers.forEach((h) => { html += `<td>${row[h] ?? ''}</td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table></body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadAsPowerPoint(data: any[], filename: string, title = 'Report') {
  if (!data || !data.length) return;
  const flattened = data.map((item) => flattenObject(item));
  const headers = Array.from(new Set(flattened.flatMap((item) => Object.keys(item)))).slice(0, 6);

  let html = `<html><head><meta charset='utf-8'><title>${title}</title><style>
    body { font-family: Calibri, sans-serif; }
    .slide { page-break-after: always; padding: 30px; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    th, td { border: 1px solid #ccc; padding: 6px; }
    th { background: #2563eb; color: white; }
  </style></head><body><div class='slide'><h1>${title}</h1><p>ERP Suryadhi Learning Report</p><table><thead><tr>`;
  headers.forEach((h) => { html += `<th>${h}</th>`; });
  html += `</tr></thead><tbody>`;
  flattened.slice(0, 50).forEach((row) => {
    html += `<tr>`;
    headers.forEach((h) => { html += `<td>${row[h] ?? ''}</td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table></div></body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.ppt') ? filename : `${filename}.ppt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printReport(data: any[], title = 'Report') {
  if (!data || !data.length) return;
  const flattened = data.map((item) => flattenObject(item));
  const headers = Array.from(new Set(flattened.flatMap((item) => Object.keys(item))));

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  let html = `<!DOCTYPE html><html><head><title>${title}</title><style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111; }
    h2 { margin-bottom: 4px; color: #1e3a8a; }
    p { margin-top: 0; color: #666; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; text-transform: uppercase; font-size: 10px; }
    tr:nth-child(even) { background: #fbfbfb; }
    @media print { body { padding: 0; } }
  </style></head><body><h2>${title}</h2><p>Report Generated: ${new Date().toLocaleString()}</p><table><thead><tr>`;

  headers.forEach((h) => { html += `<th>${h}</th>`; });
  html += `</tr></thead><tbody>`;
  flattened.forEach((row) => {
    html += `<tr>`;
    headers.forEach((h) => { html += `<td>${row[h] ?? ''}</td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table><script>window.onload = function() { window.print(); window.close(); };<\/script></body></html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

export const downloadAsPDF = printReport;
