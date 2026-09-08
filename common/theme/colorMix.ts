/**
 * Hex-color math for deriving *variations* of a single brand colour — never a
 * second brand colour of its own.
 *
 * The sign-in screen (`modules/auth/components/BrandHeader.tsx`,
 * `SchoolIllustration.tsx`) needs a multi-stop gradient and a tinted
 * illustration, but has exactly one colour to work from: `palette.primary`,
 * which is this school's own tenant colour when one is set and the app's
 * default otherwise (`modules/branding/useTenantTheme.ts`). Hardcoding a
 * second hue (the way the admin-web reference does with literal blues) would
 * either clash with a tenant's colour or simply ignore it. `shade`/`tint`
 * only ever move the one token that was actually handed in.
 *
 * Lives in `common/theme`, not `modules/auth`, because `modules/**` and
 * `app/**` are linted against raw hex literals (see `eslint.config.js`'s
 * `no-restricted-syntax` block) — the same guard that makes "derive it from
 * the token" the only path through, rather than a nudge that's easy to route
 * around with a local constant.
 */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHexByte(n: number): string {
  return clamp255(n).toString(16).padStart(2, '0');
}

/**
 * Mix `hex` toward black by `amount` (0 = unchanged, 1 = black).
 *
 * Malformed input (an older-shaped tenant palette payload, a seed that
 * resolved to something unexpected) returns `hex` unchanged rather than
 * throwing — a slightly wrong shade is a cosmetic issue; a crashed sign-in
 * screen is not.
 */
export function shade(hex: string, amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  const w = Math.max(0, Math.min(1, amount));
  return `#${toHexByte(c.r * (1 - w))}${toHexByte(c.g * (1 - w))}${toHexByte(c.b * (1 - w))}`;
}

/** Mix `hex` toward white by `amount` (0 = unchanged, 1 = white). Same degrade-on-malformed-input as `shade`. */
export function tint(hex: string, amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  const w = Math.max(0, Math.min(1, amount));
  return `#${toHexByte(c.r + (255 - c.r) * w)}${toHexByte(c.g + (255 - c.g) * w)}${toHexByte(c.b + (255 - c.b) * w)}`;
}
