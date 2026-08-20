"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import * as Ably from "ably";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const incrementOptions = [5, 10, 15];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function LiveAuctionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-white to-slate-100 px-6 py-10 text-slate-900 sm:px-8 lg:px-12">
          <section className="mx-auto w-full max-w-6xl py-8">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-12 shadow-sm shadow-slate-200/60 backdrop-blur text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-amber-400 border-t-transparent" />
              <p className="mt-4 text-slate-500">Loading auctions…</p>
            </div>
          </section>
        </main>
      }
    >
      <LiveAuctionContent />
    </Suspense>
  );
}

function LiveAuctionContent() {
  const searchParams = useSearchParams();
  const auctionId = searchParams.get("id");

  // Single-auction mode (when ?id= is present)
  const [auction, setAuction] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedIncrement, setSelectedIncrement] = useState(incrementOptions[0]);
  const [connectionState, setConnectionState] = useState("connecting");
  const [isBidding, setIsBidding] = useState(false);

  // All-auctions mode (no ?id=)
  const [auctions, setAuctions] = useState([]);

  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuctions() {
      setIsLoading(true);

      try {
        if (auctionId) {
          // Fetch a single auction
          const response = await fetch(`/api/auctions?id=${auctionId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || "Unable to load auction.");
          }

          if (!data.auction) {
            throw new Error("No auction found. Create one first.");
          }

          setAuction(data.auction);
          setCurrentPrice(
            Number(data.state?.currentPrice ?? data.auction.starting_price ?? 0),
          );
        } else {
          // Fetch all auctions
          const response = await fetch("/api/auctions");
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || "Unable to load auctions.");
          }

          setAuctions(data.auctions || []);

          if (!data.auctions || data.auctions.length === 0) {
            setStatus({
              kind: "info",
              message: "No auctions found yet. Create your first one!",
            });
          }
        }
      } catch (error) {
        setStatus({
          kind: "error",
          message:
            error instanceof Error ? error.message : "Unexpected load failure.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadAuctions();
  }, [auctionId]);

  useEffect(() => {
    if (!auctionId || !auction) {
      return undefined;
    }

    let isMounted = true;

    const realtime = new Ably.Realtime({
      authMethod: "POST",
      authUrl: `/api/ably/token?auctionId=${encodeURIComponent(auctionId)}`,
    });
    const channel = realtime.channels.get(`auction:${auctionId}`);

    function refreshSnapshot() {
      fetch(`/api/auctions?id=${auctionId}`)
        .then((response) => response.json())
        .then((data) => {
          if (isMounted && data.state?.currentPrice !== undefined) {
            setCurrentPrice(Number(data.state.currentPrice));
          }
        })
        .catch(() => undefined);
    }

    function handleBidEvent(message) {
      const event = message.data;
      if (isMounted && event?.currentPrice !== undefined) {
        setCurrentPrice(Number(event.currentPrice));
      }
    }

    realtime.connection.on((stateChange) => {
      if (!isMounted) return;
      setConnectionState(stateChange.current);
      if (stateChange.current === "connected") {
        refreshSnapshot();
      }
    });
    channel.subscribe("bid-accepted", handleBidEvent);

    return () => {
      isMounted = false;
      channel.unsubscribe("bid-accepted", handleBidEvent);
      realtime.connection.off();
      try {
        realtime.close();
      } catch {
        // Suppress "Connection closed" errors during teardown
      }
    };
  }, [auctionId, auction]);

  const liveWindow = useMemo(() => {
    if (!auction) {
      return "";
    }

    return `${auction.start_time} – ${auction.end_time}`;
  }, [auction]);

  function handleIncrement(amount) {
    setSelectedIncrement(amount);
    setStatus({ kind: "idle", message: "" });
  }

  async function handleBid() {
    setIsBidding(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        body: JSON.stringify({ increment: selectedIncrement }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to place bid.");
      }

      setCurrentPrice(Number(data.auction.currentPrice));
      setStatus({
        kind: "success",
        message: `Bid placed at ${formatCurrency(data.auction.currentPrice)}.`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to place bid.",
      });
    } finally {
      setIsBidding(false);
    }
  }

  /* ──────────────────────────────────────────────
     Single-auction detail view (when ?id= is set)
     ────────────────────────────────────────────── */
  if (auctionId) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-white to-slate-100 px-6 py-10 text-slate-900 sm:px-8 lg:px-12">
        <section className="mx-auto w-full max-w-6xl py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                Live auction
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                Bid on the active listing
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/live-auction"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                ← All auctions
              </Link>
              <Link
                href="/create-auction"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Create another auction
              </Link>
            </div>
          </div>

          {status.kind === "error" ? (
            <p className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {status.message}
            </p>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/60 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                <span className="text-slate-600">Loading auction details…</span>
              </div>
            </div>
          ) : auction ? (
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
                <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="min-h-80 bg-slate-100">
                    <img
                      src={auction.image_url}
                      alt={auction.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Item details
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                      {auction.title}
                    </h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      {auction.description}
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Seller ID</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {auction.seller_id}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Starting price</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatCurrency(Number(auction.starting_price ?? 0))}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                        <p className="text-sm text-slate-500">Auction window</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {liveWindow}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-lg shadow-slate-900/10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Bid panel
                </p>
                <h2 className="mt-4 text-2xl font-semibold">Choose your increment</h2>

                <div className="mt-6 rounded-3xl bg-white/5 p-5">
                  <p className="text-sm text-slate-400">Current bid</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight">
                    {formatCurrency(currentPrice)}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {incrementOptions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleIncrement(amount)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                        selectedIncrement === amount
                          ? "border-amber-300 bg-amber-400 text-slate-950"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      +{amount}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleBid}
                  disabled={isBidding}
                  className="mt-6 w-full rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBidding ? "Placing bid..." : `Bid +${selectedIncrement}`}
                </button>

                {status.kind === "success" ? (
                  <p className="mt-4 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-300">
                    {status.message}
                  </p>
                ) : null}

                <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Realtime: {connectionState}
                </p>

                <p className="mt-6 text-sm leading-6 text-slate-400">
                  Select an increment and confirm your bid. Accepted bids appear for everyone watching this auction.
                </p>
              </aside>
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  /* ──────────────────────────────────────────────
     All-auctions gallery view (no ?id= param)
     ────────────────────────────────────────────── */
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 via-white to-slate-100 px-6 py-10 text-slate-900 sm:px-8 lg:px-12">
      <section className="mx-auto w-full max-w-6xl py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              Live auctions
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Browse all auctions
            </h1>
            <p className="mt-3 max-w-xl text-lg text-slate-600">
              Discover active listings and place your bids. Click any card to view full details and start bidding.
            </p>
          </div>
          <Link
            href="/create-auction"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            + Create auction
          </Link>
        </div>

        {status.kind === "error" ? (
          <p className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {status.message}
          </p>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-12 shadow-sm shadow-slate-200/60 backdrop-blur text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-amber-400 border-t-transparent" />
            <p className="mt-4 text-slate-500">Loading auctions…</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">No auctions yet</h2>
            <p className="mt-2 text-slate-500">Create your first auction to get started.</p>
            <Link
              href="/create-auction"
              className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Create your first auction
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((item) => (
              <Link
                key={item.id}
                href={`/live-auction?id=${item.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/80"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Live
                  </span>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-amber-700 transition">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Starting price</p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(Number(item.starting_price ?? 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Auction time</p>
                      <p className="text-sm font-medium text-slate-700">
                        {item.start_time} – {item.end_time}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      Seller #{item.seller_id}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition group-hover:bg-amber-100">
                      View & Bid →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}