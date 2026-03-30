# TradeZone

## Current State
Backend has fetchYahooPrices using IC HTTP outcalls with transform=null. This causes silent failures because all replica nodes must return identical responses — any minor difference (like response headers or timestamps) breaks consensus. Frontend falls back to CORS proxies which are also unreliable.

## Requested Changes (Diff)

### Add
- Transform function in backend to strip non-deterministic parts of HTTP responses
- Additional free price API endpoints as fallback (Yahoo Finance v8 chart API)
- Manual refresh button in the Markets page

### Modify
- Backend fetchYahooPrices to use proper transform function
- Frontend price fetching to try multiple Yahoo Finance endpoints
- Error feedback when prices are stale

### Remove
- Nothing removed

## Implementation Plan
1. Update backend main.mo to add a transform function that keeps only the response body (strips headers/status nondeterminism)
2. Update frontend to handle failures more gracefully and show manual refresh button
3. Improve CORS proxy fallback with additional endpoints
