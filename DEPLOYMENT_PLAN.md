# Deployment plan for `plan`

## Goal
Make the site available online by link, usable from laptop and phone, with shared progress across devices.

## Recommended stack

### Frontend
- Cloudflare Pages or GitHub Pages
- Static hosting for all `.html`, `.js`, `.css` files in `plan/`

### Backend
- FastAPI backend from `plan/backend`
- Host on Render or Railway

### Database
- Recommended: Supabase Postgres
- Backup/temporary: SQLite only for local development

## Why this stack
- Static pages are cheap and easy to publish
- API handles shared state and avoids `localStorage` conflicts
- Postgres is much safer than SQLite for a public online site
- Free tiers exist for all parts of the stack

## What should live in the backend
- Main tracker progress
- Profile stats and streaks
- Shop purchases and achievements
- Game XP and best results
- Verification state
- Any cross-device data

## What can stay on the frontend
- Animations
- Modals
- Navigation
- Visual themes
- Local fallback cache

## Suggested rollout order
1. Deploy backend
2. Connect frontend pages to API URL
3. Move persistent state to backend
4. Replace SQLite with Supabase if you need long-term storage
5. Deploy frontend to Pages
6. Test on phone and laptop

## Fastest free route
1. Put backend on Render
2. Put frontend on Cloudflare Pages
3. Set `planApiBase` in browser/local config to the backend URL
4. Test:
   - `/api/health`
   - main tracker progress
   - profile stats
   - shop purchases
   - game progress

## Notes
- Keep `localStorage` as a fallback only.
- Treat backend as the source of truth.
- If you want true login/accounts later, add user IDs and auth tokens.
