import Link from "next/link";
import categories from "@/data/categories.json";
import challenges from "@/data/challenges.json";

type Category = {
  slug: string;
  name: string;
  subtitle?: string;
  description?: string;
};

type Challenge = {
  id: string;
  category: string;       // MUST equal category slug
  title: string;
  prompt?: string;
  minutes?: number;
  xp?: number;
  difficulty?: string;    // optional
  track?: string;         // optional: "Foundations" | "Practice" | "Stretch Thinking"
};

const TRACK_ORDER = ["Foundations", "Practice", "Stretch Thinking"] as const;

function groupChallenges(list: Challenge[]) {
  // Prefer explicit `track`, otherwise infer from difficulty.
  const getTrack = (c: Challenge) => {
    if (c.track) return c.track;
    const d = (c.difficulty || "").toLowerCase();
    if (d.includes("foundation")) return "Foundations";
    if (d.includes("stretch")) return "Stretch Thinking";
    // default bucket
    return "Practice";
  };

  const groups: Record<string, Challenge[]> = {};
  for (const c of list) {
    const t = getTrack(c);
    groups[t] = groups[t] || [];
    groups[t].push(c);
  }
  return groups;
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug || "");

  const cat =
    (categories as Category[]).find((c) => c.slug === slug) || null;

  if (!cat) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Category not found</h1>
        <p style={{ opacity: 0.8, marginTop: 10 }}>That category doesn’t exist yet.</p>
        <div style={{ marginTop: 18 }}>
          <Link href="/" style={{ fontWeight: 800, textDecoration: "underline" }}>
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const all = (challenges as Challenge[]).filter((c) => c.category === slug);

  // “Progress” placeholder (swap with real stats later)
  const explored = Math.min(all.length, 7);
  const total = all.length || 31;

  const groups = groupChallenges(all);

  // Sort groups in a stable, predictable order
  const groupKeys = [
    ...TRACK_ORDER.filter((k) => groups[k]?.length),
    ...Object.keys(groups).filter((k) => !TRACK_ORDER.includes(k as any)),
  ];

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <div style={{ opacity: 0.75, fontWeight: 800, marginBottom: 10 }}>
        {cat.subtitle || "Category"}
      </div>

      <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -0.3, margin: 0 }}>
        {cat.name}
      </h1>

      <p style={{ marginTop: 12, fontSize: 16, opacity: 0.8, lineHeight: 1.5 }}>
        {cat.description || ""}
      </p>

      <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800 }}>
          {explored} / {total} challenges explored
        </div>
        <div style={{ opacity: 0.7 }}>Clarity grows with practice</div>
        <Link
          href="/daily"
          style={{ fontWeight: 800, textDecoration: "underline" }}
        >
          Try today’s challenge
        </Link>
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
          How this category helps you think
        </h2>
        <p style={{ marginTop: 10, opacity: 0.8, lineHeight: 1.55 }}>
          This is skill practice. There are no “right answers” here—only clearer reasoning,
          better questions, and stronger judgment.
        </p>
      </section>

      <div style={{ marginTop: 26, display: "grid", gap: 18 }}>
        {groupKeys.map((k) => (
          <section key={k}>
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{k}</h3>
            <div style={{ marginTop: 10, opacity: 0.75 }}>
              {k === "Foundations" && "Build the basic toolkit"}
              {k === "Practice" && "Apply the skill"}
              {k === "Stretch Thinking" && "More nuanced reasoning"}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {(groups[k] || []).map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${encodeURIComponent(c.id)}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{c.title}</div>
                    <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                      {k} · ~ {c.minutes ?? 2} min · + {c.xp ?? 10} XP
                    </div>
                  </div>

                  <div style={{ fontWeight: 900, opacity: 0.9, whiteSpace: "nowrap" }}>
                    Start →
                  </div>
                </Link>
              ))}
              {(groups[k] || []).length === 0 && (
                <div style={{ opacity: 0.75 }}>No challenges yet.</div>
              )}
            </div>
          </section>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <Link href="/" style={{ fontWeight: 800, textDecoration: "underline" }}>
          ← Back to all categories
        </Link>
      </div>
    </main>
  );
}
