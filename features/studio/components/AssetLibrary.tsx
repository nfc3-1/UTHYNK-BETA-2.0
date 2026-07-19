'use client';

import { useState } from 'react';
import type { StudioGraphicSettings, StudioMediaAsset, StudioPost } from '@/features/studio/types/studio';
import { defaultGraphicSettings, graphicTemplates } from '@/features/studio/services/graphicService';

type AssetLibraryProps = {
  assets: StudioMediaAsset[];
  posts: StudioPost[];
  onGenerateGraphic: (post: StudioPost, settings?: StudioGraphicSettings) => Promise<void>;
  onUpdateAsset: (id: string, patch: Partial<StudioMediaAsset>) => void;
  onRemoveAsset: (id: string) => void;
};

async function downloadGraphic(asset: StudioMediaAsset) {
  if (!asset.fileUrl) return;
  const image = new Image();
  image.decoding = 'async';
  image.src = asset.fileUrl;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = asset.width || image.naturalWidth || 1080;
  canvas.height = asset.height || image.naturalHeight || 1080;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;

  const anchor = document.createElement('a');
  const url = window.URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = `${asset.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export default function AssetLibrary({ assets, posts, onGenerateGraphic, onUpdateAsset, onRemoveAsset }: AssetLibraryProps) {
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id || '');
  const selectedPost = posts.find((post) => post.id === selectedPostId) || posts[0];
  const selectedAsset = selectedPost ? assets.find((asset) => asset.postId === selectedPost.id && asset.assetType === 'graphic') : undefined;
  const [settings, setSettings] = useState<StudioGraphicSettings>(() => selectedAsset?.graphicSettings || (selectedPost ? defaultGraphicSettings(selectedPost) : {
    template: 'provocative_question',
    headline: '',
    question: '',
    supportingText: '',
    cta: 'Try a free UThynk challenge.',
    website: 'uthynk.com',
  }));
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function generate() {
    if (!selectedPost) return;
    setIsGenerating(true);
    setMessage('');

    try {
      await onGenerateGraphic(selectedPost, settings);
      setMessage('Graphic generated and saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Graphic generation failed.');
    } finally {
      setIsGenerating(false);
    }
  }

  function uploadReplacement(file: File | undefined) {
    if (!file || !selectedAsset) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateAsset(selectedAsset.id, {
        fileUrl: String(reader.result || ''),
        thumbnailUrl: String(reader.result || ''),
        status: 'ready',
        mimeType: file.type,
        fileSize: file.size,
      });
      setMessage('Replacement image attached.');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="studioPostList">
      <article>
        <span>Manual publishing mode / Local graphic generator</span>
        <strong>Create the post graphic</strong>
        <label className="studioField compactField"><span>Post</span>
          <select value={selectedPost?.id || ''} onChange={(event) => setSelectedPostId(event.target.value)}>
            {posts.map((post) => <option key={post.id} value={post.id}>{post.platform}: {post.hook}</option>)}
          </select>
        </label>
        <label className="studioField compactField"><span>Template</span>
          <select value={settings.template} onChange={(event) => setSettings((current) => ({ ...current, template: event.target.value as StudioGraphicSettings['template'] }))}>
            {graphicTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
          </select>
        </label>
        <label className="studioField compactField"><span>Headline</span><input value={settings.headline} onChange={(event) => setSettings((current) => ({ ...current, headline: event.target.value }))} /></label>
        <label className="studioField compactField"><span>Main question</span><textarea value={settings.question} onChange={(event) => setSettings((current) => ({ ...current, question: event.target.value }))} /></label>
        <label className="studioField compactField"><span>Supporting text</span><textarea value={settings.supportingText} onChange={(event) => setSettings((current) => ({ ...current, supportingText: event.target.value }))} /></label>
        <label className="studioField compactField"><span>Call to action</span><input value={settings.cta} onChange={(event) => setSettings((current) => ({ ...current, cta: event.target.value }))} /></label>
        <div className="studioApprovalActions">
          <button className="btn btnPrimary" type="button" onClick={generate} disabled={isGenerating || !selectedPost}>{isGenerating ? 'Generating...' : selectedAsset ? 'Regenerate Graphic' : 'Generate Graphic'}</button>
          {selectedAsset?.fileUrl && <button className="btn" type="button" onClick={() => void downloadGraphic(selectedAsset)}>Download PNG</button>}
        </div>
        {selectedAsset?.fileUrl && <img className="studioGraphicPreview" src={selectedAsset.fileUrl} alt={selectedAsset.altText || selectedAsset.title} />}
        <label className="studioField compactField"><span>Upload replacement</span><input type="file" accept="image/*" onChange={(event) => uploadReplacement(event.target.files?.[0])} /></label>
        {selectedAsset && <button className="btn" type="button" onClick={() => onRemoveAsset(selectedAsset.id)}>Remove Image</button>}
        {message && <p className="studioMuted studioInlineNote">{message}</p>}
      </article>
      {assets.map((asset) => (
        <article key={asset.id}>
          <span>{asset.assetType} / {asset.status} / {asset.format}</span>
          <strong>{asset.title}</strong>
          <p>{asset.prompt}</p>
          {asset.fileUrl && <img className="studioGraphicThumb" src={asset.fileUrl} alt={asset.altText || asset.title} />}
          <small>{asset.storagePath || asset.fileUrl ? 'Stored asset metadata ready.' : 'No uploaded file attached yet.'}</small>
        </article>
      ))}
    </div>
  );
}
