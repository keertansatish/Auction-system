import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const isPopup = requestUrl.searchParams.get("popup") === "1";
  let next = requestUrl.searchParams.get("next") ?? "/";

  // Only allow redirects inside this application.
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isPopup) {
        const popupUrl = new URL("/auth/popup-complete", requestUrl.origin);
        popupUrl.searchParams.set("next", next);
        return NextResponse.redirect(popupUrl);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const errorUrl = new URL(
    isPopup ? "/auth/popup-complete" : "/signin",
    requestUrl.origin,
  );
  errorUrl.searchParams.set("error", "google-auth");
  return NextResponse.redirect(errorUrl);
}
