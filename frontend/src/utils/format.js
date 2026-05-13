// Profit/fee values arrive from the backend already normalised to USD by the
// monitor (see not-dex-monitor worker.py + util/prices.py). Display with $.
export function formatUsd(value, digits = 2) {
 if (value == null || Number.isNaN(value)) return "--";
 return `$${Number(value).toFixed(digits)}`;
}

// Alias keeps existing imports working; new code should prefer formatUsd.
export const formatEth = formatUsd;

export function formatNumber(value, digits = 4) {
 if (value == null || Number.isNaN(value)) return "--";
 return Number(value).toFixed(digits);
}

export function formatPct(value, digits = 0) {
 if (value == null || Number.isNaN(value)) return "--";
 return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function formatSigned(value, digits = 4) {
 if (value == null || Number.isNaN(value)) return "--";
 const n = Number(value);
 return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;
}

// Signed USD with $ sign placed correctly (e.g. "+$12.34", "-$0.05").
export function formatSignedUsd(value, digits = 2) {
 if (value == null || Number.isNaN(value)) return "--";
 const n = Number(value);
 const sign = n >= 0 ? "+" : "-";
 return `${sign}$${Math.abs(n).toFixed(digits)}`;
}

export function truncateAddress(address, head = 6, tail = 4) {
 if (!address) return "--";
 return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

const DISPLAY_TZ = "Europe/Moscow";

function parseAsUtc(iso) {
 if (!iso) return null;
 // Treat naive ISO strings (no offset) as UTC -- backend always stores UTC.
 const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso);
 return new Date(hasTz ? iso : `${iso}Z`);
}

export function formatClockTime(iso) {
 const d = parseAsUtc(iso);
 if (!d) return "--";
 return d.toLocaleTimeString("ru-RU", {
  timeZone: DISPLAY_TZ,
  hour: "2-digit",
  minute: "2-digit",
 });
}

export function formatDate(iso) {
 const d = parseAsUtc(iso);
 if (!d) return "--";
 return d.toLocaleDateString("ru-RU", { timeZone: DISPLAY_TZ });
}

export function timeAgo(iso) {
 const d = parseAsUtc(iso);
 if (!d) return "--";
 const diff = (Date.now() - d.getTime()) / 1000;
 if (diff < 60) return `${Math.floor(diff)}s`;
 if (diff < 3600) return `${Math.floor(diff / 60)}m`;
 if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
 return `${Math.floor(diff / 86400)}d`;
}
