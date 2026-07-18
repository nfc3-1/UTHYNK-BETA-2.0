import type { StudioGeneratedPackage, StudioGenerateRequest } from '@/features/studio/types/studio';
import { validateGeneratedPackage, validateGenerateRequest } from '@/features/studio/validation/studioSchemas';

export async function generateStudioPackage(request: StudioGenerateRequest): Promise<StudioGeneratedPackage> {
  const input = validateGenerateRequest(request);
  const response = await fetch('/api/studio/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Studio generation failed');
  }

  const payload = await response.json();
  return validateGeneratedPackage(payload, payload?.source === 'openai' ? 'openai' : 'fallback');
}
