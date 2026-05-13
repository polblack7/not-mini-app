/**
 * Trigger a file download from a server-rendered URL that returns
 * `Content-Disposition: attachment`. Routes through Telegram.WebApp.openLink
 * when running inside a Mini App so the user's external browser handles the
 * download natively -- mobile WebViews can't honour <a download> for blob:
 * URLs and show an "Open with..." prompt instead.
 */
export function downloadFile(url, _filename) {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg && typeof tg.openLink === "function") {
    tg.openLink(url);
    return;
  }
  window.open(url, "_blank");
}

// Backwards-compat: legacy blob-based downloader (kept for any callers that
// still pass a Blob directly; not used by Reports export anymore).
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
