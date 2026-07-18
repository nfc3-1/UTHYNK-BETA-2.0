'use client';

import { useMemo } from 'react';
import type { StudioPost } from '@/features/studio/types/studio';

export function useStudioPosts(posts: StudioPost[], campaignId?: string) {
  return useMemo(() => {
    const selectedPosts = campaignId ? posts.filter((post) => post.campaignId === campaignId) : [];
    const reviewPosts = posts.filter((post) => post.approvalDecision !== 'approved' || post.status === 'review');
    const scheduledPosts = posts.filter((post) => post.status === 'scheduled' || Boolean(post.scheduledFor));
    const firstScheduled = scheduledPosts
      .slice()
      .sort((a, b) => `${a.scheduledFor} ${a.scheduledTime || ''}`.localeCompare(`${b.scheduledFor} ${b.scheduledTime || ''}`))[0];

    return {
      selectedPosts,
      reviewPosts,
      scheduledPosts,
      firstScheduled,
    };
  }, [campaignId, posts]);
}
