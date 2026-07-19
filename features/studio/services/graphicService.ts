import type { StudioChannelId, StudioGraphicFormat, StudioGraphicSettings, StudioGraphicTemplate, StudioMediaAsset, StudioPost } from '@/features/studio/types/studio';

export const graphicTemplates: Array<{ id: StudioGraphicTemplate; label: string }> = [
  { id: 'provocative_question', label: 'Provocative Question' },
  { id: 'have_you_thought', label: 'Have You Thought About' },
  { id: 'spot_the_flaw', label: 'Can You Spot the Flaw' },
  { id: 'trust_this_headline', label: 'Would You Trust This Headline' },
  { id: 'street_lesson', label: 'Street Lesson' },
  { id: 'principle', label: 'Quote or Principle' },
  { id: 'better_decisions', label: 'Better Thinking, Better Decisions' },
];

export const platformGraphicDimensions: Record<StudioChannelId, { width: number; height: number; format: StudioGraphicFormat }> = {
  instagram: { width: 1080, height: 1080, format: 'square' },
  threads: { width: 1080, height: 1080, format: 'square' },
  linkedin: { width: 1200, height: 627, format: 'landscape' },
  facebook: { width: 1200, height: 630, format: 'landscape' },
  x: { width: 1200, height: 675, format: 'landscape' },
};

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapText(value: string, maxLength: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 5);
}

export function defaultGraphicSettings(post: StudioPost): StudioGraphicSettings {
  return {
    template: 'provocative_question',
    headline: post.hook,
    question: post.caption || post.body.split('\n')[0] || post.hook,
    supportingText: post.body.replace(/\s+/g, ' ').slice(0, 150),
    cta: post.cta || 'Try a free UThynk challenge.',
    website: 'uthynk.com',
  };
}

export function renderStudioGraphicSvg(platform: StudioChannelId, settings: StudioGraphicSettings) {
  const dimensions = platformGraphicDimensions[platform] || platformGraphicDimensions.linkedin;
  const headlineLines = wrapText(settings.headline, dimensions.width > 1100 ? 44 : 34);
  const questionLines = wrapText(settings.question, dimensions.width > 1100 ? 54 : 42);
  const supportingLines = wrapText(settings.supportingText, dimensions.width > 1100 ? 70 : 52);
  const accent = settings.template === 'principle' ? '#f6c64f' : '#5eead4';
  const secondary = settings.template === 'street_lesson' ? '#f6c64f' : '#9dd8ff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" role="img" aria-label="UThynk branded social graphic">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111936"/><stop offset="0.55" stop-color="#241346"/><stop offset="1" stop-color="#082f49"/></linearGradient>
    <radialGradient id="glow" cx="78%" cy="20%" r="68%"><stop offset="0" stop-color="${accent}" stop-opacity="0.22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <circle cx="${dimensions.width - 180}" cy="140" r="118" fill="none" stroke="${accent}" stroke-opacity="0.32" stroke-width="2"/>
  <path d="M${dimensions.width - 320} 95 C${dimensions.width - 220} 18 ${dimensions.width - 95} 58 ${dimensions.width - 72} 175" fill="none" stroke="#f6c64f" stroke-opacity="0.58" stroke-width="8" stroke-linecap="round"/>
  <text x="72" y="86" fill="#f6c64f" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900" letter-spacing="2">UThynk</text>
  <text x="72" y="126" fill="#e5e7eb" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" opacity="0.72">Better questions. Better judgment.</text>
  ${headlineLines.map((line, index) => `<text x="72" y="${190 + index * 44}" fill="${accent}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">${escapeXml(line)}</text>`).join('')}
  ${questionLines.map((line, index) => `<text x="72" y="${320 + index * 62}" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="950">${escapeXml(line)}</text>`).join('')}
  ${supportingLines.map((line, index) => `<text x="72" y="${dimensions.height - 170 + index * 32}" fill="#cbd5e1" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="650">${escapeXml(line)}</text>`).join('')}
  <rect x="72" y="${dimensions.height - 86}" width="${Math.min(520, dimensions.width - 144)}" height="46" rx="23" fill="${secondary}" fill-opacity="0.16" stroke="${secondary}" stroke-opacity="0.55"/>
  <text x="96" y="${dimensions.height - 55}" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="850">${escapeXml(settings.cta)}</text>
  <text x="${dimensions.width - 250}" y="${dimensions.height - 55}" fill="#f6c64f" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="850">${escapeXml(settings.website)}</text>
</svg>`;
}

export function createGraphicAsset(post: StudioPost, settings: StudioGraphicSettings, id: string, now = new Date().toISOString()): StudioMediaAsset {
  const dimensions = platformGraphicDimensions[post.platform] || platformGraphicDimensions.linkedin;
  const svg = renderStudioGraphicSvg(post.platform, settings);

  return {
    id,
    campaignId: post.campaignId,
    postId: post.id,
    title: `${post.platform} UThynk graphic`,
    assetType: 'graphic',
    prompt: `Local UThynk template graphic for ${post.platform}.`,
    format: dimensions.format,
    status: 'ready',
    fileUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    thumbnailUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    storagePath: `local-template/${post.id}/${id}.svg`,
    altText: settings.headline,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: svg.length,
    mimeType: 'image/svg+xml',
    version: 1,
    provider: 'local_template',
    generatedAt: now,
    graphicSettings: settings,
    createdAt: now,
  };
}
