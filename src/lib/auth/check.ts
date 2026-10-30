import { auth } from "@/lib/auth/server";

export const AUTHORIZED_ADMIN_EMAIL = "kdisharoon@gmail.com";

export async function checkAdminSession() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { authorized: false, status: 401, error: "Authentication required" as const };
    }

    const email = session.user.email?.toLowerCase().trim();
    if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase().trim()) {
      return {
        authorized: false,
        status: 403,
        error: `Access denied. ${session.user.email} is not authorized.` as const,
      };
    }

    return { authorized: true, user: session.user, session: session.session };
  } catch (err) {
    console.error("Auth verification error:", err);
    return { authorized: false, status: 401, error: "Failed to verify session" as const };
  }
}
