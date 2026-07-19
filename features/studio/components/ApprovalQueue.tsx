'use client';

import { useState } from 'react';
import { channelLabels } from '@/features/studio/data/studioDefaults';
import type { StudioMediaAsset, StudioPost } from '@/features/studio/types/studio';
import { createTelemetryEvent, trackEvent } from '@/lib/telemetry';

type ApprovalQueueProps = {
  posts: StudioPost[];
  onUpdatePost: (id: string, patch: Partial<StudioPost>) => void;
  assets: StudioMediaAsset[];
  onApprove: (post: StudioPost, asset?: StudioMediaAsset) => Promise<void>;
  onRequestChanges: (post: StudioPost, reason: string) => Promise<void>;
  onReject: (post: StudioPost, reason: string) => Promise<void>;
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  generated: 'Generated',
  review: 'In Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  ready_to_publish: 'Ready to Publish',
  published: 'Published',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
};

export default function ApprovalQueue({ posts, onUpdatePost, assets, onApprove, onRequestChanges, onReject }: ApprovalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function runAction(post: StudioPost, action: () => Promise<void>, success: string) {
    setProcessingId(post.id);
    setMessage('');

    try {
      await action();
      setMessage(success);
      if (success.toLowerCase().includes('approved')) {
        trackEvent(createTelemetryEvent('studio_post_approved', undefined, {
          postId: post.id,
          campaignId: post.campaignId,
          platform: post.platform,
        }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Approval update failed.');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="studioPostList">
      {message && <p className="studioMuted studioInlineNote">{message}</p>}
      {posts.map((post) => (
        <article key={post.id} className={`studioStatus-${post.status}`}>
          <span>{channelLabels[post.platform]} / <b>{statusLabels[post.status] || post.status}</b></span>
          <strong>{post.hook}</strong>
          <p>{post.body}</p>
          {assets.find((asset) => asset.postId === post.id && asset.fileUrl) ? (
            <img className="studioGraphicPreview" src={assets.find((asset) => asset.postId === post.id && asset.fileUrl)?.fileUrl} alt={post.hook} />
          ) : (
            <div className="studioPreviewMock"><span>{channelLabels[post.platform]} preview</span><strong>{post.assetPrompt}</strong></div>
          )}
          <p><b>CTA:</b> {post.cta}</p>
          <div className="studioApprovalActions">
            <button
              className="btn"
              type="button"
              disabled={processingId === post.id || post.status === 'approved'}
              onClick={() => runAction(post, () => onApprove(post, assets.find((asset) => asset.postId === post.id && asset.fileUrl)), 'Post approved and saved.')}
            >
              {post.status === 'approved' ? 'Approved' : processingId === post.id ? 'Saving...' : 'Approve'}
            </button>
            <button
              className="btn"
              type="button"
              disabled={processingId === post.id}
              onClick={() => runAction(post, () => onRequestChanges(post, post.approvalNote), 'Changes requested and saved.')}
            >
              Request Changes
            </button>
            <button
              className="btn"
              type="button"
              disabled={processingId === post.id}
              onClick={() => runAction(post, () => onReject(post, post.approvalNote), 'Post rejected and saved.')}
            >
              Reject
            </button>
          </div>
          {post.approvedAt && <small>Approved {new Date(post.approvedAt).toLocaleString()}</small>}
          <label className="studioField compactField"><span>Reason or revision notes</span><textarea value={post.approvalNote} onChange={(event) => onUpdatePost(post.id, { approvalNote: event.target.value })} placeholder="What should change before this goes out?" /></label>
        </article>
      ))}
    </div>
  );
}
