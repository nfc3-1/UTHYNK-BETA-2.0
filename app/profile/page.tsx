'use client';
import { useState } from 'react';

export default function Profile(){
  const [name, setName] = useState('');
  const [age, setAge] = useState('16-18');
  const [style, setStyle] = useState('balanced');

  return (
    <div className="col">
      <div className="card p-20">
        <h1 className="heroTitle">Your Profile</h1>
        <p className="heroSub">Adjust how UThynk challenges your thinking. You’re always in control.</p>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>Basic info</div>
        <div className="mt-16" style={{display:'grid', gap:10}}>
          <label className="smallMuted">Display name (optional)</label>
          <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Nick" />

          <label className="smallMuted mt-12">Age range (used only to adjust tone)</label>
          <select className="input" value={age} onChange={(e)=>setAge(e.target.value)}>
            <option value="under-13">Under 13 (restricted)</option>
            <option value="13-15">13–15</option>
            <option value="16-18">16–18</option>
            <option value="18+">18+</option>
          </select>
        </div>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>Thinking style</div>
        <div className="smallMuted mt-12">How should UThynk challenge your thinking?</div>

        <div className="mt-16" style={{display:'grid', gap:10}}>
          <label className="card p-16" style={{cursor:'pointer', borderColor: style==='gentle' ? 'rgba(240,199,94,0.45)' : 'rgba(255,255,255,0.15)'}}>
            <input type="radio" name="style" checked={style==='gentle'} onChange={()=>setStyle('gentle')} />
            <b style={{marginLeft:8}}>Gentle Reflection</b>
            <div className="smallMuted mt-12">Explore ideas with guidance and clarity.</div>
          </label>

          <label className="card p-16" style={{cursor:'pointer', borderColor: style==='balanced' ? 'rgba(240,199,94,0.45)' : 'rgba(255,255,255,0.15)'}}>
            <input type="radio" name="style" checked={style==='balanced'} onChange={()=>setStyle('balanced')} />
            <b style={{marginLeft:8}}>Balanced Challenge (default)</b>
            <div className="smallMuted mt-12">Test ideas while staying constructive.</div>
          </label>

          <label className="card p-16" style={{cursor:'pointer', borderColor: style==='strong' ? 'rgba(240,199,94,0.45)' : 'rgba(255,255,255,0.15)'}}>
            <input type="radio" name="style" checked={style==='strong'} onChange={()=>setStyle('strong')} />
            <b style={{marginLeft:8}}>Strong Challenge</b>
            <div className="smallMuted mt-12">Stress-test ideas from multiple angles.</div>
          </label>
        </div>

        <div className="mt-16 smallMuted">
          On sensitive topics (mental health, self-harm, trauma, medical or legal issues), UThynk always prioritizes safety and support.
        </div>
      </div>

      <div className="card p-20">
        <div style={{fontWeight:900}}>Privacy</div>
        <div className="smallMuted mt-12">
          Your thinking sessions are private. UThynk does not rank, score, or label your beliefs.
        </div>
      </div>
    </div>
  );
}
