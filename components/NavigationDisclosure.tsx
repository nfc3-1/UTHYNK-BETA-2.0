"use client";
import type { ReactNode } from 'react';

export default function NavigationDisclosure({ label, children, iconOnly = false, staff = false }: {
  label: string; children: ReactNode; iconOnly?: boolean; staff?: boolean;
}) {
  return <details className={`secondaryNavigation navigationDisclosure${iconOnly ? ' iconDisclosure' : ''}`} onToggle={event => {
    const current = event.currentTarget;
    if (current.open) current.closest('nav')?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(other => {
      if (other !== current) other.removeAttribute('open');
    });
  }} onKeyDown={event => {
    if (event.key === 'Escape') {
      event.currentTarget.removeAttribute('open');
      event.currentTarget.querySelector('summary')?.focus();
      event.stopPropagation();
    }
  }}>
    <summary aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
      {!iconOnly && <span>{label}</span>}
      {staff ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 4h16M2 10h16M2 16h16" /></svg>
        : <svg className="navigationChevron" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m4 7 6 6 6-6" /></svg>}
    </summary>
    <div className="secondaryNavigationLinks" onClick={event => {
      if ((event.target as Element).closest('a,button')) event.currentTarget.closest('details')?.removeAttribute('open');
    }}>{children}</div>
  </details>;
}
