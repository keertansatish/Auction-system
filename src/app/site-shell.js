"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/signin";
  const supabase = useMemo(() => createClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setIsLoggedIn(Boolean(data.session));
        setIsAuthReady(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setIsLoggedIn(Boolean(session));
          setIsAuthReady(true);
        }
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    router.push("/signin");
    router.refresh();
  }

  if (isAuthPage) return children;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/55 dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-950">A</span>
            <span>MyAuction</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <Link href="/#overview" className="transition hover:text-slate-900 dark:hover:text-white">Overview</Link>
            <Link href="/create-auction" className="transition hover:text-slate-900 dark:hover:text-white">Create auction</Link>
            <Link href="/live-auction" className="transition hover:text-slate-900 dark:hover:text-white">Live auction</Link>
            <Link href="/#analytics" className="transition hover:text-slate-900 dark:hover:text-white">Analytics</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/create-auction" className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">New listing</Link>
            {isAuthReady && !isLoggedIn ? (
              <Link href="/signin" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:text-white">
                Sign in
              </Link>
            ) : null}
            {isAuthReady && isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            ) : null}
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
