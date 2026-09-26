'use client';
import { useEffect, useState } from 'react';

type Access = { role: string; section_grants: Record<string, string>; updated_at?: string };
type User = { id: string; email: string; username: string; account_access: Access | Access[] | null };
type Section = { id: string; label: string };
function current(user: User): Access {
  return (Array.isArray(user.account_access) ? user.account_access[0] : user.account_access) || { role: 'user', section_grants: {} };
}
export default function AdminAccess() {
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [actorId, setActorId] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function load(search = query, index = page) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/access?q=${encodeURIComponent(search)}&page=${index}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsers(data.users); setSections(data.sections); setActorId(data.actorId); setPage(index);
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load('', 0); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function edit(user: User, value: Access) {
    setUsers(items => items.map(item => item.id === user.id ? { ...item, account_access: value } : item));
  }
  async function save(user: User) {
    setBusy(true); setStatus('');
    try {
      const access = current(user);
      const response = await fetch('/api/admin/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, role: access.role, sections: Object.keys(access.section_grants) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatus(`Saved access for ${user.email}.`); await load();
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }
  return <>
    <form onSubmit={event => { event.preventDefault(); void load(query, 0); }}>
      <label>Find registered users <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Email or username" /></label> <button disabled={busy}>Search</button>
    </form>
    <p role="status">{status}</p>
    {users.map(user => {
      const access = current(user);
      return <fieldset key={user.id} disabled={busy || actorId === user.id} style={{ margin: '16px 0', padding: 16 }}>
        <legend>{user.username} — {user.email}</legend>
        <small>{user.id}{actorId === user.id ? ' · Your account (protected)' : ''}</small>
        <p><label>Role <select value={access.role} onChange={event => {
          const role = event.target.value;
          const grants = { ...access.section_grants };
          if (role === 'teacher') grants.teacher ||= 'Pending save';
          edit(user, { ...access, role, section_grants: grants });
        }}><option value="user">Standard user</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></label></p>
        {access.role === 'admin' ? <p>Administrators can access every restricted section.</p> : sections.filter(section => section.id !== 'admin').map(section => <p key={section.id}><label>
          <input type="checkbox" checked={Boolean(access.section_grants[section.id])} onChange={event => {
            const grants = { ...access.section_grants };
            if (event.target.checked) grants[section.id] = 'Pending save'; else delete grants[section.id];
            edit(user, { ...access, section_grants: grants, role: section.id === 'teacher' && !event.target.checked && access.role === 'teacher' ? 'user' : access.role });
          }} /> {section.label}
        </label>{access.section_grants[section.id] ? <small> · Granted: {access.section_grants[section.id]}</small> : null}</p>)}
        <button type="button" onClick={() => void save(user)}>Save changes</button>
      </fieldset>;
    })}
    <button disabled={busy || page === 0} onClick={() => void load(query, page - 1)}>Previous</button> <button disabled={busy || users.length < 25} onClick={() => void load(query, page + 1)}>Next</button>
  </>;
}
