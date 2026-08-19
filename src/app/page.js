export default function Home() {
  const auctionStats = [
    { label: "Auction participated", value: "24", change: "+8 this month" },
    { label: "Wins", value: "11", change: "46% win rate" },
    { label: "Active listings", value: "6", change: "2 ending today" },
    { label: "Total revenue", value: "$18.4K", change: "+12% vs last month" },
  ];

  const recentActivity = [
    { title: "Vintage camera set", status: "Winning bid", detail: "$320 current bid • Ends in 2h" },
    { title: "Signed sports jersey", status: "Watching", detail: "$180 current bid • 14 bids" },
    { title: "Designer chair", status: "Sold", detail: "$840 final bid • Closed yesterday" },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-10 text-slate-900 sm:px-8 lg:px-12">
      <section id="overview" className="mx-auto w-full max-w-6xl py-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-sm shadow-slate-200/60 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Seller dashboard
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              MyAuction Page
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Track your auction performance, monitor wins, and jump to the listing form whenever you want to create a new item.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/create-auction"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Create a new auction
              </a>  
              <a
                href="#analytics"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                View analytics
              </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {auctionStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-sm text-emerald-600">{stat.change}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="analytics" className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-lg shadow-slate-900/10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Quick analytics
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Auction participated</p>
                <p className="mt-2 text-3xl font-bold">24</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Wins</p>
                <p className="mt-2 text-3xl font-bold">11</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Average bid growth</p>
                <p className="mt-2 text-3xl font-bold">+18%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="analytics" className="mx-auto w-full max-w-6xl pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm shadow-slate-200/60 backdrop-blur">
            <h2 className="text-2xl font-semibold">Recent activity</h2>
            <p className="mt-2 text-slate-600">A quick snapshot of your latest auctions and bidding progress.</p>

            <div className="mt-6 space-y-4">
              {recentActivity.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-lg shadow-slate-900/10">
            <h2 className="text-2xl font-semibold">Seller insights</h2>
            <p className="mt-2 text-slate-400">Use these numbers to understand how often you are participating and winning.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Auction participated</p>
                <p className="mt-2 text-3xl font-bold">24</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Wins</p>
                <p className="mt-2 text-3xl font-bold">11</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Active listings</p>
                <p className="mt-2 text-3xl font-bold">6</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Win rate</p>
                <p className="mt-2 text-3xl font-bold">46%</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}