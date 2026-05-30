import Link from 'next/link';
import { slugifyCategory } from '@/lib/questionBank';

export default function CategoryTile({ c }:{ c:any }){
  return (
    <Link href={`/lessons/${slugifyCategory(c.name)}`} className={`tile tile-${c.color}`} title={c.synopsis || c.description}>
      <div className="tileTitle">{c.name}</div>
    </Link>
  );
}
