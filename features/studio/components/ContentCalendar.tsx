'use client';

import { channelLabels } from '@/features/studio/data/studioDefaults';
import type { StudioPost } from '@/features/studio/types/studio';

type ContentCalendarProps = {
  posts: StudioPost[];
  onUpdatePost: (id: string, patch: Partial<StudioPost>) => void;
  onTransitionPost: (post: StudioPost, patch: Partial<StudioPost> & { status: StudioPost['status'] }) => Promise<void>;
};

export default function ContentCalendar({ posts, onUpdatePost, onTransitionPost }: ContentCalendarProps) {
  return (
    <div className="studioPostList">
      {posts.map((post) => (
        <article key={post.id}>
          <span>{channelLabels[post.platform]} / {post.status}</span>
          <label className="studioField compactField"><span>Scheduled date</span><input type="date" value={post.scheduledFor} onChange={(event) => onUpdatePost(post.id, { scheduledFor: event.target.value, status: post.status === 'approved' && event.target.value ? 'scheduled' : post.status })} /></label>
          <label className="studioField compactField"><span>Time</span><input value={post.scheduledTime || ''} onChange={(event) => onUpdatePost(post.id, { scheduledTime: event.target.value })} /></label>
          <p>{post.hook}</p>
          {post.status !== 'approved' && post.status !== 'scheduled' && post.status !== 'ready_to_publish' && post.status !== 'published' && (
            <small>Approve the complete creative before scheduling or publishing.</small>
          )}
          <div className="studioApprovalActions">
            <button className="btn" type="button" disabled={post.status !== 'scheduled'} onClick={() => onTransitionPost(post, { status: 'ready_to_publish' })}>Mark Ready to Publish</button>
            <button className="btn" type="button" disabled={post.status !== 'ready_to_publish'} onClick={() => onTransitionPost(post, { status: 'published', livePostUrl: post.livePostUrl, publishingNotes: post.publishingNotes })}>Mark Published</button>
          </div>
          <label className="studioField compactField"><span>Live post URL</span><input value={post.livePostUrl || ''} onChange={(event) => onUpdatePost(post.id, { livePostUrl: event.target.value })} /></label>
          <label className="studioField compactField"><span>Publishing notes</span><textarea value={post.publishingNotes || ''} onChange={(event) => onUpdatePost(post.id, { publishingNotes: event.target.value })} /></label>
        </article>
      ))}
    </div>
  );
}
