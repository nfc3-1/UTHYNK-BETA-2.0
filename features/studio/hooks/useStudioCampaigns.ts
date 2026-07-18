'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultChannels, starterAssets, starterCampaigns, starterPosts } from '@/features/studio/data/studioDefaults';
import { loadStudioState, saveStudioState } from '@/features/studio/services/campaignService';
import type { StudioState } from '@/features/studio/types/studio';
import { validateStudioState } from '@/features/studio/validation/studioSchemas';

const RECOVERY_KEY = 'uthynk-studio-recovery-v1';
const LEGACY_KEYS = ['uthynk-studio-v2', 'uthynk-studio-v1'];

const initialState: StudioState = {
  campaigns: starterCampaigns,
  posts: starterPosts,
  assets: starterAssets,
  channels: defaultChannels,
  metrics: [],
};

function loadRecoveryState() {
  for (const key of [RECOVERY_KEY, ...LEGACY_KEYS]) {
    const stored = window.localStorage.getItem(key);
    if (!stored) continue;

    try {
      return validateStudioState(JSON.parse(stored));
    } catch (error) {
      console.error('Studio recovery data could not be parsed.', { key, error });
      continue;
    }
  }

  return initialState;
}

export function useStudioCampaigns() {
  const [state, setState] = useState<StudioState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [recoveryWarning, setRecoveryWarning] = useState<string | null>(null);
  const [rawRecoveryData, setRawRecoveryData] = useState<string | null>(null);

  const exportRecoveryData = useCallback(() => {
    const raw = rawRecoveryData || window.localStorage.getItem(RECOVERY_KEY) || '';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `uthynk-studio-recovery-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }, [rawRecoveryData]);

  useEffect(() => {
    let mounted = true;

    loadStudioState()
      .then((nextState) => {
        if (!mounted) return;
        setState(nextState);
        setBackendAvailable(true);
        window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(nextState));
      })
      .catch(() => {
        if (!mounted) return;
        const raw = window.localStorage.getItem(RECOVERY_KEY) || LEGACY_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean) || null;
        setState(loadRecoveryState());
        setBackendAvailable(false);
        setRawRecoveryData(raw);
        setRecoveryWarning('Studio could not reach Supabase, so browser recovery data is being shown. Export the raw recovery file before clearing browser storage.');
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!(recoveryWarning && rawRecoveryData)) {
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(state));
    }

    if (!backendAvailable) return;

    const handle = window.setTimeout(() => {
      saveStudioState(validateStudioState(state)).catch(() => setBackendAvailable(false));
    }, 400);

    return () => window.clearTimeout(handle);
  }, [backendAvailable, hydrated, rawRecoveryData, recoveryWarning, state]);

  return useMemo(
    () => ({
      ...state,
      setState,
      hydrated,
      backendAvailable,
      recoveryWarning,
      rawRecoveryData,
      exportRecoveryData,
    }),
    [backendAvailable, exportRecoveryData, hydrated, rawRecoveryData, recoveryWarning, state]
  );
}
