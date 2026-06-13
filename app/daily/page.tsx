import { redirect } from 'next/navigation';
import { getDailyChallenge } from '@/lib/challenges';

export default function Daily(){
  const challenge = getDailyChallenge();

  redirect(`/reasoning?id=${challenge.id}&source=daily`);
}
