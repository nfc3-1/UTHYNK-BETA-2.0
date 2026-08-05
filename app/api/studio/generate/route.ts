import { NextResponse } from 'next/server';
import { activeChannelIds, channelRegistry } from '@/features/studio/data/channelRegistry';
import type { StudioGenerateRequest } from '@/features/studio/types/studio';
import { validateGeneratedPackage, validateGenerateRequest } from '@/features/studio/validation/studioSchemas';
import { getStudioAccess } from '@/lib/studioAuth';
import { trackServerEvent } from '@/lib/telemetry';

function fallbackPackage(input: StudioGenerateRequest) {
  const channels = input.enabledChannels?.length ? input.enabledChannels : activeChannelIds;
  const objective = input.objective || 'Promote UThynk reasoning challenges';
  const audience = input.audience || 'curious thinkers';
  const source = input.sourceQuestion || 'a real UThynk question';

  return {
    campaign: {
      name: input.campaignName || `Weekly UThynk campaign for ${audience}`,
      objective,
      audience,
      offer: 'Try three free reasoning challenges.',
      coreMessage: 'UThynk helps people see the perspective they had not considered.',
      brandPillar: 'Perspective expansion',
      campaignType: 'Weekly campaign',
      landingPage: 'https://uthynk.com',
    },
    posts: channels.map((platform, index) => ({
      platform,
      hook: [
        'The strongest answer is usually hiding one question you did not ask.',
        'What if better thinking starts with noticing the angle you skipped?',
        'Most people defend their first answer. UThynk trains the next question.',
        'A good challenge should make you pause before you prove yourself right.',
      ][index % 4],
      body: `This week, UThynk is focused on ${objective.toLowerCase()} for ${audience}. The source is ${source}. The post should show one real decision, one missed perspective, and one reason to try a short reasoning challenge.`,
      cta: 'Try a free UThynk reasoning challenge.',
      hashtags: platform === 'threads' ? ['#UThynk'] : ['#UThynk', '#BetterThinking', '#Reasoning'],
      caption: `Weekly ${platform} draft for ${audience}.`,
      assetPrompt: `Create a premium UThynk ${platform} visual: a real question, a missed perspective, and a small growth signal. Dark navy, restrained gold, teal accent, clean typography.`,
      suggestedDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'][index % 4],
      suggestedTime: ['8:00 AM', '11:30 AM', '5:00 PM', '7:30 PM'][index % 4],
    })),
    assets: [
      {
        title: 'Weekly campaign visual system',
        assetType: 'graphic',
        prompt: `Create square, portrait, and landscape campaign visuals for: ${objective}. Audience: ${audience}. Source: ${source}.`,
        format: 'square',
      },
      {
        title: '30-second founder video storyboard',
        assetType: 'video',
        prompt: `Scene 1: ask a real reasoning question. Scene 2: reveal the missed perspective. Scene 3: show UThynk growth feedback. Scene 4: invite users to try three free challenges.`,
        format: 'portrait',
      },
    ],
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const source = fenced || trimmed;
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');

  if (start < 0 || end < 0 || end <= start) {
    throw new Error('No JSON object found');
  }

  return JSON.parse(source.slice(start, end + 1));
}

export async function POST(request: Request) {
  const access = await getStudioAccess();

  if (access.allowed !== true) {
    const reason = 'reason' in access ? access.reason : 'not_admin';
    return NextResponse.json({ error: 'Unauthorized' }, { status: reason === 'unauthenticated' ? 401 : 403 });
  }

  const input = validateGenerateRequest(await request.json().catch(() => ({})));
  const channels = input.enabledChannels?.length ? input.enabledChannels : activeChannelIds;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    await trackServerEvent('ai_generation_failed', access.user.id, { reason: 'missing_openai_api_key', route: '/api/studio/generate' });
    return NextResponse.json(validateGeneratedPackage(fallbackPackage({ ...input, enabledChannels: channels }), 'fallback'), { status: 200 });
  }

  const prompt = `You are UThynk Studio, Nick's private weekly marketing assistant. Build a one-week cross-platform campaign.

Goal: ${input.objective || 'Promote UThynk reasoning challenges'}
Audience: ${input.audience || 'curious thinkers'}
Selected UThynk source question: ${input.sourceQuestion || 'a real UThynk question'}
Cadence: ${input.cadence || 'one week'}
Channels: ${channels.join(', ')}
Brand rules: ${input.brandRules.length ? input.brandRules.join('; ') : 'Plain language, premium but practical, no hype.'}
Previous approved content: ${input.previousApprovedContent.slice(0, 5).map((post) => `${post.platform}: ${post.hook}`).join(' | ') || 'None supplied.'}
Recent performance signals: ${input.recentPerformanceSignals.slice(0, 8).map((metric) => `${metric.platform || 'unknown'} ${metric.metricType}=${metric.metricValue}`).join(' | ') || 'None supplied.'}

Channel guidance:
${channels.map((channel) => `- ${channel}: ${channelRegistry[channel].tone}; supports ${channelRegistry[channel].capabilities.join(', ')}`).join('\n')}

Return strict JSON only with this shape:
{
  "campaign": { "name": string, "objective": string, "audience": string, "offer": string, "coreMessage": string, "brandPillar": string, "campaignType": string, "landingPage": string },
  "posts": [{ "platform": "linkedin"|"facebook"|"instagram"|"threads"|"x", "hook": string, "body": string, "cta": string, "hashtags": string[], "caption": string, "assetPrompt": string, "suggestedDay": string, "suggestedTime": string }],
  "assets": [{ "title": string, "assetType": "graphic"|"video", "prompt": string, "format": "square"|"portrait"|"landscape" }]
}

Make each post meaningfully different. Use plain language. Show why UThynk is not just another chatbot: it reveals a perspective the user had not considered.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.78,
      messages: [
        { role: 'system', content: 'Return only valid JSON. No markdown, no commentary.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    await trackServerEvent('ai_generation_failed', access.user.id, { status: response.status, route: '/api/studio/generate' });
    return NextResponse.json(validateGeneratedPackage(fallbackPackage({ ...input, enabledChannels: channels }), 'fallback'), { status: 200 });
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || '';

  try {
    const generated = validateGeneratedPackage(extractJson(content), 'openai');
    await trackServerEvent('studio_campaign_generated', access.user.id, {
      source: 'openai',
      channels,
      postCount: generated.posts.length,
      assetCount: generated.assets.length,
    });
    return NextResponse.json(generated);
  } catch {
    await trackServerEvent('ai_generation_failed', access.user.id, { reason: 'invalid_model_json', route: '/api/studio/generate' });
    return NextResponse.json(validateGeneratedPackage(fallbackPackage({ ...input, enabledChannels: channels }), 'fallback'), { status: 200 });
  }
}

