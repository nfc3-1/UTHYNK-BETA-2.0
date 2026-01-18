import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    title: "Epistemology",
    slug: "epistemology",
    desc: "How we know what we know; evidence, belief, certainty, and doubt.",
  },
  {
    title: "Logic & Critical Thinking",
    slug: "logic-critical-thinking",
    desc: "Reasoning clearly, spotting fallacies, assumptions, and weak arguments.",
  },
  {
    title: "Mind & Self",
    slug: "mind-self",
    desc: "Biases, emotions, habits, identity, and how the mind shapes decisions.",
  },
  {
    title: "Literature & Wisdom",
    slug: "literature-wisdom",
    desc: "Timeless stories and ideas that reveal human patterns and insight.",
  },
  {
    title: "Philosophy of History",
    slug: "philosophy-of-history",
    desc: "How narratives shape our understanding of the past and progress.",
  },
  {
    title: "Worldview & Cultures",
    slug: "worldview-cultures",
    desc: "Different cultural lenses and why intelligent people disagree.",
  },
  {
    title: "Applied Ethics",
    slug: "applied-ethics",
    desc: "Moral reasoning through tradeoffs, consequences, and principles.",
  },
  {
    title: "Modern Questions",
    slug: "modern-questions",
    desc: "Contemporary issues explored without telling users what to believe.",
  },
  {
    title: "Pop Culture & Media Literacy",
    slug: "pop-culture-media-literacy",
    desc: "Persuasion, media narratives, algorithms, and attention economics.",
  },
  {
    title: "Street Lessons",
    slug: "street-lessons",
    desc: "Practical wisdom about power, incentives, risk, and human behavior.",
  },
  {
    title: "Creative Thinking",
    slug: "creative-thinking",
    desc: "Reframing problems, generating ideas, and breaking mental ruts.",
  },
  {
    title: "Work & Hustle",
    slug: "work-hustle",
    desc: "Thinking clearly about success, effort, tradeoffs, and long-term value.",
  },
];

export default function Home() {
  const firstSlug = CATEGORIES[0]?.slug ?? "epistemology";

  return (
    <main className="ppShell">
      {/* Top Bar */}
      <header className="ppTop card">
        <div className="ppTopLeft">
          <div className="ppLogo">
            <Link href="/" aria-label="UThynk Home">
              <Image
                src="/brand/uthynk-logo.png"
                alt="UThynk"
                width={160}
                height={44}
                priority
              />
            </Link>
          </div>

          <nav className="ppNav">
            <Link href="/">Home</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/store">Store</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </div>

        <div className="ppTopRight">
          <div className="ppCoins">
            <span>Coins</span>
            <span style={{ color: "var(--uthynk-gold)" }}>350</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="ppBody">
        {/* Left sidebar */}
        <aside className="ppSide card">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/store">Store</Link>
          <Link href="/profile">Profile</Link>

          {/* Placeholder until auth exists */}
          <Link href="/" style={{ opacity: 0.8, marginTop: 8 }}>
            Log Out
          </Link>
        </aside>

        {/* Main center */}
        <section className="ppMain card">
          <div className="ppHero">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              {/* small logo near Start Thinking (pixel clean) */}
              <Image
                src="/brand/uthynk-logo.png"
                alt="UThynk"
                width={140}
                height={40}
              />
            </div>

            <div className="ppHeroTitle">Start Thinking</div>
            <div className="ppHeroSub">
              Pick a category to start a quick challenge.
            </div>
          </div>

          {/* Categories grid */}
          <div className="ppCats">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${encodeURIComponent(cat.slug)}`}
                className="tile"
                title={cat.desc}
                aria-label={`Open category: ${cat.title}`}
              >
                <div className="tileTop">
                  <div className="tileName">{cat.title}</div>
                  <div className="tileTag">Category</div>
                </div>

                <div className="tileHint">{cat.desc}</div>

                <div className="tileOverlay">
                  <div className="overlayText">{cat.desc}</div>
                  <div className="overlayCta">
                    <span>Open</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="ppBegin">
            <Link className="btn btnPrimary" href={`/category/${firstSlug}`}>
              Begin!
            </Link>
          </div>
        </section>

        {/* Right panel */}
        <aside className="ppRight card">
          <div className="ppInfoTitle">Did You Know?</div>

          <div className="ppBullets">
            {[
              "The Halo Effect makes us overrate people we already like.",
              "Ancient Greece had versions of jury duty—citizens voted with colored markers.",
              'Mandela Effect: many remember “Berenstain Bears” as “Berenstein.”',
            ].map((text) => (
              <div key={text} className="ppBullet">
                <div className="ppBulletDot">•</div>
                <div>{text}</div>
              </div>
            ))}
          </div>

          <div className="divider" />

          <div className="ppInfoTitle">Daily Trivia</div>
          <div className="ppInfoCard">
            Socrates could have escaped his sentence but chose to accept the law
            and drink hemlock.
          </div>
        </aside>
      </div>
    </main>
  );
}
