import Link from 'next/link';

export default function CategoryTile({ c }: { c:any }){
  const tag = c.foundation ? 'Foundation' : 'Skill';
  return (
    <Link className="tile" href={`/category/${c.slug}`} aria-label={`Open ${c.name}`}>
      <div className="tileTop">
        <div>
          <div className="tileName">{c.name}</div>
          <div className="tileHint">{c.foundation ? 'Start here' : 'Explore a lens'}</div>
        </div>
        <div className="tileTag">{tag}</div>
      </div>

      <div className="tileOverlay" aria-hidden>
        <div className="overlayText">{c.synopsis}</div>
        <div className="overlayCta">
          <span>Hover synopsis</span>
          <span>Explore →</span>
        </div>
      </div>
    </Link>
  );
}
