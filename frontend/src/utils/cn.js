export function cn(...parts) {
  return parts
    .flatMap((p) => {
      if (!p) return [];
      if (typeof p === "string") return [p];
      if (Array.isArray(p)) return p;
      return Object.entries(p)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);
    })
    .join(" ");
}
