# UThynk — Pass 1.3 (Pixel-perfect Home using provided frame)

This build wires all screens together with mock data (no Supabase / AI yet).

## Run locally
- npm i
- npm run dev

## Routes
- / (Home)
- /category/[slug] (Category Detail)
- /challenge/[id] (AI Thinking Session - mock feedback)
- /daily (Daily Challenge -> redirects to a challenge)
- /stats (Stats & Titles)
- /profile (Profile & Thinking Style)
- /login /about /store (placeholders)

Deployment note:
If you accidentally committed this into a subfolder in GitHub, set Vercel **Root Directory** to that folder.
