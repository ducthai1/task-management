import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Allowed redirect paths (whitelist)
const ALLOWED_REDIRECTS = ["/", "/projects", "/login", "/signup", "/reset-password"];

function isValidRedirect(path: string): boolean {
  // Only allow relative paths starting with /
  if (!path.startsWith("/")) return false;
  // Block protocol-relative URLs
  if (path.startsWith("//")) return false;
  // Check if path starts with allowed prefix
  return ALLOWED_REDIRECTS.some((allowed) =>
    path === allowed || path.startsWith(`${allowed}/`)
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Validate redirect URL to prevent open redirect
  const redirectPath = isValidRedirect(next) ? next : "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }

      console.error("Auth callback error:", error.message);
    } catch (error) {
      console.error("Auth callback exception:", error);
    }
  }

  // Return the user to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
