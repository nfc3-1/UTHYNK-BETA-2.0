'use client';

import { channelLabels } from '@/features/studio/data/studioDefaults';
import type { StudioPost } from '@/features/studio/types/studio';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

type ApprovalQueueProps = {
  posts: StudioPost[];
  onUpdatePost: (id: string, patch: Partial<StudioPost>) => void;
};

export default function ApprovalQueue({ posts, onUpdatePost }: ApprovalQueueProps) {
  function approvePost(post: StudioPost) {
    onUpdatePost(post.id, { approvalDecision: 'approved', status: 'approved' });
    trackEvent(createTelemetryEvent('studio_post_approved', undefined, {
      postId: post.id,
      campaignId: post.campaignId,
      platform: post.platform,
    }));
  }

  return (
    <div className="studioPostList">
      {posts.map((post) => (
        <article key={post.id}>
          <span>{channelLabels[post.platform]} / {post.approvalDecision}</span>
          <strong>{post.hook}</strong>
          <p>{post.body}</p>
          <div className="studioPreviewMock"><span>{channelLabels[post.platform]} preview</span><strong>{post.assetPrompt}</strong></div>
          <p><b>CTA:</b> {post.cta}</p>
          <div className="studioApprovalActions">
            <button className="btn" type="button" onClick={() => approvePost(post)}>Approve</button>
            <button className="btn" type="button" onClick={() => onUpdatePost(post.id, { approvalDecision: 'revision', status: 'review' })}>Needs Revision</button>
          </div>
          <label className="studioField compactField"><span>Revision notes</span><textarea value={post.approvalNote} onChange={(event) => onUpdatePost(post.id, { approvalNote: event.target.value })} placeholder="What should change before this goes out?" /></label>
        </article>
      ))}
    </div>
  );
}
