import { createNeonAuth } from "@neon/auth/next/server";

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  "fallback_secret_must_be_at_least_32_chars_long_for_build_step";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "https://auth.neon.tech",
  cookies: { secret: cookieSecret },
});
