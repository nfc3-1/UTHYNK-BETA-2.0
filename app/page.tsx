import categories from '@/data/categories.json';
import Link from 'next/link';

export default function HomePage(){
  const list:any[] = categories as any[];

  // split like screenshot: 6 big + 6 small
  const big = list.slice(0,6);
  const small = list.slice(6);

  return (
    <div>
      <div className="ppHero">
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap: 10}}>
          <div style={{
            width: 44, height: 44, borderRadius: 16,
            background:'rgba(255,255,255,0.10)',
            border:'1px solid rgba(255,255,255,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            🧠
          </div>
          <div className="ppHeroTitle">Start Thinking</div>
        </div>
        <div className="ppHeroSub">Sharpen your mind with a quick learning challenge!</div>
      </div>

      <div className="ppCats">
        {big.map((c)=>(
          <Link key={c.slug} href={`/category/${c.slug}`} className={`tile tile-${c.color}`} title={c.synopsis}>
            <div className="tileTitle">{c.name}</div>
          </Link>
        ))}
      </div>

      <div className="ppCatsSmall">
        {small.map((c)=>(
          <Link key={c.slug} href={`/category/${c.slug}`} className={`tile tile-${c.color}`} title={c.synopsis}>
            <div className="tileTitle">{c.name}</div>
          </Link>
        ))}
      </div>

      <div className="ppBegin">
        <Link className="btn btnPrimary" href="/daily">Begin!</Link>
      </div>
    </div>
  );
}
