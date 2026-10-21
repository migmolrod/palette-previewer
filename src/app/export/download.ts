/** Saves text as a file through a temporary link. */
export function downloadText(
  document: Document,
  fileName: string,
  text: string,
  type: string,
): void {
  downloadBlob(document, fileName, new Blob([text], { type }));
}

/** Saves a blob as a file through a temporary link. */
export function downloadBlob(document: Document, fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** File-name-safe form of a palette name. */
export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'palette'
  );
}
