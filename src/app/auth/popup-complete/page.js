"use client";

import { useEffect } from "react";

export default function PopupCompletePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("error") !== "google-auth";

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: "myauction-google-auth", success },
        window.location.origin,
      );
      window.close();
      return;
    }

    window.location.replace(success ? "/" : "/signin");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <p className="text-sm text-slate-300">Completing Google sign-in...</p>
    </main>
  );
}
