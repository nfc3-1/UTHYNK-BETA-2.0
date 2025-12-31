import Link from 'next/link';

export default function CategoryTile({ c }:{ c:any }){
  return (
    <Link href={`/category/${c.slug}`} className={`tile tile-${c.color}`} title={c.synopsis}>
      <div className="tileTitle">{c.name}</div>
    </Link>
  );
}
