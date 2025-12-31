import categories from '@/data/categories.json';
import challenges from '@/data/challenges.json';
import ChallengeRow from '@/components/ChallengeRow';
import Link from 'next/link';

export default function CategoryDetail({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const cat = (categories as any[]).find(c => c.slug === slug);

  if (!cat) {
    return (
      <div className="card p-20">
        <h1 className="heroTitle">Category not found</h1>
        <p className="heroSub">That category doesn’t exist yet.</p>
        <div className="mt-16"><Link className="btn btnPrimary" href="/">Go Home</Link></div>
      </div>
    );
  }

  const list = (challenges as any[]).filter(ch => ch.category === slug);

  const groups = {
    "Foundations": list.filter((x:any)=>x.difficulty==="Foundations"),
    "Practice": list.filter((x:any)=>x.difficulty==="Practice"),
    "Stretch Thinking": list.filter((x:any)=>x.difficulty==="Stretch Thinking"),
  };

  return (
    <div className="col">
      <div className="card p-20">
        <div className="smallMuted">{cat.foundation ? '🧠 Foundation Category' : 'Skill Category'}</div>
        <h1 className="heroTitle" style={{marginTop:6}}>{cat.name}</h1>
        <p className="heroSub">{cat.synopsis}</p>

        <div className="mt-16" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <span className="badge">7 / 31 challenges explored</span>
          <span className="badge">Clarity grows with practice</span>
          <Link className="btn" href="/daily">Try today’s challenge</Link>
        </div>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>How this category helps you think</div>
        <div className="smallMuted mt-12">
          This is skill practice. There are no “right answers” here—only clearer reasoning, better questions, and stronger judgment.
        </div>
      </div>

      <div className="card p-20">
        {Object.entries(groups).map(([k, arr]) => (
          <div key={k} className="mt-16">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
              <div style={{fontWeight:900, fontSize:16}}>{k}</div>
              <div className="smallMuted">{k==="Foundations" ? "Build the basic toolkit" : k==="Practice" ? "Apply the skill" : "More nuanced reasoning"}</div>
            </div>
            <div className="mt-12" style={{display:'grid', gap:10}}>
              {(arr as any[]).map((ch:any)=>(<ChallengeRow key={ch.id} ch={ch} />))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
