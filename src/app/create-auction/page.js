"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
const initialStatus = { kind: "idle", message: "" };

export default function CreateAuctionPage() {
  const [status, setStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      description: formData.get("description"),
      end_time: formData.get("end_time"),
      image_url: formData.get("image_url"),
      start_time: formData.get("start_time"),
      starting_price: formData.get("starting_price"),
      title: formData.get("title"),
    };

    setIsSubmitting(true);
    setStatus(initialStatus);

    try {
      const response = await fetch("/api/auctions", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save auction.");
      }

      form.reset();
      setStatus({
        kind: "success",
        message: "Auction saved. Opening live auction...",
      });
      router.push(`/live-auction?id=${data.auction.id}`);
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Unexpected submit failure.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-10 text-slate-900 sm:px-8 lg:px-12">
      <section className="mx-auto w-full max-w-6xl py-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/60 backdrop-blur"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Create listing
                </p>
                <h1 className="mt-2 text-3xl font-semibold">Auction your item</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  Add the details for your listing. Your signed-in Supabase account will be saved as the seller automatically.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                Draft
              </span>
            </div>

            {status.kind !== "idle" ? (
              <p
                className={`mt-6 rounded-2xl px-4 py-3 text-sm font-medium ${
                  status.kind === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
                aria-live="polite"
              >
                {status.message}
              </p>
            ) : null}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  required
                  type="text"
                  name="title"
                  placeholder="Example: Vintage Leica Camera"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  required
                  name="description"
                  rows="5"
                  placeholder="Describe the condition, provenance, and any important details buyers should know."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Image URL</span>
                <input
                  required
                  type="url"
                  name="image_url"
                  placeholder="https://example.com/item-image.jpg"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Starting price</span>
                <input
                  required
                  type="number"
                  name="starting_price"
                  min="0"
                  step="0.01"
                  placeholder="100.00"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Start time</span>
                <input
                  required
                  type="datetime-local"
                  name="start_time"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">End time</span>
                <input
                  required
                  type="datetime-local"
                  name="end_time"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : "Publish auction"}
              </button>
              <Link
                href="/"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Back to dashboard
              </Link>
              <Link
                href="/live-auction"
                className="rounded-full border border-slate-300 bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Open live auction
              </Link>
            </div>
          </form>

          <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-lg shadow-slate-900/10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Listing tips
            </p>
            <h2 className="mt-4 text-2xl font-semibold">Make your auction stand out</h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-300">
              <li>Use a clear title with the item type and condition.</li>
              <li>Add a sharp image and mention any flaws up front.</li>
              <li>Set a starting price that encourages first bids.</li>
              <li>Pick auction times that match when buyers are online.</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
