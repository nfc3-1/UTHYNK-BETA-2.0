'use client';

import { channelLabels } from '@/features/studio/data/studioDefaults';
import type { StudioPost } from '@/features/studio/types/studio';

type ContentCalendarProps = {
  posts: StudioPost[];
  onUpdatePost: (id: string, patch: Partial<StudioPost>) => void;
};

export default function ContentCalendar({ posts, onUpdatePost }: ContentCalendarProps) {
  return (
    <div className="studioPostList">
      {posts.map((post) => (
        <article key={post.id}>
          <span>{channelLabels[post.platform]} / {post.status}</span>
          <label className="studioField compactField"><span>Scheduled date</span><input type="date" value={post.scheduledFor} onChange={(event) => onUpdatePost(post.id, { scheduledFor: event.target.value, status: event.target.value ? 'scheduled' : post.status })} /></label>
          <label className="studioField compactField"><span>Time</span><input value={post.scheduledTime || ''} onChange={(event) => onUpdatePost(post.id, { scheduledTime: event.target.value })} /></label>
          <p>{post.hook}</p>
        </article>
      ))}
    </div>
  );
}
