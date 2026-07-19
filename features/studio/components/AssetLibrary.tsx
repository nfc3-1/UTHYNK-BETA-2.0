'use client';

import type { StudioMediaAsset } from '@/features/studio/types/studio';

type AssetLibraryProps = {
  assets: StudioMediaAsset[];
};

export default function AssetLibrary({ assets }: AssetLibraryProps) {
  return (
    <div className="studioPostList">
      {assets.map((asset) => (
        <article key={asset.id}>
          <span>{asset.assetType} / {asset.status} / {asset.format}</span>
          <strong>{asset.title}</strong>
          <p>{asset.prompt}</p>
          <small>{asset.storagePath || asset.fileUrl ? 'Stored asset metadata ready.' : 'No uploaded file attached yet.'}</small>
        </article>
      ))}
    </div>
  );
}
