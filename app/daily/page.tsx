import { redirect } from 'next/navigation';
import { getTodayChallengeId } from '@/lib/daily';

export default function Daily(){
  const id = getTodayChallengeId();
  redirect(`/challenge/${id}`);
}
