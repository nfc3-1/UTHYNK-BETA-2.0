import Link from 'next/link';

export default function ChallengeRow({ ch }: { ch:any }){
  return (
    <Link href={`/challenge/${ch.id}`} className="card p-16" style={{display:'flex', justifyContent:'space-between', gap:12}}>
      <div>
        <div style={{fontWeight:900}}>{ch.title}</div>
        <div className="smallMuted">{ch.difficulty} · ~{ch.minutes} min · +{ch.xp} XP</div>
      </div>
      <div className="smallMuted" style={{alignSelf:'center'}}>Start →</div>
    </Link>
  );
}
