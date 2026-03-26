export function durationToSeconds(input: string) {
  const normalized = input.trim();
  const match = normalized.match(/^(\d+)([smhd])$/i);

  if (!match) {
    return undefined;
  }

  const [, rawValue, unit] = match;
  const value = Number.parseInt(rawValue, 10);

  switch (unit.toLowerCase()) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return undefined;
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

export function isJwtExpired(token: string) {
  try {
    const parts = token.split('.');

    if (parts.length < 2) {
      return true;
    }

    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number };

    if (!payload.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now() + 15_000;
  } catch {
    return true;
  }
}
