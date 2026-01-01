// app/page.tsx
import Image from "next/image";

const CATEGORIES = [
  "Philosophy of History",
  "Logic & Critical Thinking",
  "Literature & Wisdom",
  "Modern Questions",
  "Street Lessons",
  "Pop Culture & Media Literacy",
  "Mind & Self",
  "Worldview & Cultures",
  "Creative Thinking",
  "Work & Hustle",
  "Epistemology",
  "Applied Ethics",
];

export default function Home() {
  return (
    <main className="min-h-screen w-screen">
      {/* Outer padding scales with screen size */}
      <div className="mx-auto w-full max-w-none px-[clamp(16px,2vw,36px)] py-[clamp(14px,2vw,28px)]">
        {/* ===== Top Bar ===== */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Your logo, no background */}
            <Image
              src="/brand/uthynk-logo.png"
              alt="UThynk"
              width={160}
              height={44}
              priority
              className="h-[clamp(34px,3vw,44px)] w-auto"
            />
          </div>

          {/* Top controls */}
          <nav className="hidden md:flex items-center gap-2 uthynk-card rounded-2xl px-3 py-2">
            <button className="px-3 py-2 rounded-xl hover:bg-white/10">Home</button>
            <button className="px-3 py-2 rounded-xl hover:bg-white/10">Dashboard</button>
            <button className="px-3 py-2 rounded-xl hover:bg-white/10">Store</button>
            <button className="px-3 py-2 rounded-xl hover:bg-white/10">Profile</button>
          </nav>

          <div className="flex items-center gap-2 uthynk-card rounded-2xl px-3 py-2">
            <span className="text-white/80 text-sm">Coins</span>
            <span className="font-bold text-[var(--uthynk-gold)]">350</span>
          </div>
        </header>

        {/* ===== Main Content Grid ===== */}
        <div className="mt-[clamp(14px,2vw,22px)] grid gap-[clamp(12px,1.6vw,22px)] grid-cols-1 lg:grid-cols-[280px_minmax(560px,1fr)_360px] items-start">
          {/* LEFT SIDEBAR (controls) */}
          <aside className="uthynk-card rounded-3xl p-4">
            <div className="space-y-2">
              {["Home", "Dashboard", "Store", "Profile", "Log Out"].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          {/* CENTER COLUMN: Dashboard + Start Thinking */}
          <section className="space-y-[clamp(12px,1.6vw,20px)]">
            {/* Progress Dashboard (LEFT of Start Thinking conceptually; on desktop it can sit above or beside) */}
            <div className="uthynk-card rounded-3xl p-[clamp(14px,1.6vw,20px)]">
              <h2 className="text-[clamp(18px,1.8vw,22px)] font-bold">Progress Dashboard</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-white/70 text-sm">Time</div>
                  <div className="text-xl font-extrabold">4h 15m</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-white/70 text-sm">Lessons</div>
                  <div className="text-xl font-extrabold">27</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-white/70 text-sm">Streak</div>
                  <div className="text-xl font-extrabold">15</div>
                </div>
              </div>
            </div>

            {/* Start Thinking */}
            <div className="uthynk-card rounded-3xl p-[clamp(16px,2vw,24px)]">
              <div className="flex items-center gap-3">
                {/* Replace old brain image with your logo icon+text (pixel crisp) */}
                <Image
                  src="/brand/uthynk-logo.png"
                  alt="UThynk"
                  width={120}
                  height={34}
                  className="h-[clamp(22px,2.2vw,34px)] w-auto"
                />
                <h1 className="text-[clamp(22px,2.4vw,34px)] font-extrabold tracking-tight">
                  Start Thinking
                </h1>
              </div>

              <p className="mt-2 text-white/80">
                Pick a category to start a quick challenge.
              </p>

              {/* 12 categories grid */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className="rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-4 text-left transition"
                  >
                    <div className="font-semibold">{c}</div>
                  </button>
                ))}
              </div>

              <button
                className="mt-5 w-full rounded-2xl py-4 font-extrabold text-[var(--uthynk-ink)] bg-[var(--uthynk-gold)] hover:brightness-110 transition"
              >
                Begin!
              </button>
            </div>
          </section>

          {/* RIGHT SIDEBAR: Did You Know */}
          <aside className="uthynk-card rounded-3xl p-[clamp(14px,1.6vw,20px)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[clamp(18px,1.8vw,22px)] font-bold">Did You Know?</h2>
              <button className="text-sm text-white/70 hover:text-white">See more</button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                "The Halo Effect makes us overrate people we already like.",
                "Ancient Greece had versions of jury duty—citizens voted using colored markers.",
                'Mandela Effect: many remember “Berenstain Bears” incorrectly as “Berenstein.”',
              ].map((fact) => (
                <div key={fact} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-white/90">{fact}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h3 className="font-bold">Daily Trivia</h3>
              <button className="text-sm text-white/70 hover:text-white">See more</button>
            </div>

            <div className="mt-3 rounded-2xl bg-white/10 p-4">
              <div className="text-white/90">
                Socrates could have escaped his sentence but chose to accept the law and drink hemlock.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
