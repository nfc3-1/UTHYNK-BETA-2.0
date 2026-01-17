import Image from "next/image";

const CATEGORIES = [
  {
    title: "Epistemology",
    desc: "How we know what we know; evidence, belief, certainty, and doubt.",
  },
  {
    title: "Logic & Critical Thinking",
    desc: "Reasoning clearly, spotting fallacies, assumptions, and weak arguments.",
  },
  {
    title: "Mind & Self",
    desc: "Biases, emotions, habits, identity, and how the mind shapes decisions.",
  },
  {
    title: "Literature & Wisdom",
    desc: "Timeless stories and ideas that reveal human patterns and insight.",
  },
  {
    title: "Philosophy of History",
    desc: "How narratives shape our understanding of the past and progress.",
  },
  {
    title: "Worldview & Cultures",
    desc: "Different cultural lenses and why intelligent people disagree.",
  },
  {
    title: "Applied Ethics",
    desc: "Moral reasoning through tradeoffs, consequences, and principles.",
  },
  {
    title: "Modern Questions",
    desc: "Contemporary issues explored without telling users what to believe.",
  },
  {
    title: "Pop Culture & Media Literacy",
    desc: "Persuasion, media narratives, algorithms, and attention economics.",
  },
  {
    title: "Street Lessons",
    desc: "Practical wisdom about power, incentives, risk, and human behavior.",
  },
  {
    title: "Creative Thinking",
    desc: "Reframing problems, generating ideas, and breaking mental ruts.",
  },
  {
    title: "Work & Hustle",
    desc: "Thinking clearly about success, effort, tradeoffs, and long-term value.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen w-screen">
      <div className="mx-auto w-full max-w-none px-[clamp(16px,2vw,36px)] py-[clamp(14px,2vw,28px)]">
        {/* TOP BAR */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/uthynk-logo.png"
              alt="UThynk"
              width={220}
              height={60}
              priority
              className="h-[clamp(34px,3vw,44px)] w-auto"
            />
          </div>

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

        {/* MAIN GRID: Left controls | Center Start Thinking | Right Did You Know */}
        <div className="mt-[clamp(14px,2vw,22px)] grid gap-[clamp(12px,1.6vw,22px)] grid-cols-1 lg:grid-cols-[280px_minmax(560px,1fr)_360px] items-start">
          {/* LEFT SIDEBAR */}
          <aside className="uthynk-card rounded-3xl p-4">
            {["Home", "Dashboard", "Store", "Profile", "Log Out"].map((t) => (
              <button
                key={t}
                className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/10 transition"
              >
                {t}
              </button>
            ))}
          </aside>

          {/* CENTER: Start Thinking */}
          <section className="uthynk-card rounded-3xl p-[clamp(16px,2vw,24px)]">
            <div className="flex items-center gap-3">
              {/* Smaller logo mark next to Start Thinking */}
              <Image
                src="/brand/uthynk-logo.png"
                alt="UThynk"
                width={140}
                height={40}
                className="h-[clamp(22px,2.2vw,34px)] w-auto"
              />
              <h1 className="text-[clamp(22px,2.4vw,34px)] font-extrabold tracking-tight">
                Start Thinking
              </h1>
            </div>

            <p className="mt-2 text-white/80">Pick a category to start a quick challenge.</p>

            {/* 12 categories (title shown, description on hover) */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.title}
                  title={cat.desc} // native tooltip on hover
                  className="
                    group rounded-2xl bg-white/10 hover:bg-white/15
                    border border-white/10 px-4 py-4 text-left transition
                    relative overflow-hidden
                  "
                >
                  <div className="font-extrabold text-white">{cat.title}</div>

                  {/* Hover description */}
                  <div
                    className="
                      mt-2 text-sm text-white/75
                      opacity-0 translate-y-1 transition
                      group-hover:opacity-100 group-hover:translate-y-0
                    "
                  >
                    {cat.desc}
                  </div>
                </button>
              ))}
            </div>

            <button
              className="mt-5 w-full rounded-2xl py-4 font-extrabold text-[var(--uthynk-ink)] bg-[var(--uthynk-gold)] hover:brightness-110 transition"
            >
              Begin!
            </button>
          </section>

          {/* RIGHT: Did You Know */}
          <aside className="uthynk-card rounded-3xl p-[clamp(14px,1.6vw,20px)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[clamp(18px,1.8vw,22px)] font-bold">Did You Know?</h2>
              <button className="text-sm text-white/70 hover:text-white">See more</button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                "The Halo Effect makes us overrate people we already like.",
                "Ancient Greece had versions of jury duty—citizens voted with colored markers.",
                'Mandela Effect: many remember “Berenstain Bears” as “Berenstein.”',
              ].map((fact) => (
                <div key={fact} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-white/90">{fact}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
