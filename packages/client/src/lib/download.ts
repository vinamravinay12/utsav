/**
 * Hands the browser a generated file. Built in memory as a Blob, so nothing is
 * uploaded anywhere and the strict CSP needs no exception.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const objectUrl = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

/** "Asha & Rohan's wedding" → "asha-rohan-s-wedding". */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'event';
