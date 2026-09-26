import { getStoredLanguageValue } from '@/lib/reasoningI18n';
import type { StudioGeneratedPackage, StudioGenerateRequest } from '@/features/studio/types/studio';
import { validateGeneratedPackage, validateGenerateRequest } from '@/features/studio/validation/studioSchemas';

export async function generateStudioPackage(request: StudioGenerateRequest): Promise<StudioGeneratedPackage> {
  const input = validateGenerateRequest({ ...request, language: getStoredLanguageValue() });
  const response = await fetch('/api/studio/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    throw new Error(failure.error || 'Studio generation failed');
  }

  const payload = await response.json();
  return validateGeneratedPackage(payload, payload?.source === 'openai' ? 'openai' : 'fallback');
}
