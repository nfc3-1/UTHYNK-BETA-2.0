# UThynk Mobile App Strategy

UThynk does not need to be rebuilt from scratch to become a mobile app. The best path is to keep the current Next.js product as the core experience, then expand mobile support in stages.

## Recommended Path

### 1. PWA First

Make UThynk installable from mobile Safari and Chrome.

This is the fastest beta path because it avoids App Store approval while still giving users a home-screen app experience.

Required work:

- Add a PWA manifest.
- Add app icons.
- Add splash screen assets.
- Improve mobile layout.
- Test Supabase auth on mobile browsers.
- Verify the free-pass and signup flow on mobile.
- Verify voice input on mobile.
- Keep the feedback link easy to access.

### 2. Capacitor Wrapper

After the mobile web experience feels stable, wrap the existing app with Capacitor for iOS and Android.

This keeps the same:

- Vercel deployment
- Supabase auth and persistence
- OpenAI reasoning API
- Existing UI and product logic

Capacitor also gives access to native features later:

- Push notifications
- Haptics
- Microphone enhancements
- Local device storage
- App Store and Google Play distribution

### 3. React Native Later, If Needed

A full React Native rebuild would provide the most native feel, but it would also be the slowest and most expensive path.

Do not start with React Native for beta unless the current web experience cannot support the product vision.

## Mobile Readiness Checklist

Before packaging as a native app, verify:

- Mobile responsive layout
- Touch-friendly controls
- Mobile navigation
- PWA install behavior
- Mobile auth persistence
- Free-pass flow
- Signup flow
- Profile persistence
- Voice input
- Feedback submission
- Thinking tools usability
- Timeline usability
- Reasoning lab usability

## Strategic Recommendation

Build mobile in this order:

1. Polish mobile web.
2. Add PWA install support.
3. Use beta testers on mobile browser and home-screen install.
4. Wrap with Capacitor once the core reasoning loop proves retention.
5. Add native-only features after the product loop is stable.

This keeps the codebase simpler and gets UThynk onto phones quickly without splitting development too early.
