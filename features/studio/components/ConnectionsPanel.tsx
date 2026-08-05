'use client';

import { useState } from 'react';
import type { StudioChannel } from '@/features/studio/types/studio';

type ConnectionsPanelProps = {
  channels: StudioChannel[];
};

export default function ConnectionsPanel({ channels }: ConnectionsPanelProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function connect(platform: string) {
    setConnecting(platform);
    setMessage('');

    try {
      const response = await fetch(`/api/studio/connections/${platform}/connect`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (payload.authorizationUrl) {
        window.location.href = payload.authorizationUrl;
        return;
      }

      setMessage(payload.error || 'Connection is not available for this provider yet.');
    } catch {
      setMessage('Connection request failed.');
    } finally {
      setConnecting(null);
    }
  }

  return (
    <div className="studioPostList">
      {message && <p>{message}</p>}
      {channels.map((channel) => (
        <article key={channel.id}>
          <span>{channel.connectionStatus || 'not_connected'}</span>
          <strong>{channel.label}</strong>
          <p>{channel.accountLabel || 'OAuth adapter placeholder. Tokens should be stored by provider-specific server code, never in the browser.'}</p>
          <button
            className="studioSecondaryButton"
            type="button"
            disabled={connecting === channel.id}
            onClick={() => connect(channel.id)}
          >
            {connecting === channel.id ? 'Connecting...' : 'Connect account'}
          </button>
        </article>
      ))}
    </div>
  );
}
