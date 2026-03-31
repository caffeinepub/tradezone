# TradeZone

## Current State
- Users type their name on the Dashboard (stored in localStorage under `tradezone_name_${userId}`).
- `useTradingData.ts` leaderboard is a static single-entry array `[{ userId: "You", balance, portfolioValue: 0 }]` — no multi-user support.
- `Leaderboard.tsx` falls back to mock data when `leaderboard.length === 0`, but since it always has 1 entry, only "You" ever appears.
- Backend `main.mo` has `getLeaderboard()` and user management but no `displayName` field and the frontend never calls backend trading functions (all trading is localStorage-only).
- `backendInterface` in `backend.d.ts` is empty — auto-generated from Motoko; will be regenerated after backend changes.

## Requested Changes (Diff)

### Add
- `displayName : Text` field to `UserData` in backend
- `setDisplayName(name: Text)` public shared function in backend (stores name against caller's principal)
- `displayName` field to `LeaderboardEntry` type in backend
- Frontend: after user saves name in Dashboard, call `actor.setDisplayName(name)` to register on backend
- Frontend: `useTradingData` fetches real leaderboard from backend via `actor.getLeaderboard()` so all registered users appear
- Leaderboard display: show `displayName` (if non-empty) instead of truncated `userId`

### Modify
- `newUser()` in backend: add `displayName = ""` to initial user data
- `getLeaderboard()` in backend: include `displayName` in each `LeaderboardEntry`
- `useTradingData.ts`: add `userId` prop / read from hook context, fetch leaderboard from backend actor, refresh periodically
- `Dashboard.tsx`: after `saveName()` saves to localStorage, also call `actor.setDisplayName(trimmed)` on the backend
- `Leaderboard.tsx`: use `displayName` field when available; fall back to truncated `userId`
- `LeaderboardEntry` TypeScript interface: add `displayName: string`

### Remove
- Static mock leaderboard hardcoded fallback in `useTradingData.ts` (the single `{ userId: "You" }` entry)
- `MOCK_LEADERBOARD` can remain as a UI placeholder only when backend returns 0 entries

## Implementation Plan
1. Update `src/backend/main.mo`: add `displayName` to `UserData` and `LeaderboardEntry`; add `setDisplayName` function; update `getLeaderboard` to return display names.
2. Update frontend `LeaderboardEntry` interface in `useTradingData.ts` to include `displayName: string`.
3. In `useTradingData.ts`: use backend actor to fetch leaderboard (with polling or on-demand refresh); expose `setDisplayName` helper.
4. In `Dashboard.tsx`: when user saves name, also call `actor.setDisplayName`; pass actor via props or use `useActor` hook.
5. In `Leaderboard.tsx`: render `entry.displayName || truncate(entry.userId)` as the trader name.
