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
    <main className="ppShell">
      {/* Top Bar */}
      <header className="ppTop card">
        <div className="ppTopLeft">
          <div className="ppLogo">
            <Image
              src="/brand/uthynk-logo.png"
              alt="UThynk"
              width={160}
              height={44}
              priority
            />
          </div>

          <nav className="ppNav">
            <a href="#">Home</a>
            <a href="#">Dashboard</a>
            <a href="#">Store</a>
            <a href="#">Profile</a>
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
          {["Home", "Dashboard", "Store", "Profile", "Log Out"].map((t) => (
            <a key={t} href="#">
              {t}
            </a>
          ))}
        </aside>

        {/* Main center */}
        <section className="ppMain card">
          <div className="ppHero">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
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
              <div key={cat.title} className="tile" title={cat.desc}>
                <div className="tileTop">
                  <div className="tileName">{cat.title}</div>
                  <div className="tileTag">Category</div>
                </div>

                {/* Hint line (subtle) */}
                <div className="tileHint">{cat.desc}</div>

                {/* Overlay (strong hover) */}
                <div className="tileOverlay">
                  <div className="overlayText">{cat.desc}</div>
                  <div className="overlayCta">
                    <span>Open</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ppBegin">
            <button className="btn btnPrimary">Begin!</button>
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
            Socrates could have escaped his sentence but chose to accept the law and drink hemlock.
          </div>
        </aside>
      </div>
    </main>
  );
}
      
