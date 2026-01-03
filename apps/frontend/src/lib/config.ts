/**
 * Frontend configuration.
 *
 * NEXT_PUBLIC_* vars are inlined at build time by Next.js.
 * They MUST be accessed directly as string literals for Next.js to replace them.
 */

// Next.js requires direct string literal access - can't use dynamic lookups
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

// Validate at module load
if (!API_URL) {
  throw new Error(
    'Missing NEXT_PUBLIC_API_URL environment variable.\n' +
    'Set it in your root .env file or apps/frontend/.env.local'
  );
}

if (!WS_URL) {
  throw new Error(
    'Missing NEXT_PUBLIC_WS_URL environment variable.\n' +
    'Set it in your root .env file or apps/frontend/.env.local'
  );
}

export const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL,
} as const;
