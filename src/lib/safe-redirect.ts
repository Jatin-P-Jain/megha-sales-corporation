const SAFE_REDIRECT_BASE = "https://local.invalid";

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value) return fallback;

  const candidate = value.trim();
  if (!candidate) return fallback;

  // Protocol-relative URLs (e.g. //evil.com) should never be allowed.
  if (candidate.startsWith("//")) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(candidate, SAFE_REDIRECT_BASE);
  } catch {
    return fallback;
  }

  // Reject absolute cross-origin targets.
  if (parsed.origin !== SAFE_REDIRECT_BASE) return fallback;

  const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (!normalized.startsWith("/")) return fallback;

  return normalized;
}
