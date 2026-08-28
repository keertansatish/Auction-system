"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function SparkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path strokeLinecap="round" strokeLinejoin="round" d="m12 3 1.35 5.65L19 10l-5.65 1.35L12 17l-1.35-5.65L5 10l5.65-1.35L12 3Z" /><path strokeLinecap="round" d="M19 16v5M21.5 18.5h-5M5 17v4M7 19H3" /></svg>;
}

function EyeIcon({ crossed }) {
  return crossed ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 4.24A9.77 9.77 0 0 1 12 4c5.5 0 9 5.5 9 5.5a16.7 16.7 0 0 1-3.03 3.66M6.23 6.23C3.84 7.9 3 9.5 3 9.5S6.5 15 12 15c.7 0 1.38-.08 2.02-.22" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
}

export default function SignInPage() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isLogin = mode === "login";
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setNotice("");

    const popup = window.open(
      "about:blank",
      "myauction-google-auth",
      "popup,width=500,height=650,resizable=yes,scrollbars=yes",
    );

    if (!popup) {
      setIsGoogleLoading(false);
      setNotice("Please allow pop-ups to sign in with Google.");
      return;
    }

    const handlePopupMessage = async (event) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !== "myauction-google-auth"
      ) {
        return;
      }

      window.removeEventListener("message", handlePopupMessage);

      if (!event.data.success) {
        setIsGoogleLoading(false);
        setNotice("Google sign-in could not be completed. Please try again.");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setIsGoogleLoading(false);
        setNotice("Google sign-in could not be completed. Please try again.");
      }
    };

    window.addEventListener("message", handlePopupMessage);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/");
    callbackUrl.searchParams.set("popup", "1");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      window.removeEventListener("message", handlePopupMessage);
      popup.close();
      setIsGoogleLoading(false);
      setNotice(error.message);
      return;
    }

    if (data?.url) {
      popup.location.href = data.url;
    } else {
      window.removeEventListener("message", handlePopupMessage);
      popup.close();
      setIsGoogleLoading(false);
      setNotice("Unable to start Google sign-in. Please try again.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setNotice(error.message);
          return;
        }

        setNotice("Welcome back — your dashboard is ready.");
        router.push("/");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        setNotice(error.message);
        return;
      }

      setNotice("Your account is ready. Check your email to confirm.");
      setMode("login");
      setName("");
      setPassword("");
    } catch (error) {
      setNotice(error.message || "Something went wrong. Please try again.");
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setNotice("");
  }

  return (
    <main className="auth-page min-h-screen bg-[#f5f7fb] px-4 py-5 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(26,35,63,0.12)] lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        <section className="auth-hero relative overflow-hidden bg-[#111832] px-7 py-8 text-white sm:px-12 sm:py-10 lg:px-14 lg:py-12">
          <div className="auth-grid absolute inset-0 opacity-50" /><div className="auth-orb auth-orb-one absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" /><div className="auth-orb auth-orb-two absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col">
            <Link href="/" className="inline-flex w-fit items-center gap-3 text-sm font-semibold tracking-wide text-white"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#111832] shadow-lg shadow-black/15">A</span><span>MyAuction</span></Link>
            <div className="my-auto py-14 lg:py-20">
              <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-indigo-200 ring-1 ring-white/15"><SparkIcon /></div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">Sell what matters</p>
              <h1 className="mt-5 max-w-md text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">The best things find the right people.</h1>
              <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">A calmer, smarter way to discover rare finds and turn your next listing into a winning moment.</p>
              <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-slate-300"><span>Live now</span><span className="flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> 2,408 bidders</span></div>
                <div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-sm text-slate-300">Modernist lounge chair</p><p className="mt-1 text-xl font-semibold">$840 <span className="text-xs font-normal text-slate-400">current bid</span></p></div><span className="rounded-lg bg-indigo-400/20 px-2.5 py-1.5 text-xs font-medium text-indigo-200">Ends in 02:14</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-300 to-fuchsia-300" /></div>
              </div>
            </div>
            <p className="relative text-xs text-slate-400">Trusted by collectors, creators, and curious minds.</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-9"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-500">Your account</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#111832] sm:text-4xl">{isLogin ? "Welcome back." : "Create your account."}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{isLogin ? "Sign in to pick up where you left off." : "Join a community built around the things worth finding."}</p></div>
            <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium"><button type="button" onClick={() => changeMode("login")} className={`rounded-lg px-4 py-2.5 transition ${isLogin ? "bg-white text-[#111832] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Log in</button><button type="button" onClick={() => changeMode("signup")} className={`rounded-lg px-4 py-2.5 transition ${!isLogin ? "bg-white text-[#111832] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Sign up</button></div>
            <button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><span className="flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold text-[#4285f4]">G</span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</button>
            <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" /> or continue with email <span className="h-px flex-1 bg-slate-200" /></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    name="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Alex Morgan"
                    className="auth-input mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              )}
              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  required
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="auth-input mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <span className="relative mt-2 block">
                  <input
                    required
                    name="password"
                    minLength={6}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isLogin ? "Enter your password" : "At least 6 characters"}
                    className="auth-input w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"><EyeIcon crossed={showPassword} /></button>
                </span>
              </label>
              {isLogin && <div className="flex justify-end"><button type="button" onClick={() => setNotice("Password reset instructions will be sent to your email.")} className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800">Forgot password?</button></div>}
              <button type="submit" className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#111832] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#111832]/15 transition hover:-translate-y-0.5 hover:bg-[#1c274d]">{isLogin ? "Log in to MyAuction" : "Create my account"}<span className="ml-2 text-indigo-300">→</span></button>
            </form>
            {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">{notice}</p>}
            <p className="mt-8 text-center text-xs leading-5 text-slate-400">By continuing, you agree to MyAuction&apos;s <a href="#terms" className="text-slate-600 underline underline-offset-2">Terms</a> and <a href="#privacy" className="text-slate-600 underline underline-offset-2">Privacy Policy</a>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
